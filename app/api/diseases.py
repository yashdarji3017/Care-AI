from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.disease import Disease
from app.db.models.user import User
from app.schemas.disease import DiseaseCreate, DiseaseUpdate, DiseaseResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/diseases", tags=["Diseases"])


@router.post("", response_model=DiseaseResponse, status_code=status.HTTP_201_CREATED)
def create_disease(
    data: DiseaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
) -> DiseaseResponse:
    """Create a new reusable disease record."""
    clean_name = data.disease_name.strip()
    existing = db.execute(
        select(Disease).where(Disease.disease_name.ilike(clean_name))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Disease with name '{clean_name}' already exists."
        )

    disease = Disease(
        disease_name=clean_name,
        description=data.description
    )
    db.add(disease)
    db.commit()
    db.refresh(disease)
    return DiseaseResponse.model_validate(disease)


@router.get("", response_model=List[DiseaseResponse])
def list_diseases(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[DiseaseResponse]:
    """Retrieve all reusable diseases."""
    stmt = select(Disease)
    if search:
        stmt = stmt.where(Disease.disease_name.ilike(f"%{search.strip()}%"))
    stmt = stmt.order_by(Disease.disease_name.asc())
    diseases = db.execute(stmt).scalars().all()
    return [DiseaseResponse.model_validate(d) for d in diseases]


@router.get("/{disease_id}", response_model=DiseaseResponse)
def get_disease(
    disease_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> DiseaseResponse:
    """Retrieve single disease details."""
    disease = db.get(Disease, disease_id)
    if not disease:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disease with ID {disease_id} not found."
        )
    return DiseaseResponse.model_validate(disease)


@router.patch("/{disease_id}", response_model=DiseaseResponse)
def update_disease(
    disease_id: int,
    data: DiseaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
) -> DiseaseResponse:
    """Update disease description or name."""
    disease = db.get(Disease, disease_id)
    if not disease:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disease with ID {disease_id} not found."
        )

    if data.disease_name:
        disease.disease_name = data.disease_name.strip()
    if data.description is not None:
        disease.description = data.description

    db.commit()
    db.refresh(disease)
    return DiseaseResponse.model_validate(disease)
