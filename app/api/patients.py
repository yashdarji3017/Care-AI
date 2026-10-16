from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.patient_disease import PatientDisease
from app.db.models.disease import Disease
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientDetailResponse,
)
from app.schemas.patient_disease import (
    PatientDiseaseCreate,
    PatientDiseaseResponse,
)
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.patient_service import PatientService
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "staff"))
) -> PatientResponse:
    """Register a new patient into the system."""
    patient = PatientService.create_patient(db, data, actor=current_user.username)
    return PatientService.enrich_patient_response(db, patient)


@router.get("", response_model=PaginatedResponse[PatientResponse])
def list_patients(
    search: Optional[str] = Query(None, description="Search by name, WhatsApp number, email, or patient ID"),
    include_deleted: bool = Query(False, description="Whether to include soft-deleted patients"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PaginatedResponse[PatientResponse]:
    """Search and filter patients with pagination."""
    patients, total = PatientService.list_patients(
        db, search=search, include_deleted=include_deleted, page=page, page_size=page_size
    )
    items = [PatientService.enrich_patient_response(db, p) for p in patients]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{patient_id}", response_model=PatientDetailResponse)
def get_patient_profile(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PatientDetailResponse:
    """Get complete patient profile: personal details, diseases, visits, prescriptions, and reminders."""
    patient = PatientService.get_patient(db, patient_id)
    enriched = PatientService.enrich_patient_response(db, patient)
    
    # Construct complete profile
    detail = PatientDetailResponse(
        **enriched.model_dump(),
        patient_diseases=[PatientDiseaseResponse.model_validate(pd) for pd in patient.patient_diseases],
        visits=[v for v in patient.visits],  # VisitResponse handles serialization
        reminders=[r for r in patient.reminders]
    )
    return detail


@router.patch("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "staff"))
) -> PatientResponse:
    """Update patient contact or demographic information."""
    patient = PatientService.update_patient(db, patient_id, data, actor=current_user.username)
    return PatientService.enrich_patient_response(db, patient)


@router.delete("/{patient_id}", response_model=MessageResponse)
def soft_delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin"))
) -> MessageResponse:
    """Soft delete patient to preserve clinical history without physical deletion."""
    PatientService.soft_delete_patient(db, patient_id, actor=current_user.username)
    return MessageResponse(message=f"Patient {patient_id} soft deleted successfully.")


@router.post("/{patient_id}/restore", response_model=MessageResponse)
def restore_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin"))
) -> MessageResponse:
    """Restore a previously soft-deleted patient."""
    PatientService.restore_patient(db, patient_id, actor=current_user.username)
    return MessageResponse(message=f"Patient {patient_id} restored successfully.")


# Patient Disease Junction Endpoints
@router.post("/{patient_id}/diseases", response_model=PatientDiseaseResponse, status_code=status.HTTP_201_CREATED)
def add_patient_disease(
    patient_id: int,
    data: PatientDiseaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
) -> PatientDiseaseResponse:
    """Associate a disease with a patient."""
    # Check patient exists
    PatientService.get_patient(db, patient_id)

    # Check disease exists
    dis = db.get(Disease, data.disease_id)
    if not dis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disease with ID {data.disease_id} not found."
        )

    # Check not already linked
    existing = db.execute(
        select(PatientDisease).where(
            PatientDisease.patient_id == patient_id,
            PatientDisease.disease_id == data.disease_id
        )
    ).scalar_one_or_none()

    if existing:
        existing.is_active = data.is_active
        existing.notes = data.notes
        existing.diagnosed_at = data.diagnosed_at
        db.commit()
        db.refresh(existing)
        return PatientDiseaseResponse.model_validate(existing)

    assoc = PatientDisease(
        patient_id=patient_id,
        disease_id=data.disease_id,
        diagnosed_at=data.diagnosed_at,
        is_active=data.is_active,
        notes=data.notes
    )
    db.add(assoc)
    db.commit()
    db.refresh(assoc)
    return PatientDiseaseResponse.model_validate(assoc)


@router.get("/{patient_id}/diseases", response_model=list[PatientDiseaseResponse])
def get_patient_diseases(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> list[PatientDiseaseResponse]:
    """Retrieve all recorded diseases for a patient."""
    PatientService.get_patient(db, patient_id)
    stmt = (
        select(PatientDisease)
        .where(PatientDisease.patient_id == patient_id)
        .order_by(PatientDisease.created_at.desc())
    )
    results = db.execute(stmt).scalars().all()
    return [PatientDiseaseResponse.model_validate(r) for r in results]


@router.delete("/{patient_id}/diseases/{disease_id}", response_model=MessageResponse)
def remove_patient_disease(
    patient_id: int,
    disease_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
) -> MessageResponse:
    """Remove a disease assignment from a patient."""
    assoc = db.execute(
        select(PatientDisease).where(
            PatientDisease.patient_id == patient_id,
            PatientDisease.disease_id == disease_id
        )
    ).scalar_one_or_none()

    if not assoc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disease association not found for this patient."
        )

    db.delete(assoc)
    db.commit()
    return MessageResponse(message="Disease association removed successfully.")
