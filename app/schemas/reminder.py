from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class VisitReminderBase(BaseModel):
    scheduled_at: datetime
    message: str = Field(..., min_length=1)
    reminder_type: str = Field("follow_up", pattern="^(visit|follow_up)$")


class VisitReminderCreate(VisitReminderBase):
    patient_id: int
    visit_id: int


class VisitReminderResponse(VisitReminderBase):
    reminder_id: int
    patient_id: int
    visit_id: int
    status: str
    sent_at: datetime | None = None
    delivery_status: str | None = None
    attempt_count: int
    failure_reason: str | None = None
    created_at: datetime
    updated_at: datetime

    # Minimal nested patient info for dashboard/table display
    patient_name: str | None = None
    whatsapp_no: str | None = None

    model_config = ConfigDict(from_attributes=True)
