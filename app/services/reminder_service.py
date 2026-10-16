from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status

from app.db.models.reminder import VisitReminder
from app.db.models.patient import Patient
from app.db.models.visit import Visit
from app.schemas.reminder import VisitReminderCreate, VisitReminderResponse
from app.services.whatsapp.provider import get_whatsapp_provider
from app.services.audit_service import audit_service
from app.core.config import settings
from app.core.logging import logger


class ReminderService:
    @classmethod
    def create_reminder(cls, db: Session, data: VisitReminderCreate, actor: str) -> VisitReminder:
        patient = db.get(Patient, data.patient_id)
        if not patient or patient.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {data.patient_id} not found."
            )

        visit = db.get(Visit, data.visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit with ID {data.visit_id} not found."
            )

        reminder = VisitReminder(
            patient_id=data.patient_id,
            visit_id=data.visit_id,
            scheduled_at=data.scheduled_at,
            message=data.message,
            reminder_type=data.reminder_type,
            status="pending",
            attempt_count=0
        )
        db.add(reminder)
        db.commit()
        db.refresh(reminder)

        audit_service.log(
            db=db,
            actor=actor,
            action="REMINDER_CREATED",
            entity_type="VisitReminder",
            entity_id=reminder.reminder_id,
            details={"patient_id": data.patient_id, "visit_id": data.visit_id}
        )
        return reminder

    @classmethod
    def get_reminder(cls, db: Session, reminder_id: int) -> VisitReminder:
        stmt = (
            select(VisitReminder)
            .options(selectinload(VisitReminder.patient), selectinload(VisitReminder.visit))
            .where(VisitReminder.reminder_id == reminder_id)
        )
        reminder = db.execute(stmt).scalar_one_or_none()
        if not reminder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Reminder with ID {reminder_id} not found."
            )
        return reminder

    @classmethod
    def list_reminders(
        cls,
        db: Session,
        status_filter: Optional[str] = None,
        patient_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[VisitReminder], int]:
        stmt = (
            select(VisitReminder)
            .options(selectinload(VisitReminder.patient))
        )
        if status_filter:
            stmt = stmt.where(VisitReminder.status == status_filter)
        if patient_id:
            stmt = stmt.where(VisitReminder.patient_id == patient_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.execute(count_stmt).scalar() or 0

        stmt = stmt.order_by(desc(VisitReminder.scheduled_at)).offset((page - 1) * page_size).limit(page_size)
        reminders = list(db.execute(stmt).scalars().all())

        return reminders, total

    @classmethod
    async def process_single_reminder(
        cls,
        db: Session,
        reminder: VisitReminder,
        actor: str = "SYSTEM_WORKER"
    ) -> bool:
        """
        Safely dispatches one reminder with WhatsApp consent check,
        bounded retry logic, status updates, and audit logging.
        """
        patient = reminder.patient or db.get(Patient, reminder.patient_id)
        if not patient or patient.is_deleted:
            reminder.status = "cancelled"
            reminder.failure_reason = "Patient not found or deactivated."
            db.commit()
            return False

        # Section 15: Check WhatsApp consent
        if not patient.whatsapp_opt_in:
            reminder.status = "cancelled"
            reminder.failure_reason = "Patient has opted out of WhatsApp messages."
            db.commit()
            logger.info(f"Reminder {reminder.reminder_id} cancelled: WhatsApp opt-in is false.")
            return False

        provider = get_whatsapp_provider()
        reminder.attempt_count += 1
        reminder.status = "processing"
        db.commit()

        try:
            result = await provider.send_message(
                to_phone=patient.whatsapp_no,
                message=reminder.message
            )

            now = datetime.now(timezone.utc)
            if result.success:
                reminder.status = "sent"
                reminder.sent_at = now
                reminder.delivery_status = result.delivery_status
                reminder.failure_reason = None
                db.commit()

                audit_service.log(
                    db=db,
                    actor=actor,
                    action="REMINDER_SENT",
                    entity_type="VisitReminder",
                    entity_id=reminder.reminder_id,
                    details={"delivery_status": result.delivery_status}
                )
                return True
            else:
                if reminder.attempt_count >= settings.REMINDER_RETRY_LIMIT:
                    reminder.status = "failed"
                    reminder.failure_reason = result.error_message or "Max retries reached without delivery."
                else:
                    reminder.status = "pending"  # Eligible for next retry cycle
                    reminder.failure_reason = f"Attempt {reminder.attempt_count} failed: {result.error_message}"
                db.commit()

                audit_service.log(
                    db=db,
                    actor=actor,
                    action="REMINDER_FAILED",
                    entity_type="VisitReminder",
                    entity_id=reminder.reminder_id,
                    details={"failure_reason": reminder.failure_reason, "attempt": reminder.attempt_count}
                )
                return False

        except Exception as ex:
            logger.error(f"Error executing reminder {reminder.reminder_id}: {str(ex)}")
            if reminder.attempt_count >= settings.REMINDER_RETRY_LIMIT:
                reminder.status = "failed"
                reminder.failure_reason = str(ex)
            else:
                reminder.status = "pending"
                reminder.failure_reason = f"Attempt {reminder.attempt_count} exception: {str(ex)}"
            db.commit()
            return False

    @classmethod
    async def process_due_reminders(cls, db: Session, limit: int = 50) -> int:
        """
        Background worker routine: fetches pending reminders scheduled on or before now
        using row-level locking or status transition to avoid duplicate delivery across workers.
        """
        now = datetime.now(timezone.utc)
        stmt = (
            select(VisitReminder)
            .options(selectinload(VisitReminder.patient))
            .where(
                VisitReminder.status == "pending",
                VisitReminder.scheduled_at <= now,
                VisitReminder.attempt_count < settings.REMINDER_RETRY_LIMIT
            )
            .order_by(VisitReminder.scheduled_at.asc())
            .limit(limit)
            .with_for_update(skip_locked=True)
        )

        try:
            reminders = list(db.execute(stmt).scalars().all())
        except Exception:
            # Fallback if DB dialect does not support SKIP LOCKED
            stmt_fallback = (
                select(VisitReminder)
                .options(selectinload(VisitReminder.patient))
                .where(
                    VisitReminder.status == "pending",
                    VisitReminder.scheduled_at <= now,
                    VisitReminder.attempt_count < settings.REMINDER_RETRY_LIMIT
                )
                .order_by(VisitReminder.scheduled_at.asc())
                .limit(limit)
            )
            reminders = list(db.execute(stmt_fallback).scalars().all())

        processed_count = 0
        for rem in reminders:
            success = await cls.process_single_reminder(db, rem, actor="SYSTEM_WORKER")
            if success:
                processed_count += 1

        return processed_count
