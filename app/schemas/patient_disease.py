from datetime import datetime, date
from pydantic import BaseModel, ConfigDict
from app.schemas.disease import DiseaseResponse


class PatientDiseaseBase(BaseModel):
    disease_id: int
    diagnosed_at: date | None = None
    is_active: bool = True
    notes: str | None = None


class PatientDiseaseCreate(PatientDiseaseBase):
    pass


class PatientDiseaseUpdate(BaseModel):
    is_active: bool | None = None
    notes: str | None = None
    diagnosed_at: date | None = None


class PatientDiseaseResponse(PatientDiseaseBase):
    patient_disease_id: int
    patient_id: int
    created_at: datetime
    updated_at: datetime
    disease: DiseaseResponse | None = None

    model_config = ConfigDict(from_attributes=True)
