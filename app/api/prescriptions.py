from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.prescription import Prescription
from app.db.models.user import User
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.schemas.common import MessageResponse
from app.services.prescription_service import PrescriptionService
from app.services.storage_service import storage_service
from app.services.audit_service import audit_service
from app.api.deps import get_current_user, require_roles

router = APIRouter(tags=["Prescriptions"])


@router.post("/visits/{visit_id}/prescriptions", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_prescription(
    visit_id: int,
    data: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
) -> PrescriptionResponse:
    """Create a prescription with multiple medicines and dosages for a visit."""
    prescription = PrescriptionService.create_prescription(
        db=db,
        visit_id=visit_id,
        data=data,
        actor=current_user.username
    )
    prescription = PrescriptionService.get_prescription(db, prescription.prescription_id)
    return PrescriptionResponse.model_validate(prescription)


@router.get("/visits/{visit_id}/prescriptions", response_model=List[PrescriptionResponse])
def list_visit_prescriptions(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[PrescriptionResponse]:
    """Retrieve all prescriptions for a specific visit."""
    prescriptions = PrescriptionService.list_visit_prescriptions(db, visit_id)
    return [PrescriptionResponse.model_validate(p) for p in prescriptions]


@router.get("/prescriptions/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PrescriptionResponse:
    """Retrieve a single prescription and its prescribed medicines."""
    prescription = PrescriptionService.get_prescription(
        db, prescription_id, actor=current_user.username
    )
    return PrescriptionResponse.model_validate(prescription)


@router.post("/prescriptions/{prescription_id}/upload", response_model=PrescriptionResponse)
async def upload_prescription_document(
    prescription_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "staff"))
) -> PrescriptionResponse:
    """Upload prescription scan or PDF document safely with generated UUID filename."""
    prescription = db.get(Prescription, prescription_id)
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prescription with ID {prescription_id} not found."
        )

    # Delete previous file if exists
    if prescription.prescription_file:
        storage_service.delete_file(prescription.prescription_file)

    safe_filename = await storage_service.save_file(file)
    prescription.prescription_file = safe_filename
    db.commit()
    db.refresh(prescription)

    audit_service.log(
        db=db,
        actor=current_user.username,
        action="PRESCRIPTION_FILE_UPLOADED",
        entity_type="Prescription",
        entity_id=prescription_id,
        details={"filename": safe_filename}
    )

    full_p = PrescriptionService.get_prescription(db, prescription_id)
    return PrescriptionResponse.model_validate(full_p)


@router.get("/prescriptions/{prescription_id}/file")
def download_prescription_document(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> FileResponse:
    """Stream stored prescription file securely with access control and audit logging."""
    prescription = db.get(Prescription, prescription_id)
    if not prescription or not prescription.prescription_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No document attached to this prescription."
        )

    file_path = storage_service.get_file_path(prescription.prescription_file)

    audit_service.log(
        db=db,
        actor=current_user.username,
        action="PRESCRIPTION_VIEWED",
        entity_type="Prescription",
        entity_id=prescription_id
    )

    media_type = "application/pdf" if file_path.suffix.lower() == ".pdf" else "image/jpeg"
    return FileResponse(path=file_path, media_type=media_type, filename=file_path.name)
