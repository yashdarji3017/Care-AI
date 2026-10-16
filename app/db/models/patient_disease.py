from datetime import datetime, date
from sqlalchemy import Integer, Text, Boolean, Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PatientDisease(Base):
    __tablename__ = "patient_diseases"
    __table_args__ = (
        UniqueConstraint("patient_id", "disease_id", name="uq_patient_disease"),
    )

    patient_disease_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("patients.patient_id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    disease_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("diseases.disease_id", ondelete="RESTRICT"),
        index=True,
        nullable=False
    )
    diagnosed_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

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
    patient: Mapped["Patient"] = relationship("Patient", back_populates="patient_diseases")
    disease: Mapped["Disease"] = relationship("Disease", back_populates="patient_diseases")
