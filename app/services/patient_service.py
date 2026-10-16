from typing import Optional, Tuple, List
from datetime import date
from sqlalchemy import select, func, or_, and_, desc
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status

from app.db.models.patient import Patient
from app.db.models.patient_disease import PatientDisease
from app.db.models.disease import Disease
from app.db.models.visit import Visit
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientDetailResponse
from app.schemas.patient_disease import PatientDiseaseResponse
from app.schemas.visit import VisitResponse
from app.schemas.prescription import PrescriptionResponse
from app.schemas.reminder import VisitReminderResponse
from app.services.audit_service import audit_service


class PatientService:
    @staticmethod
    def get_latest_visit_date(db: Session, patient_id: int) -> Optional[date]:
        """
        Dynamically determine the patient's latest completed visit.
        Never stored directly in the patients table (Section 8, 36).
        """
        stmt = (
            select(Visit.visit_date)
            .where(Visit.patient_id == patient_id, Visit.visit_status == "completed")
            .order_by(desc(Visit.visit_date))
            .limit(1)
        )
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_next_follow_up_date(db: Session, patient_id: int) -> Optional[date]:
        """
        Dynamically determine the patient's nearest upcoming follow-up date.
        """
        today = date.today()
        stmt = (
            select(Visit.next_visit_date)
            .where(
                Visit.patient_id == patient_id,
                Visit.next_visit_date.is_not(None),
                Visit.next_visit_date >= today,
                Visit.visit_status.in_(["scheduled", "completed"])
            )
            .order_by(Visit.next_visit_date.asc())
            .limit(1)
        )
        return db.execute(stmt).scalar_one_or_none()

    @classmethod
    def create_patient(cls, db: Session, data: PatientCreate, actor: str) -> Patient:
        # Check duplicate WhatsApp number among active patients
        existing = db.execute(
            select(Patient).where(
                Patient.whatsapp_no == data.whatsapp_no,
                Patient.is_deleted == False
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An active patient with WhatsApp number '{data.whatsapp_no}' already exists (Patient ID: {existing.patient_id})."
            )

        patient = Patient(
            patient_name=data.patient_name.strip(),
            whatsapp_no=data.whatsapp_no,
            email=data.email.strip().lower() if data.email else None,
            date_of_birth=data.date_of_birth,
            gender=data.gender,
            address=data.address,
            emergency_contact=data.emergency_contact,
            whatsapp_opt_in=data.whatsapp_opt_in,
            is_deleted=False
        )
        db.add(patient)
        db.flush()  # to get patient.patient_id

        # Associate initial diseases if provided
        for dis_id in data.initial_disease_ids:
            # Check disease exists
            dis = db.get(Disease, dis_id)
            if dis:
                assoc = PatientDisease(
                    patient_id=patient.patient_id,
                    disease_id=dis_id,
                    diagnosed_at=date.today(),
                    is_active=True
                )
                db.add(assoc)

        db.commit()
        db.refresh(patient)

        audit_service.log(
            db=db,
            actor=actor,
            action="PATIENT_CREATED",
            entity_type="Patient",
            entity_id=patient.patient_id,
            details={"patient_name": patient.patient_name}
        )
        return patient

    @classmethod
    def get_patient(cls, db: Session, patient_id: int, include_deleted: bool = False) -> Patient:
        stmt = (
            select(Patient)
            .options(
                selectinload(Patient.patient_diseases).selectinload(PatientDisease.disease),
                selectinload(Patient.visits).selectinload(Visit.prescriptions),
                selectinload(Patient.visits).selectinload(Visit.doctor),
                selectinload(Patient.reminders)
            )
            .where(Patient.patient_id == patient_id)
        )
        if not include_deleted:
            stmt = stmt.where(Patient.is_deleted == False)

        patient = db.execute(stmt).scalar_one_or_none()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} not found."
            )
        return patient

    @classmethod
    def list_patients(
        cls,
        db: Session,
        search: Optional[str] = None,
        include_deleted: bool = False,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Patient], int]:
        stmt = select(Patient)
        if not include_deleted:
            stmt = stmt.where(Patient.is_deleted == False)

        if search:
            search_term = f"%{search.strip()}%"
            # Allow searching by ID if search term is numeric
            filters = [
                Patient.patient_name.ilike(search_term),
                Patient.whatsapp_no.ilike(search_term),
                Patient.email.ilike(search_term)
            ]
            if search.strip().isdigit():
                filters.append(Patient.patient_id == int(search.strip()))
            stmt = stmt.where(or_(*filters))

        # Total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.execute(count_stmt).scalar() or 0

        # Pagination
        stmt = stmt.order_by(Patient.patient_id.desc()).offset((page - 1) * page_size).limit(page_size)
        patients = list(db.execute(stmt).scalars().all())

        return patients, total

    @classmethod
    def update_patient(cls, db: Session, patient_id: int, data: PatientUpdate, actor: str) -> Patient:
        patient = cls.get_patient(db, patient_id)
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if field == "email" and value:
                value = value.strip().lower()
            if field == "patient_name" and value:
                value = value.strip()
            setattr(patient, field, value)

        db.commit()
        db.refresh(patient)

        audit_service.log(
            db=db,
            actor=actor,
            action="PATIENT_UPDATED",
            entity_type="Patient",
            entity_id=patient.patient_id,
            details={"updated_fields": list(update_data.keys())}
        )
        return patient

    @classmethod
    def soft_delete_patient(cls, db: Session, patient_id: int, actor: str) -> Patient:
        patient = cls.get_patient(db, patient_id)
        patient.is_deleted = True
        db.commit()

        audit_service.log(
            db=db,
            actor=actor,
            action="PATIENT_DELETED",
            entity_type="Patient",
            entity_id=patient.patient_id,
            details={"soft_deleted": True}
        )
        return patient

    @classmethod
    def restore_patient(cls, db: Session, patient_id: int, actor: str) -> Patient:
        patient = cls.get_patient(db, patient_id, include_deleted=True)
        patient.is_deleted = False
        db.commit()

        audit_service.log(
            db=db,
            actor=actor,
            action="PATIENT_RESTORED",
            entity_type="Patient",
            entity_id=patient.patient_id
        )
        return patient

    @classmethod
    def enrich_patient_response(cls, db: Session, patient: Patient) -> PatientResponse:
        """Helper to attach dynamic visit and disease counts to PatientResponse."""
        resp = PatientResponse.model_validate(patient)
        resp.latest_visit_date = cls.get_latest_visit_date(db, patient.patient_id)
        resp.next_follow_up_date = cls.get_next_follow_up_date(db, patient.patient_id)

        # Active disease count
        act_dis_count = db.execute(
            select(func.count()).where(
                PatientDisease.patient_id == patient.patient_id,
                PatientDisease.is_active == True
            )
        ).scalar() or 0
        resp.active_diseases_count = act_dis_count
        return resp
