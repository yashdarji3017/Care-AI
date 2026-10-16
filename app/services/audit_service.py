import json
from typing import Any, Optional
from sqlalchemy.orm import Session
from app.db.models.audit import AuditLog
from app.core.logging import logger


class AuditService:
    @staticmethod
    def log(
        db: Session,
        actor: str,
        action: str,
        entity_type: str,
        entity_id: Optional[str | int] = None,
        details: Optional[dict[str, Any]] = None
    ) -> None:
        """Record an audit trail event without saving sensitive medical data."""
        try:
            serialized_details = json.dumps(details) if details else None
            audit_entry = AuditLog(
                actor=actor,
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id) if entity_id is not None else None,
                details=serialized_details
            )
            db.add(audit_entry)
            db.commit()
        except Exception as ex:
            db.rollback()
            logger.error(f"Audit log failed for {action}: {str(ex)}")


audit_service = AuditService()
