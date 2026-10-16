from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User
from app.schemas.reminder import VisitReminderCreate, VisitReminderResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.reminder_service import ReminderService
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/reminders", tags=["Reminders"])


def _enrich_reminder(rem) -> VisitReminderResponse:
    resp = VisitReminderResponse.model_validate(rem)
    if rem.patient:
        resp.patient_name = rem.patient.patient_name
        resp.whatsapp_no = rem.patient.whatsapp_no
    return resp


@router.get("", response_model=PaginatedResponse[VisitReminderResponse])
def list_reminders(
    status_filter: Optional[str] = Query(None, alias="status"),
    patient_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PaginatedResponse[VisitReminderResponse]:
    """List visit reminders with status filtering and pagination."""
    reminders, total = ReminderService.list_reminders(
        db, status_filter=status_filter, patient_id=patient_id, page=page, page_size=page_size
    )
    items = [_enrich_reminder(r) for r in reminders]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("", response_model=VisitReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    data: VisitReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "staff"))
) -> VisitReminderResponse:
    """Manually schedule a new visit reminder."""
    reminder = ReminderService.create_reminder(db, data, actor=current_user.username)
    reminder = ReminderService.get_reminder(db, reminder.reminder_id)
    return _enrich_reminder(reminder)


@router.get("/{reminder_id}", response_model=VisitReminderResponse)
def get_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> VisitReminderResponse:
    """Retrieve single reminder details and delivery record."""
    reminder = ReminderService.get_reminder(db, reminder_id)
    return _enrich_reminder(reminder)


@router.post("/{reminder_id}/send", response_model=MessageResponse)
async def send_reminder_now(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "doctor", "staff"))
) -> MessageResponse:
    """Manually dispatch a pending/failed reminder immediately via WhatsApp."""
    reminder = ReminderService.get_reminder(db, reminder_id)
    success = await ReminderService.process_single_reminder(
        db, reminder, actor=current_user.username
    )
    if success:
        return MessageResponse(message=f"Reminder {reminder_id} sent successfully via WhatsApp.")
    else:
        return MessageResponse(
            message=f"Reminder {reminder_id} failed to send. Reason: {reminder.failure_reason}",
            success=False
        )


@router.post("/process-due", response_model=MessageResponse)
async def trigger_due_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "staff"))
) -> MessageResponse:
    """Trigger immediate processing of all due pending reminders."""
    count = await ReminderService.process_due_reminders(db)
    return MessageResponse(message=f"Processed and sent {count} due reminders.")
