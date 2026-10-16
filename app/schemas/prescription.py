from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.medicine import MedicineResponse


class PrescriptionMedicineBase(BaseModel):
    medicine_id: int | None = None
    medicine_name: str | None = None
    dosage: str = Field(..., example="1 tablet", max_length=100)
    frequency: str = Field(..., example="Twice daily", max_length=100)
    duration_days: int = Field(..., ge=1, le=365, example=5)
    instructions: str | None = Field(None, example="After food")


class PrescriptionMedicineCreate(PrescriptionMedicineBase):
    pass


class PrescriptionMedicineResponse(PrescriptionMedicineBase):
    prescription_medicine_id: int
    prescription_id: int
    created_at: datetime
    updated_at: datetime
    medicine: MedicineResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class PrescriptionBase(BaseModel):
    prescription_type: str = Field("doctor", pattern="^(doctor|outside)$")
    notes: str | None = None


class PrescriptionCreate(PrescriptionBase):
    medicines: list[PrescriptionMedicineCreate] = Field(default_factory=list)
    # Allows doctor to diagnose/add disease conditions directly in the same prescription flow
    diagnosed_disease_names: list[str] = Field(default_factory=list)
    diagnosed_disease_ids: list[int] = Field(default_factory=list)
    # Optional follow-up interval update in the same flow
    follow_up_after_days: int | None = Field(None, ge=1, le=365)
    next_visit_date: date | None = None


class PrescriptionResponse(PrescriptionBase):
    prescription_id: int
    visit_id: int
    prescription_file: str | None = None
    created_at: datetime
    updated_at: datetime
    medicines: list[PrescriptionMedicineResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
