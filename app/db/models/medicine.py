from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Medicine(Base):
    __tablename__ = "medicines"

    medicine_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    medicine_name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    generic_name: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

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
    prescription_medicines: Mapped[list["PrescriptionMedicine"]] = relationship(
        "PrescriptionMedicine",
        back_populates="medicine"
    )
