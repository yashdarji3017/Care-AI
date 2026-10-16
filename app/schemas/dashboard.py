from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.patient import PatientResponse
from app.schemas.visit import VisitResponse
from app.schemas.reminder import VisitReminderResponse


class DashboardSummaryResponse(BaseModel):
    total_patients: int
    active_patients: int
    follow_ups_due_today: int
    follow_ups_due_this_week: int
    pending_reminders: int
    failed_reminders: int

    # Recent activities (privacy-safe overview)
    recent_patients: list[PatientResponse]
    recent_visits: list[VisitResponse]
    recent_reminders: list[VisitReminderResponse]


class FollowUpItem(BaseModel):
    patient_id: int
    patient_name: str
    whatsapp_no: str
    whatsapp_opt_in: bool
    visit_id: int
    visit_date: date
    next_visit_date: date
    status: str  # "due_today", "overdue", "due_this_week"
    days_difference: int
    reminder_status: str | None = None


class ReminderReportSummary(BaseModel):
    total_reminders: int
    pending: int
    sent: int
    failed: int
    cancelled: int
    delivery_rate_percentage: float


class PatientDemographicReport(BaseModel):
    total: int
    active: int
    deleted: int
    gender_breakdown: dict[str, int]
    top_diseases: list[dict[str, int | str]]
