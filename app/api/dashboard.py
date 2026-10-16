from datetime import date, datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func, desc, and_, or_

from app.db.session import get_db
from app.db.models.patient import Patient
from app.db.models.visit import Visit
from app.db.models.reminder import VisitReminder
from app.db.models.disease import Disease
from app.db.models.patient_disease import PatientDisease
from app.db.models.user import User
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    FollowUpItem,
    ReminderReportSummary,
    PatientDemographicReport,
)
from app.schemas.patient import PatientResponse
from app.schemas.visit import VisitResponse
from app.schemas.reminder import VisitReminderResponse
from app.services.patient_service import PatientService
from app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Reports"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> DashboardSummaryResponse:
    """Retrieve high-level overview metrics and recent activity for the clinic."""
    today = date.today()
    week_ahead = today + timedelta(days=7)

    # 1. Total patients (active non-deleted)
    total_patients = db.execute(
        select(func.count(Patient.patient_id)).where(Patient.is_deleted == False)
    ).scalar() or 0

    # 2. Active patients (visited within last 90 days or registered within last 90 days)
    ninety_days_ago = today - timedelta(days=90)
    active_stmt = (
        select(func.count(func.distinct(Patient.patient_id)))
        .join(Visit, Visit.patient_id == Patient.patient_id, isouter=True)
        .where(
            Patient.is_deleted == False,
            or_(
                Visit.visit_date >= ninety_days_ago,
                Patient.created_at >= datetime.combine(ninety_days_ago, datetime.min.time()).replace(tzinfo=timezone.utc)
            )
        )
    )
    active_patients = db.execute(active_stmt).scalar() or 0

    # 3. Follow-ups due today
    follow_ups_due_today = db.execute(
        select(func.count(Visit.visit_id)).where(
            Visit.next_visit_date == today,
            Visit.visit_status.in_(["scheduled", "completed"])
        )
    ).scalar() or 0

    # 4. Follow-ups due this week
    follow_ups_due_this_week = db.execute(
        select(func.count(Visit.visit_id)).where(
            Visit.next_visit_date >= today,
            Visit.next_visit_date <= week_ahead,
            Visit.visit_status.in_(["scheduled", "completed"])
        )
    ).scalar() or 0

    # 5. Pending reminders
    pending_reminders = db.execute(
        select(func.count(VisitReminder.reminder_id)).where(VisitReminder.status == "pending")
    ).scalar() or 0

    # 6. Failed reminders
    failed_reminders = db.execute(
        select(func.count(VisitReminder.reminder_id)).where(VisitReminder.status == "failed")
    ).scalar() or 0

    # Recent patients (latest 5)
    rec_patients = db.execute(
        select(Patient)
        .where(Patient.is_deleted == False)
        .order_by(Patient.patient_id.desc())
        .limit(5)
    ).scalars().all()
    recent_patients = [PatientService.enrich_patient_response(db, p) for p in rec_patients]

    # Recent visits (latest 5)
    rec_visits = db.execute(
        select(Visit)
        .options(selectinload(Visit.patient), selectinload(Visit.doctor))
        .order_by(Visit.visit_id.desc())
        .limit(5)
    ).scalars().all()
    recent_visits = []
    for v in rec_visits:
        vr = VisitResponse.model_validate(v)
        if v.patient:
            vr.patient_name = v.patient.patient_name
        if v.doctor:
            vr.doctor_name = v.doctor.full_name
        recent_visits.append(vr)

    # Recent reminders (latest 5)
    rec_reminders = db.execute(
        select(VisitReminder)
        .options(selectinload(VisitReminder.patient))
        .order_by(VisitReminder.reminder_id.desc())
        .limit(5)
    ).scalars().all()
    recent_reminders = []
    for r in rec_reminders:
        rr = VisitReminderResponse.model_validate(r)
        if r.patient:
            rr.patient_name = r.patient.patient_name
            rr.whatsapp_no = r.patient.whatsapp_no
        recent_reminders.append(rr)

    return DashboardSummaryResponse(
        total_patients=total_patients,
        active_patients=active_patients,
        follow_ups_due_today=follow_ups_due_today,
        follow_ups_due_this_week=follow_ups_due_this_week,
        pending_reminders=pending_reminders,
        failed_reminders=failed_reminders,
        recent_patients=recent_patients,
        recent_visits=recent_visits,
        recent_reminders=recent_reminders
    )


