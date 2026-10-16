import os
import warnings

from dotenv import load_dotenv

load_dotenv()


# ============================================================
# Application
# ============================================================

APP_NAME = os.getenv("APP_NAME", "PatientCare AI")
APP_ENV = os.getenv("APP_ENV", "development")

_raw_debug = os.getenv("DEBUG", "true")
DEBUG: bool = _raw_debug.strip().lower() in (
    "true",
    "1",
    "yes",
    "on",
    "t",
)

API_V1_PREFIX = os.getenv("API_V1_PREFIX", "/api/v1")


# ============================================================
# Database
# ============================================================

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or not DATABASE_URL.strip():
    raise RuntimeError(
        "DATABASE_URL is not configured. "
        "Please set DATABASE_URL in your .env file."
    )

DATABASE_URL = DATABASE_URL.strip()

# Optional alias if existing code uses this name.
SQLALCHEMY_DATABASE_URL = DATABASE_URL


# ============================================================
# JWT Authentication
# ============================================================

_INSECURE_JWT_SECRETS = {
    "temporary-secret-key-change-in-production",
    "your-secret-key",
    "secret",
    "changeme",
    "dev-secret-key-patientcare-ai-change-in-production-min32bytes",
}

_raw_jwt_secret = os.getenv("JWT_SECRET_KEY")

if (
    not _raw_jwt_secret
    or not _raw_jwt_secret.strip()
    or _raw_jwt_secret.strip() in _INSECURE_JWT_SECRETS
):
    raise RuntimeError(
        "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET_KEY is missing "
        "or set to an insecure default. Please generate a strong secret "
        "key and set it in your .env file."
    )

JWT_SECRET_KEY = _raw_jwt_secret.strip()

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

_raw_access_expire = os.getenv(
    "JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
    "480",
)

try:
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(_raw_access_expire)
except (ValueError, TypeError):
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 480


# ============================================================
# WhatsApp
# ============================================================

WHATSAPP_PROVIDER = os.getenv("WHATSAPP_PROVIDER", "mock")

WHATSAPP_API_URL = os.getenv(
    "WHATSAPP_API_URL",
    "https://graph.facebook.com/v20.0",
)

WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")


# ============================================================
# Storage
# ============================================================

UPLOAD_DIR = os.getenv(
    "UPLOAD_DIR",
    "storage/prescriptions",
)

_raw_max_upload_size = os.getenv(
    "MAX_UPLOAD_SIZE_MB",
    "10",
)

try:
    MAX_UPLOAD_SIZE_MB = int(_raw_max_upload_size)
except (ValueError, TypeError):
    MAX_UPLOAD_SIZE_MB = 10


# ============================================================
# Reminder Processing
# ============================================================

_raw_reminder_retry_limit = os.getenv(
    "REMINDER_RETRY_LIMIT",
    "3",
)

try:
    REMINDER_RETRY_LIMIT = int(_raw_reminder_retry_limit)
except (ValueError, TypeError):
    REMINDER_RETRY_LIMIT = 3


_raw_reminder_poll_interval = os.getenv(
    "REMINDER_POLL_INTERVAL_SECONDS",
    "30",
)

try:
    REMINDER_POLL_INTERVAL_SECONDS = int(
        _raw_reminder_poll_interval
    )
except (ValueError, TypeError):
    REMINDER_POLL_INTERVAL_SECONDS = 30


# ============================================================
# Logging
# ============================================================

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()


# ============================================================
# Settings Object Export
# ============================================================

class AppSettings:
    APP_NAME = APP_NAME
    APP_ENV = APP_ENV
    DEBUG = DEBUG
    API_V1_PREFIX = API_V1_PREFIX
    DATABASE_URL = DATABASE_URL
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL
    JWT_SECRET_KEY = JWT_SECRET_KEY
    JWT_ALGORITHM = JWT_ALGORITHM
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES = JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    WHATSAPP_PROVIDER = WHATSAPP_PROVIDER
    WHATSAPP_API_URL = WHATSAPP_API_URL
    WHATSAPP_ACCESS_TOKEN = WHATSAPP_ACCESS_TOKEN
    WHATSAPP_PHONE_NUMBER_ID = WHATSAPP_PHONE_NUMBER_ID
    UPLOAD_DIR = UPLOAD_DIR
    MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE_MB
    REMINDER_RETRY_LIMIT = REMINDER_RETRY_LIMIT
    REMINDER_POLL_INTERVAL_SECONDS = REMINDER_POLL_INTERVAL_SECONDS
    LOG_LEVEL = LOG_LEVEL


settings = AppSettings()