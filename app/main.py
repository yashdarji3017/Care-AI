import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.logging import logger
from app.core.security import get_password_hash
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.db.models.user import User
from app.db.models.disease import Disease
from app.db.models.medicine import Medicine
from app.api import api_router
from app.workers.reminder_worker import reminder_worker
import asyncio


def seed_initial_data(db: Session) -> None:
    """Seed initial administrator and default clinical catalogs if database is fresh."""
    try:
        # 1. Admin user
        admin = db.execute(select(User).where(User.username == "admin")).scalar_one_or_none()
        if not admin:
            admin_user = User(
                username="admin",
                email="admin@patientcare.ai",
                full_name="Clinic Administrator",
                hashed_password=get_password_hash("Admin@123"),
                role="admin",
                is_active=True
            )
            doctor_user = User(
                username="dr.sharma",
                email="sharma@patientcare.ai",
                full_name="Dr. Rajesh Sharma, MD",
                hashed_password=get_password_hash("Doctor@123"),
                role="doctor",
                is_active=True
            )
            staff_user = User(
                username="nurse.priya",
                email="priya@patientcare.ai",
                full_name="Priya Patel, RN",
                hashed_password=get_password_hash("Staff@123"),
                role="staff",
                is_active=True
            )
            db.add_all([admin_user, doctor_user, staff_user])
            db.commit()
            logger.info("Initialized default users: admin, dr.sharma, nurse.priya")

        # 2. Standard clinical diseases
        # initial_diseases = [
        #     ("Type 2 Diabetes Mellitus", "Chronic metabolic disorder characterized by elevated blood glucose"),
        #     ("Essential Hypertension", "High blood pressure without identifiable secondary cause"),
        #     ("Bronchial Asthma", "Chronic respiratory disease with airway hyperresponsiveness and bronchospasm"),
        #     ("Hypothyroidism", "Underactive thyroid gland with reduced hormone production"),
        #     ("Coronary Artery Disease", "Impaired myocardial perfusion caused by atherosclerotic plaque"),
        #     ("Osteoarthritis", "Degenerative joint disease affecting cartilage and bone"),
        #     ("Chronic Kidney Disease", "Gradual progressive loss of renal function"),
        #     ("Migraine with Aura", "Recurrent neurovascular headache disorder with sensory disturbances"),
        # ]
        # for name, desc in initial_diseases:
        #     exists = db.execute(select(Disease).where(Disease.disease_name == name)).scalar_one_or_none()
        #     if not exists:
        #         db.add(Disease(disease_name=name, description=desc))

        # # 3. Standard clinical medicines
        # initial_medicines = [
        #     ("Metformin 500mg", "Metformin Hydrochloride", "Biguanide antihyperglycemic agent"),
        #     ("Amlodipine 5mg", "Amlodipine Besylate", "Calcium channel blocker antihypertensive"),
        #     ("Atorvastatin 20mg", "Atorvastatin Calcium", "HMG-CoA reductase inhibitor for dyslipidemia"),
        #     ("Levothyroxine 50mcg", "Levothyroxine Sodium", "Synthetic thyroid hormone replacement"),
        #     ("Telmisartan 40mg", "Telmisartan", "Angiotensin II receptor antagonist (ARB)"),
        #     ("Montelukast + Levocetirizine", "Montelukast / Levocetirizine", "Leukotriene receptor antagonist + antihistamine"),
        #     ("Paracetamol 650mg", "Acetaminophen", "Analgesic and antipyretic"),
        #     ("Amoxicillin + Clavulanate 625mg", "Amoxicillin / Clavulanic Acid", "Broad-spectrum penicillin antibiotic"),
        #     ("Pantoprazole 40mg", "Pantoprazole Sodium", "Proton-pump inhibitor for acid reflux"),
        #     ("Salbutamol Inhaler 100mcg", "Salbutamol Sulfate", "Short-acting beta-2 adrenergic bronchodilator"),
        # ]
        # for name, gen, desc in initial_medicines:
        #     exists = db.execute(select(Medicine).where(Medicine.medicine_name == name)).scalar_one_or_none()
        #     if not exists:
        #         db.add(Medicine(medicine_name=name, generic_name=gen, description=desc))

        db.commit()
    except Exception as ex:
        db.rollback()
        logger.warning(f"Initial data seeding skipped or failed: {str(ex)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure prescription upload directory exists
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

    # Initialize tables and seed demo records if database accessible
    try:
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            seed_initial_data(db)
        logger.info("Database tables verified and seeded successfully.")
    except Exception as ex:
        logger.warning(f"Database connection warning on startup: {str(ex)}")

    # Start background reminder worker task
    worker_task = asyncio.create_task(reminder_worker.start())
    logger.info("PatientCare AI background reminder worker initialized.")

    yield

    # Teardown
    reminder_worker.stop()
    worker_task.cancel()
    logger.info("PatientCare AI shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Professional Patient Management, Prescription & WhatsApp Follow-Up System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Secure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local dev frontend at localhost:5173, etc.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Structured Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    req_id = uuid.uuid4().hex[:8]
    start_time = time.time()
    
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)

    # Exclude passwords and sensitive auth tokens from logging
    path = request.url.path
    if not path.startswith("/static"):
        logger.info(f"[{req_id}] {request.method} {path} - Status: {response.status_code} ({duration_ms}ms)")

    response.headers["X-Request-ID"] = req_id
    return response


# Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []))
        errors.append(f"{field}: {err.get('msg')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors}
    )


# Standard API Routers
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
# Also include direct alias without /api/v1 prefix for convenience
app.include_router(api_router)


@app.get("/", tags=["Root"])
def root_redirect():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "documentation": "/docs",
        "api_v1": settings.API_V1_PREFIX
    }
