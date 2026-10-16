import logging
import sys
from typing import Any

from app.core.config import settings

def setup_logging() -> logging.Logger:
    """Configure structured application logging without exposing secrets."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    logger = logging.getLogger("patientcare")
    logger.setLevel(log_level)
    
    # Avoid duplicate handlers if re-initialized
    if not logger.handlers:
        logger.addHandler(handler)
        
    return logger


logger = setup_logging()
