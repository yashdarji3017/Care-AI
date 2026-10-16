from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field, field_validator
import re

from app.schemas.patient_disease import PatientDiseaseResponse
from app.schemas.visit import VisitResponse
from app.schemas.reminder import VisitReminderResponse


class PatientBase(BaseModel):
    patient_name: str = Field(..., min_length=2, max_length=255)
    whatsapp_no: str = Field(..., min_length=8, max_length=50)
    email: str | None = Field(None, max_length=255)
    date_of_birth: date | None = None
    gender: str | None = Field(None, pattern="^(male|female|other|Male|Female|Other)$")
    address: str | None = None
    emergency_contact: str | None = Field(None, max_length=100)
    whatsapp_opt_in: bool = True

    @field_validator("whatsapp_no")
    @classmethod
    def validate_whatsapp_no(cls, v: str) -> str:
        # Strip spaces and dashes
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not re.match(r"^\+?[0-9]{8,15}$", cleaned):
            raise ValueError("Invalid WhatsApp phone number format. Must be 8-15 digits with optional '+' prefix.")
        return cleaned


class PatientCreate(PatientBase):
    initial_disease_ids: list[int] = Field(default_factory=list)


class PatientUpdate(BaseModel):
    patient_name: str | None = Field(None, min_length=2, max_length=255)
    whatsapp_no: str | None = None
    email: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    address: str | None = None
    emergency_contact: str | None = None
    whatsapp_opt_in: bool | None = None

    @field_validator("whatsapp_no")
    @classmethod
    def validate_whatsapp_no(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not re.match(r"^\+?[0-9]{8,15}$", cleaned):
            raise ValueError("Invalid WhatsApp phone number format.")
        return cleaned


class PatientResponse(PatientBase):
    patient_id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    # Dynamically calculated fields (not stored in patients table)
    latest_visit_date: date | None = None
    next_follow_up_date: date | None = None
    active_diseases_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class PatientDetailResponse(PatientResponse):
    patient_diseases: list[PatientDiseaseResponse] = Field(default_factory=list)
    visits: list[VisitResponse] = Field(default_factory=list)
    reminders: list[VisitReminderResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
