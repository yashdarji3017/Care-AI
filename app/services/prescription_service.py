from datetime import date, datetime, timedelta, time, timezone
from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status, UploadFile

from app.db.models.prescription import Prescription
from app.db.models.prescription_medicine import PrescriptionMedicine
from app.db.models.visit import Visit
from app.db.models.patient import Patient
from app.db.models.medicine import Medicine
from app.db.models.disease import Disease
from app.db.models.patient_disease import PatientDisease
from app.db.models.reminder import VisitReminder
from app.schemas.prescription import PrescriptionCreate
from app.services.storage_service import storage_service
from app.services.audit_service import audit_service


class PrescriptionService:
    @classmethod
    def create_prescription(
        cls,
        db: Session,
        visit_id: int,
        data: PrescriptionCreate,
        actor: str,
        prescription_file_id: Optional[str] = None
    ) -> Prescription:
        visit = db.get(Visit, visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit with ID {visit_id} not found."
            )

        # 1. One-Click Disease Diagnosis Association
        patient_id = visit.patient_id
        # Associate by ID
        for dis_id in data.diagnosed_disease_ids:
            dis = db.get(Disease, dis_id)
            if dis:
                existing = db.execute(
                    select(PatientDisease).where(
                        PatientDisease.patient_id == patient_id,
                        PatientDisease.disease_id == dis_id
                    )
                ).scalar_one_or_none()
                if not existing:
                    db.add(PatientDisease(
                        patient_id=patient_id,
                        disease_id=dis_id,
                        diagnosed_at=visit.visit_date,
                        is_active=True,
                        notes=f"Diagnosed during Visit #{visit_id}"
                    ))

        # Associate by Name (doctor can write disease manually)
        for dis_name in data.diagnosed_disease_names:
            clean_name = dis_name.strip()
            if not clean_name:
                continue
            disease = db.execute(
                select(Disease).where(Disease.disease_name.ilike(clean_name))
            ).scalar_one_or_none()
            if not disease:
                disease = Disease(disease_name=clean_name)
                db.add(disease)
                db.flush()

            existing = db.execute(
                select(PatientDisease).where(
                    PatientDisease.patient_id == patient_id,
                    PatientDisease.disease_id == disease.disease_id
                )
            ).scalar_one_or_none()
            if not existing:
                db.add(PatientDisease(
                    patient_id=patient_id,
                    disease_id=disease.disease_id,
                    diagnosed_at=visit.visit_date,
                    is_active=True,
                    notes=f"Diagnosed during Visit #{visit_id}"
                ))

        # 2. Update follow-up interval if provided in same flow
        if data.follow_up_after_days and data.follow_up_after_days > 0:
            visit.follow_up_after_days = data.follow_up_after_days
            calculated_date = data.next_visit_date or (visit.visit_date + timedelta(days=data.follow_up_after_days))
            visit.next_visit_date = calculated_date

            # Schedule or update reminder
            patient = db.get(Patient, patient_id)
            if patient and patient.whatsapp_opt_in:
                scheduled_dt = datetime.combine(calculated_date, time(hour=9, minute=0)).replace(tzinfo=timezone.utc)
                formatted_date = calculated_date.strftime("%B %d, %Y")
                reminder_msg = (
                    f"Hello {patient.patient_name},\n\n"
                    f"This is a reminder that your follow-up visit is scheduled for {formatted_date}.\n\n"
                    f"Please contact the clinic if you need to reschedule.\n\n"
                    f"Thank you."
                )
                reminder = db.execute(
                    select(VisitReminder).where(
                        VisitReminder.visit_id == visit_id,
                        VisitReminder.status == "pending"
                    )
                ).scalar_one_or_none()
                if reminder:
                    reminder.scheduled_at = scheduled_dt
                    reminder.message = reminder_msg
                else:
                    db.add(VisitReminder(
                        patient_id=patient_id,
                        visit_id=visit_id,
                        scheduled_at=scheduled_dt,
                        message=reminder_msg,
                        status="pending",
                        reminder_type="follow_up"
                    ))

        # 3. Create Prescription Record
        prescription = Prescription(
            visit_id=visit_id,
            prescription_type=data.prescription_type,
            prescription_file=prescription_file_id,
            notes=data.notes
        )
        db.add(prescription)
        db.flush()

        # 4. Add prescribed medicines (supports manual typing and catalog selection)
        for med_item in data.medicines:
            medicine = None
            if med_item.medicine_id and med_item.medicine_id > 0:
                medicine = db.get(Medicine, med_item.medicine_id)

            if not medicine and med_item.medicine_name:
                clean_med_name = med_item.medicine_name.strip()
                if clean_med_name:
                    medicine = db.execute(
                        select(Medicine).where(Medicine.medicine_name.ilike(clean_med_name))
                    ).scalar_one_or_none()
                    if not medicine:
                        medicine = Medicine(medicine_name=clean_med_name)
                        db.add(medicine)
                        db.flush()

            if not medicine:
                # If neither id nor name matched
                continue

            presc_med = PrescriptionMedicine(
                prescription_id=prescription.prescription_id,
                medicine_id=medicine.medicine_id,
                dosage=med_item.dosage,
                frequency=med_item.frequency,
                duration_days=med_item.duration_days,
                instructions=med_item.instructions
            )
            db.add(presc_med)

        db.commit()
        db.refresh(prescription)

        audit_service.log(
            db=db,
            actor=actor,
            action="PRESCRIPTION_CREATED",
            entity_type="Prescription",
            entity_id=prescription.prescription_id,
            details={"visit_id": visit_id, "medicine_count": len(data.medicines)}
        )
        return prescription

    @classmethod
    def get_prescription(cls, db: Session, prescription_id: int, actor: Optional[str] = None) -> Prescription:
        stmt = (
            select(Prescription)
            .options(
                selectinload(Prescription.medicines).selectinload(PrescriptionMedicine.medicine),
                selectinload(Prescription.visit)
            )
            .where(Prescription.prescription_id == prescription_id)
        )
        prescription = db.execute(stmt).scalar_one_or_none()
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prescription with ID {prescription_id} not found."
            )

        if actor:
            audit_service.log(
                db=db,
                actor=actor,
                action="PRESCRIPTION_VIEWED",
                entity_type="Prescription",
                entity_id=prescription_id
            )

        return prescription

    @classmethod
    def list_visit_prescriptions(cls, db: Session, visit_id: int) -> List[Prescription]:
        stmt = (
            select(Prescription)
            .options(
                selectinload(Prescription.medicines).selectinload(PrescriptionMedicine.medicine)
            )
            .where(Prescription.visit_id == visit_id)
            .order_by(desc(Prescription.created_at))
        )
        return list(db.execute(stmt).scalars().all())
