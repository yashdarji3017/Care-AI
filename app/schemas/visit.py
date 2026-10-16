from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.prescription import PrescriptionResponse, PrescriptionMedicineCreate
from app.schemas.reminder import VisitReminderResponse


class VisitBase(BaseModel):
    visit_date: date
    next_visit_date: date | None = None
    follow_up_after_days: int | None = Field(None, ge=1, le=365)
    visit_type: str = Field("new", pattern="^(new|follow_up|emergency|consultation)$")
    visit_status: str = Field("scheduled", pattern="^(scheduled|completed|cancelled|no_show)$")
    doctor_notes: str | None = None


class VisitCreate(VisitBase):
    patient_id: int
    doctor_id: int | None = None
    create_reminder: bool = True  # Auto-schedule reminder if next_visit_date is present
    
    # Integrated 1-click clinical consultation support
    diagnosed_disease_names: list[str] = Field(default_factory=list)
    diagnosed_disease_ids: list[int] = Field(default_factory=list)
    prescribed_medicines: list[PrescriptionMedicineCreate] = Field(default_factory=list)
    prescription_type: str = "doctor"


class VisitUpdate(BaseModel):
    visit_date: date | None = None
    next_visit_date: date | None = None
    follow_up_after_days: int | None = Field(None, ge=1, le=365)
    visit_type: str | None = Field(None, pattern="^(new|follow_up|emergency|consultation)$")
    visit_status: str | None = Field(None, pattern="^(scheduled|completed|cancelled|no_show)$")
    doctor_notes: str | None = None
    doctor_id: int | None = None
    diagnosed_disease_names: list[str] | None = None
    diagnosed_disease_ids: list[int] | None = None
    prescribed_medicines: list[PrescriptionMedicineCreate] | None = None


class VisitResponse(VisitBase):
    visit_id: int
    patient_id: int
    doctor_id: int | None = None
    created_at: datetime
    updated_at: datetime

    doctor_name: str | None = None
    patient_name: str | None = None
    prescriptions: list[PrescriptionResponse] = Field(default_factory=list)
    reminders: list[VisitReminderResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
