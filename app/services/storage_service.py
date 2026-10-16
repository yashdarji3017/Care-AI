import os
import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
from app.core.logging import logger

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}


class StorageService(ABC):
    """Abstract interface for storing and retrieving prescription documents."""

    @abstractmethod
    async def save_file(self, upload_file: UploadFile) -> str:
        """Save an uploaded file and return its safe stored identifier."""
        pass

    @abstractmethod
    def get_file_path(self, stored_filename: str) -> Path:
        """Resolve the absolute path to a stored file."""
        pass

    @abstractmethod
    def delete_file(self, stored_filename: str) -> bool:
        """Remove a stored file."""
        pass


class LocalStorageService(StorageService):
    def __init__(self, base_dir: str = settings.UPLOAD_DIR) -> None:
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save_file(self, upload_file: UploadFile) -> str:
        # Validate file extension
        orig_filename = upload_file.filename or ""
        ext = Path(orig_filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        # Generate completely random and safe filename
        safe_filename = f"prescription_{uuid.uuid4().hex}{ext}"
        destination = self.base_dir / safe_filename

        # Stream file to disk and validate size limit
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        total_bytes = 0

        try:
            with open(destination, "wb") as buffer:
                while chunk := await upload_file.read(1024 * 64):  # 64 KB chunks
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        buffer.close()
                        destination.unlink(missing_ok=True)
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
                        )
                    buffer.write(chunk)
        except Exception as e:
            destination.unlink(missing_ok=True)
            if isinstance(e, HTTPException):
                raise e
            logger.error(f"Failed to save uploaded file: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not store uploaded document."
            )

        return safe_filename

    def get_file_path(self, stored_filename: str) -> Path:
        # Prevent path traversal attacks
        safe_name = Path(stored_filename).name
        full_path = self.base_dir / safe_name
        if not full_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription document file not found."
            )
        return full_path

    def delete_file(self, stored_filename: str) -> bool:
        try:
            safe_name = Path(stored_filename).name
            full_path = self.base_dir / safe_name
            if full_path.exists():
                full_path.unlink()
                return True
            return False
        except Exception as ex:
            logger.error(f"Error deleting file {stored_filename}: {str(ex)}")
            return False


storage_service = LocalStorageService()
