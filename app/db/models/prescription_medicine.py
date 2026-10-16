from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PrescriptionMedicine(Base):
    __tablename__ = "prescription_medicines"

    prescription_medicine_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    prescription_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("prescriptions.prescription_id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    medicine_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("medicines.medicine_id", ondelete="RESTRICT"),
        index=True,
        nullable=False
    )
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    frequency: Mapped[str] = mapped_column(String(100), nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)

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
    prescription: Mapped["Prescription"] = relationship("Prescription", back_populates="medicines")
    medicine: Mapped["Medicine"] = relationship("Medicine", back_populates="prescription_medicines")
