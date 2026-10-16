from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.medicine import Medicine
from app.db.models.user import User
from app.schemas.medicine import MedicineCreate, MedicineUpdate, MedicineResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/medicines", tags=["Medicines"])


@router.post("", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    data: MedicineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
) -> MedicineResponse:
    """Create a new reusable medicine entry."""
    clean_name = data.medicine_name.strip()
    existing = db.execute(
        select(Medicine).where(Medicine.medicine_name.ilike(clean_name))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Medicine '{clean_name}' already exists in catalog."
        )

    medicine = Medicine(
        medicine_name=clean_name,
        generic_name=data.generic_name.strip() if data.generic_name else None,
        description=data.description
    )
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    return MedicineResponse.model_validate(medicine)


@router.get("", response_model=List[MedicineResponse])
def list_medicines(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[MedicineResponse]:
    """Retrieve catalog of reusable medicines with optional search."""
    stmt = select(Medicine)
    if search:
        search_pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            (Medicine.medicine_name.ilike(search_pattern)) |
            (Medicine.generic_name.ilike(search_pattern))
        )
    stmt = stmt.order_by(Medicine.medicine_name.asc())
    medicines = db.execute(stmt).scalars().all()
    return [MedicineResponse.model_validate(m) for m in medicines]


@router.get("/{medicine_id}", response_model=MedicineResponse)
def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> MedicineResponse:
    """Retrieve single medicine details."""
    medicine = db.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with ID {medicine_id} not found."
        )
    return MedicineResponse.model_validate(medicine)


@router.patch("/{medicine_id}", response_model=MedicineResponse)
def update_medicine(
    medicine_id: int,
    data: MedicineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor"))
) -> MedicineResponse:
    """Update medicine catalog entry."""
    medicine = db.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with ID {medicine_id} not found."
        )

    if data.medicine_name:
        medicine.medicine_name = data.medicine_name.strip()
    if data.generic_name is not None:
        medicine.generic_name = data.generic_name.strip() if data.generic_name else None
    if data.description is not None:
        medicine.description = data.description

    db.commit()
    db.refresh(medicine)
    return MedicineResponse.model_validate(medicine)
