from app.schemas.common import PaginatedResponse, MessageResponse
from app.schemas.user import UserCreate, UserUpdate, UserResponse, Token, LoginRequest
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientDetailResponse
from app.schemas.disease import DiseaseCreate, DiseaseUpdate, DiseaseResponse
from app.schemas.patient_disease import PatientDiseaseCreate, PatientDiseaseUpdate, PatientDiseaseResponse
from app.schemas.visit import VisitCreate, VisitUpdate, VisitResponse
from app.schemas.medicine import MedicineCreate, MedicineUpdate, MedicineResponse
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionResponse,
    PrescriptionMedicineCreate,
    PrescriptionMedicineResponse,
)
from app.schemas.reminder import VisitReminderCreate, VisitReminderResponse
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    FollowUpItem,
    ReminderReportSummary,
    PatientDemographicReport,
)

__all__ = [
    "PaginatedResponse",
    "MessageResponse",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "Token",
    "LoginRequest",
    "PatientCreate",
    "PatientUpdate",
    "PatientResponse",
    "PatientDetailResponse",
    "DiseaseCreate",
    "DiseaseUpdate",
    "DiseaseResponse",
    "PatientDiseaseCreate",
    "PatientDiseaseUpdate",
    "PatientDiseaseResponse",
    "VisitCreate",
    "VisitUpdate",
    "VisitResponse",
    "MedicineCreate",
    "MedicineUpdate",
    "MedicineResponse",
    "PrescriptionCreate",
    "PrescriptionResponse",
    "PrescriptionMedicineCreate",
    "PrescriptionMedicineResponse",
    "VisitReminderCreate",
    "VisitReminderResponse",
    "DashboardSummaryResponse",
    "FollowUpItem",
    "ReminderReportSummary",
    "PatientDemographicReport",
]
