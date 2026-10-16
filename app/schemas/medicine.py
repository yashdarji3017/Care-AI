from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class MedicineBase(BaseModel):
    medicine_name: str = Field(..., min_length=2, max_length=255)
    generic_name: str | None = Field(None, max_length=255)
    description: str | None = None


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(BaseModel):
    medicine_name: str | None = Field(None, min_length=2, max_length=255)
    generic_name: str | None = Field(None, max_length=255)
    description: str | None = None


class MedicineResponse(MedicineBase):
    medicine_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
