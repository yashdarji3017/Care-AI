from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class DiseaseBase(BaseModel):
    disease_name: str = Field(..., min_length=2, max_length=255)
    description: str | None = None


class DiseaseCreate(DiseaseBase):
    pass


class DiseaseUpdate(BaseModel):
    disease_name: str | None = Field(None, min_length=2, max_length=255)
    description: str | None = None


class DiseaseResponse(DiseaseBase):
    disease_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