@router.get("/follow-ups", response_model=List[FollowUpItem])
def get_follow_ups_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[FollowUpItem]:
    """Retrieve actionable follow-up schedule (overdue, due today, due this week)."""
    today = date.today()
    week_ahead = today + timedelta(days=7)
    past_limit = today - timedelta(days=30)  # Up to 30 days overdue

    stmt = (
        select(Visit)
        .join(Patient, Patient.patient_id == Visit.patient_id)
        .options(
            selectinload(Visit.patient),
            selectinload(Visit.reminders)
        )
        .where(
            Patient.is_deleted == False,
            Visit.next_visit_date.is_not(None),
            Visit.next_visit_date >= past_limit,
            Visit.next_visit_date <= week_ahead,
            Visit.visit_status.in_(["scheduled", "completed"])
        )
        .order_by(Visit.next_visit_date.asc())
    )

    visits = db.execute(stmt).scalars().all()
    results: List[FollowUpItem] = []

    for v in visits:
        diff = (v.next_visit_date - today).days
        if diff < 0:
            status_label = "overdue"
        elif diff == 0:
            status_label = "due_today"
        else:
            status_label = "due_this_week"

        latest_reminder = v.reminders[0] if v.reminders else None

        results.append(
            FollowUpItem(
                patient_id=v.patient_id,
                patient_name=v.patient.patient_name,
                whatsapp_no=v.patient.whatsapp_no,
                whatsapp_opt_in=v.patient.whatsapp_opt_in,
                visit_id=v.visit_id,
                visit_date=v.visit_date,
                next_visit_date=v.next_visit_date,
                status=status_label,
                days_difference=diff,
                reminder_status=latest_reminder.status if latest_reminder else "none"
            )
        )

    return results


@router.get("/reminders", response_model=ReminderReportSummary)
def get_reminders_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ReminderReportSummary:
    """Retrieve aggregate reminder delivery rates and status distribution."""
    total = db.execute(select(func.count(VisitReminder.reminder_id))).scalar() or 0
    pending = db.execute(select(func.count(VisitReminder.reminder_id)).where(VisitReminder.status == "pending")).scalar() or 0
    sent = db.execute(select(func.count(VisitReminder.reminder_id)).where(VisitReminder.status == "sent")).scalar() or 0
    failed = db.execute(select(func.count(VisitReminder.reminder_id)).where(VisitReminder.status == "failed")).scalar() or 0
    cancelled = db.execute(select(func.count(VisitReminder.reminder_id)).where(VisitReminder.status == "cancelled")).scalar() or 0

    attempted = sent + failed
    delivery_rate = round((sent / attempted * 100.0), 1) if attempted > 0 else 0.0

    return ReminderReportSummary(
        total_reminders=total,
        pending=pending,
        sent=sent,
        failed=failed,
        cancelled=cancelled,
        delivery_rate_percentage=delivery_rate
    )


@router.get("/reports/patients", response_model=PatientDemographicReport)
def get_patient_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PatientDemographicReport:
    """Aggregated patient analytics and disease prevalence."""
    total = db.execute(select(func.count(Patient.patient_id))).scalar() or 0
    active = db.execute(select(func.count(Patient.patient_id)).where(Patient.is_deleted == False)).scalar() or 0
    deleted = db.execute(select(func.count(Patient.patient_id)).where(Patient.is_deleted == True)).scalar() or 0

    # Gender distribution
    gender_rows = db.execute(
        select(Patient.gender, func.count(Patient.patient_id))
        .where(Patient.is_deleted == False)
        .group_by(Patient.gender)
    ).all()
    gender_breakdown = {g or "Unspecified": count for g, count in gender_rows}

    # Top diseases
    top_dis_rows = db.execute(
        select(Disease.disease_name, func.count(PatientDisease.patient_disease_id))
        .join(PatientDisease, PatientDisease.disease_id == Disease.disease_id)
        .group_by(Disease.disease_name)
        .order_by(desc(func.count(PatientDisease.patient_disease_id)))
        .limit(10)
    ).all()
    top_diseases = [{"name": name, "count": count} for name, count in top_dis_rows]

    return PatientDemographicReport(
        total=total,
        active=active,
        deleted=deleted,
        gender_breakdown=gender_breakdown,
        top_diseases=top_diseases
    )
