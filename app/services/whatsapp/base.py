from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel


class WhatsAppSendResult(BaseModel):
    success: bool
    provider_message_id: Optional[str] = None
    delivery_status: str  # "sent", "failed", "pending"
    error_message: Optional[str] = None


class WhatsAppProvider(ABC):
    """
    Abstract WhatsApp provider interface.
    Allows swappable implementations (Meta Cloud API, Twilio, Mock, etc.)
    without coupling the core application to a specific vendor.
    """

    @abstractmethod
    async def send_message(self, to_phone: str, message: str) -> WhatsAppSendResult:
        """Send a standard text message to the given WhatsApp number."""
        pass

    @abstractmethod
    async def send_template_message(
        self,
        to_phone: str,
        template_name: str,
        parameters: dict[str, str]
    ) -> WhatsAppSendResult:
        """Send an approved template message to the recipient."""
        pass

    @abstractmethod
    async def get_delivery_status(self, provider_message_id: str) -> str:
        """Query the delivery status for an existing sent message."""
        pass
