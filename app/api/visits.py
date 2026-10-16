from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.db.session import get_db
from app.db.models.visit import Visit
from app.db.models.user import User
from app.schemas.visit import VisitCreate, VisitUpdate, VisitResponse
from app.services.visit_service import VisitService
from app.api.deps import get_current_user, require_roles

router = APIRouter(tags=["Visits"])


@router.post("/patients/{patient_id}/visits", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
def create_patient_visit(
    patient_id: int,
    data: VisitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "staff"))
) -> VisitResponse:
    """Record a clinical visit for a patient, calculate follow-up date, and schedule reminder."""
    # Ensure patient_id matches the route
    data.patient_id = patient_id
    if current_user.role == "doctor" and not data.doctor_id:
        data.doctor_id = current_user.user_id

    visit = VisitService.create_visit(db, data, actor=current_user.username)
    visit = VisitService.get_visit(db, visit.visit_id)
    return VisitResponse.model_validate(visit)


@router.get("/patients/{patient_id}/visits", response_model=List[VisitResponse])
def list_patient_visits(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[VisitResponse]:
    """Retrieve all visits for a specific patient in chronological order."""
    visits = VisitService.list_patient_visits(db, patient_id)
    return [VisitResponse.model_validate(v) for v in visits]


@router.get("/visits/{visit_id}", response_model=VisitResponse)
def get_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> VisitResponse:
    """Retrieve full visit details including prescriptions and reminders."""
    visit = VisitService.get_visit(db, visit_id)
    return VisitResponse.model_validate(visit)


@router.patch("/visits/{visit_id}", response_model=VisitResponse)
def update_visit(
    visit_id: int,
    data: VisitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "staff"))
) -> VisitResponse:
    """Update visit status, notes, follow-up intervals, or scheduled dates."""
    visit = VisitService.update_visit(db, visit_id, data, actor=current_user.username)
    visit = VisitService.get_visit(db, visit.visit_id)
    return VisitResponse.model_validate(visit)


@router.get("/visits", response_model=List[VisitResponse])
def list_all_visits(
    visit_status: Optional[str] = Query(None),
    visit_date: Optional[date] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[VisitResponse]:
    """List recent visits across the clinic."""
    stmt = select(Visit).order_by(desc(Visit.visit_date), desc(Visit.visit_id))
    if visit_status:
        stmt = stmt.where(Visit.visit_status == visit_status)
    if visit_date:
        stmt = stmt.where(Visit.visit_date == visit_date)
    stmt = stmt.limit(limit)
    visits = db.execute(stmt).scalars().all()
    return [VisitResponse.model_validate(v) for v in visits]
