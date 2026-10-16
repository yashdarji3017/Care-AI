from datetime import date, datetime, timedelta, timezone, time
from typing import Optional, List, Tuple
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status

from app.db.models.visit import Visit
from app.db.models.patient import Patient
from app.db.models.user import User
from app.db.models.reminder import VisitReminder
from app.db.models.disease import Disease
from app.db.models.patient_disease import PatientDisease
from app.db.models.prescription import Prescription
from app.db.models.prescription_medicine import PrescriptionMedicine
from app.db.models.medicine import Medicine
from app.schemas.visit import VisitCreate, VisitUpdate, VisitResponse
from app.services.audit_service import audit_service


class VisitService:
    @classmethod
    def calculate_follow_up_date(cls, visit_date: date, follow_up_days: Optional[int]) -> Optional[date]:
        """Calculate expected next visit date from visit_date and follow-up interval."""
        if follow_up_days and follow_up_days > 0:
            return visit_date + timedelta(days=follow_up_days)
        return None

    @classmethod
    def create_visit(cls, db: Session, data: VisitCreate, actor: str) -> Visit:
        # Check patient exists and is not deleted
        patient = db.get(Patient, data.patient_id)
        if not patient or patient.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Active patient with ID {data.patient_id} not found."
            )

        # Validate doctor if provided
        if data.doctor_id:
            doctor = db.get(User, data.doctor_id)
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with user ID {data.doctor_id} not found."
                )

        # Calculate next_visit_date if not explicitly provided but follow_up_after_days is given
        next_date = data.next_visit_date
        if not next_date and data.follow_up_after_days:
            next_date = cls.calculate_follow_up_date(data.visit_date, data.follow_up_after_days)

        visit = Visit(
            patient_id=data.patient_id,
            doctor_id=data.doctor_id,
            visit_date=data.visit_date,
            next_visit_date=next_date,
            follow_up_after_days=data.follow_up_after_days,
            visit_type=data.visit_type,
            visit_status=data.visit_status,
            doctor_notes=data.doctor_notes
        )
        db.add(visit)
        db.flush()

        # 1. Integrated Disease Diagnosis Association
        for dis_id in data.diagnosed_disease_ids:
            dis = db.get(Disease, dis_id)
            if dis:
                existing = db.execute(
                    select(PatientDisease).where(
                        PatientDisease.patient_id == patient.patient_id,
                        PatientDisease.disease_id == dis_id
                    )
                ).scalar_one_or_none()
                if not existing:
                    db.add(PatientDisease(
                        patient_id=patient.patient_id,
                        disease_id=dis_id,
                        diagnosed_at=data.visit_date,
                        is_active=True,
                        notes=f"Diagnosed during Visit #{visit.visit_id}"
                    ))

        for dis_name in data.diagnosed_disease_names:
            clean_name = dis_name.strip()
            if clean_name:
                disease = db.execute(
                    select(Disease).where(Disease.disease_name.ilike(clean_name))
                ).scalar_one_or_none()
                if not disease:
                    disease = Disease(disease_name=clean_name)
                    db.add(disease)
                    db.flush()
                existing = db.execute(
                    select(PatientDisease).where(
                        PatientDisease.patient_id == patient.patient_id,
                        PatientDisease.disease_id == disease.disease_id
                    )
                ).scalar_one_or_none()
                if not existing:
                    db.add(PatientDisease(
                        patient_id=patient.patient_id,
                        disease_id=disease.disease_id,
                        diagnosed_at=data.visit_date,
                        is_active=True,
                        notes=f"Diagnosed during Visit #{visit.visit_id}"
                    ))

        # 2. Integrated Prescription Creation if medicines provided
        if data.prescribed_medicines:
            prescription = Prescription(
                visit_id=visit.visit_id,
                prescription_type=data.prescription_type or "doctor",
                notes=data.doctor_notes
            )
            db.add(prescription)
            db.flush()

            for med_item in data.prescribed_medicines:
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
                if medicine:
                    db.add(PrescriptionMedicine(
                        prescription_id=prescription.prescription_id,
                        medicine_id=medicine.medicine_id,
                        dosage=med_item.dosage,
                        frequency=med_item.frequency,
                        duration_days=med_item.duration_days,
                        instructions=med_item.instructions
                    ))

        # 3. Automatically schedule a reminder if next_visit_date is present and patient opted in
        if data.create_reminder and next_date:
            scheduled_dt = datetime.combine(next_date, time(hour=9, minute=0)).replace(tzinfo=timezone.utc)
            formatted_date = next_date.strftime("%B %d, %Y")
            reminder_msg = (
                f"Hello {patient.patient_name},\n\n"
                f"This is a reminder that your follow-up visit is scheduled for {formatted_date}.\n\n"
                f"Please contact the clinic if you need to reschedule.\n\n"
                f"Thank you."
            )
            reminder = VisitReminder(
                patient_id=patient.patient_id,
                visit_id=visit.visit_id,
                scheduled_at=scheduled_dt,
                message=reminder_msg,
                status="pending",
                reminder_type="follow_up"
            )
            db.add(reminder)

        db.commit()
        db.refresh(visit)

        audit_service.log(
            db=db,
            actor=actor,
            action="VISIT_CREATED",
            entity_type="Visit",
            entity_id=visit.visit_id,
            details={"patient_id": visit.patient_id, "visit_type": visit.visit_type}
        )
        return visit

    @classmethod
    def get_visit(cls, db: Session, visit_id: int) -> Visit:
        stmt = (
            select(Visit)
            .options(
                selectinload(Visit.patient),
                selectinload(Visit.doctor),
                selectinload(Visit.prescriptions).selectinload(Prescription.medicines).selectinload(PrescriptionMedicine.medicine),
                selectinload(Visit.reminders)
            )
            .where(Visit.visit_id == visit_id)
        )
        visit = db.execute(stmt).scalar_one_or_none()
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit with ID {visit_id} not found."
            )
        return visit

    @classmethod
    def list_patient_visits(cls, db: Session, patient_id: int) -> List[Visit]:
        stmt = (
            select(Visit)
            .options(
                selectinload(Visit.doctor),
                selectinload(Visit.prescriptions).selectinload(Prescription.medicines).selectinload(PrescriptionMedicine.medicine),
                selectinload(Visit.reminders)
            )
            .where(Visit.patient_id == patient_id)
            .order_by(desc(Visit.visit_date), desc(Visit.visit_id))
        )
        return list(db.execute(stmt).scalars().all())

    @classmethod
    def update_visit(cls, db: Session, visit_id: int, data: VisitUpdate, actor: str) -> Visit:
        visit = cls.get_visit(db, visit_id)
        update_data = data.model_dump(exclude_unset=True)

        diagnosed_disease_ids = update_data.pop("diagnosed_disease_ids", None)
        diagnosed_disease_names = update_data.pop("diagnosed_disease_names", None)
        prescribed_medicines = update_data.pop("prescribed_medicines", None)

        # Recalculate next_visit_date if follow_up_after_days changed and next_visit_date wasn't explicitly supplied
        if "follow_up_after_days" in update_data and "next_visit_date" not in update_data:
            base_date = update_data.get("visit_date", visit.visit_date)
            update_data["next_visit_date"] = cls.calculate_follow_up_date(
                base_date, update_data["follow_up_after_days"]
            )

        for field, value in update_data.items():
            setattr(visit, field, value)

        # 1. Update/Add diagnosed diseases if provided
        if diagnosed_disease_ids is not None:
            for dis_id in diagnosed_disease_ids:
                dis = db.get(Disease, dis_id)
                if dis:
                    existing = db.execute(
                        select(PatientDisease).where(
                            PatientDisease.patient_id == visit.patient_id,
                            PatientDisease.disease_id == dis_id
                        )
                    ).scalar_one_or_none()
                    if not existing:
                        db.add(PatientDisease(
                            patient_id=visit.patient_id,
                            disease_id=dis_id,
                            diagnosed_at=visit.visit_date,
                            is_active=True,
                            notes=f"Diagnosed during Visit #{visit.visit_id}"
                        ))

        if diagnosed_disease_names is not None:
            for dis_name in diagnosed_disease_names:
                clean_name = dis_name.strip()
                if clean_name:
                    disease = db.execute(
                        select(Disease).where(Disease.disease_name.ilike(clean_name))
                    ).scalar_one_or_none()
                    if not disease:
                        disease = Disease(disease_name=clean_name)
                        db.add(disease)
                        db.flush()
                    existing = db.execute(
                        select(PatientDisease).where(
                            PatientDisease.patient_id == visit.patient_id,
                            PatientDisease.disease_id == disease.disease_id
                        )
                    ).scalar_one_or_none()
                    if not existing:
                        db.add(PatientDisease(
                            patient_id=visit.patient_id,
                            disease_id=disease.disease_id,
                            diagnosed_at=visit.visit_date,
                            is_active=True,
                            notes=f"Diagnosed during Visit #{visit.visit_id}"
                        ))

        # 2. Update prescribed medicines if provided
        if prescribed_medicines is not None:
            prescription = visit.prescriptions[0] if visit.prescriptions else None
            if not prescription and prescribed_medicines:
                prescription = Prescription(
                    visit_id=visit.visit_id,
                    prescription_type="doctor",
                    notes=visit.doctor_notes
                )
                db.add(prescription)
                db.flush()

            if prescription:
                for existing_med in list(prescription.medicines):
                    db.delete(existing_med)
                db.flush()

                for med_item in prescribed_medicines:
                    medicine = None
                    if med_item.get("medicine_id") and med_item["medicine_id"] > 0:
                        medicine = db.get(Medicine, med_item["medicine_id"])
                    if not medicine and med_item.get("medicine_name"):
                        clean_med_name = med_item["medicine_name"].strip()
                        if clean_med_name:
                            medicine = db.execute(
                                select(Medicine).where(Medicine.medicine_name.ilike(clean_med_name))
                            ).scalar_one_or_none()
                            if not medicine:
                                medicine = Medicine(medicine_name=clean_med_name)
                                db.add(medicine)
                                db.flush()
                    if medicine:
                        db.add(PrescriptionMedicine(
                            prescription_id=prescription.prescription_id,
                            medicine_id=medicine.medicine_id,
                            dosage=med_item.get("dosage", "1 tablet"),
                            frequency=med_item.get("frequency", "Twice daily"),
                            duration_days=med_item.get("duration_days", 1),
                            instructions=med_item.get("instructions")
                        ))

        # 3. If next_visit_date changed, update pending reminder
        if "next_visit_date" in update_data and visit.next_visit_date:
            scheduled_dt = datetime.combine(visit.next_visit_date, time(hour=9, minute=0)).replace(tzinfo=timezone.utc)
            formatted_date = visit.next_visit_date.strftime("%B %d, %Y")
            patient_name = visit.patient.patient_name if visit.patient else "Patient"
            new_msg = (
                f"Hello {patient_name},\n\n"
                f"This is a reminder that your follow-up visit is scheduled for {formatted_date}.\n\n"
                f"Please contact the clinic if you need to reschedule.\n\n"
                f"Thank you."
            )
            for rem in visit.reminders:
                if rem.status == "pending":
                    rem.scheduled_at = scheduled_dt
                    rem.message = new_msg

        db.commit()
        db.refresh(visit)

        audit_service.log(
            db=db,
            actor=actor,
            action="VISIT_UPDATED",
            entity_type="Visit",
            entity_id=visit.visit_id,
            details={"updated_fields": list(update_data.keys())}
        )
        return visit
