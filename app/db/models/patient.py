from datetime import datetime, date
from sqlalchemy import Integer, String, Text, Boolean, Date, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Patient(Base):
    __tablename__ = "patients"

    patient_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    whatsapp_no: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    emergency_contact: Mapped[str | None] = mapped_column(String(100), nullable=True)
    whatsapp_opt_in: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    patient_diseases: Mapped[list["PatientDisease"]] = relationship(
        "PatientDisease",
        back_populates="patient",
        cascade="all, delete-orphan"
    )
    visits: Mapped[list["Visit"]] = relationship(
        "Visit",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="desc(Visit.visit_date)"
    )
    reminders: Mapped[list["VisitReminder"]] = relationship(
        "VisitReminder",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="desc(VisitReminder.scheduled_at)"
    )
