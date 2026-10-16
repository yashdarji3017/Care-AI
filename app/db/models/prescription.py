from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    prescription_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    visit_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("visits.visit_id", ondelete="RESTRICT"),
        index=True,
        nullable=False
    )
    prescription_type: Mapped[str] = mapped_column(
        String(50),
        default="doctor",
        nullable=False
    )  # doctor, outside
    prescription_file: Mapped[str | None] = mapped_column(String(500), nullable=True)
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
    visit: Mapped["Visit"] = relationship("Visit", back_populates="prescriptions")
    medicines: Mapped[list["PrescriptionMedicine"]] = relationship(
        "PrescriptionMedicine",
        back_populates="prescription",
        cascade="all, delete-orphan"
    )
