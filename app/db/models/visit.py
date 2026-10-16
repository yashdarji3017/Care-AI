from datetime import datetime, date
from sqlalchemy import Integer, String, Text, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Visit(Base):
    __tablename__ = "visits"

    visit_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("patients.patient_id", ondelete="RESTRICT"),
        index=True,
        nullable=False
    )
    doctor_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.user_id", ondelete="SET NULL"),
        index=True,
        nullable=True
    )
    visit_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    next_visit_date: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    follow_up_after_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    visit_type: Mapped[str] = mapped_column(
        String(50),
        default="new",
        nullable=False
    )  # new, follow_up, emergency, consultation
    visit_status: Mapped[str] = mapped_column(
        String(50),
        default="scheduled",
        index=True,
        nullable=False
    )  # scheduled, completed, cancelled, no_show
    doctor_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="visits")
    doctor: Mapped["User"] = relationship("User", back_populates="visits")
    prescriptions: Mapped[list["Prescription"]] = relationship(
        "Prescription",
        back_populates="visit",
        cascade="all, delete-orphan",
        order_by="desc(Prescription.created_at)"
    )
    reminders: Mapped[list["VisitReminder"]] = relationship(
        "VisitReminder",
        back_populates="visit",
        cascade="all, delete-orphan",
        order_by="desc(VisitReminder.scheduled_at)"
    )
