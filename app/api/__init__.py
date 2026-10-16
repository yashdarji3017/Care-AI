from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.diseases import router as diseases_router
from app.api.visits import router as visits_router
from app.api.prescriptions import router as prescriptions_router
from app.api.medicines import router as medicines_router
from app.api.reminders import router as reminders_router
from app.api.dashboard import router as dashboard_router
from app.api.health import router as health_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(patients_router)
api_router.include_router(diseases_router)
api_router.include_router(visits_router)
api_router.include_router(prescriptions_router)
api_router.include_router(medicines_router)
api_router.include_router(reminders_router)
api_router.include_router(dashboard_router)

__all__ = ["api_router"]
