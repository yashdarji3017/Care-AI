import uuid
import httpx
from app.core.config import settings
from app.core.logging import logger
from app.services.whatsapp.base import WhatsAppProvider, WhatsAppSendResult


class MetaWhatsAppProvider(WhatsAppProvider):
    """
    Real implementation for Meta WhatsApp Business Cloud API.
    Uses configurable environment variables without hardcoding secrets.
    """

    def __init__(self) -> None:
        self.api_url = settings.WHATSAPP_API_URL
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.access_token = settings.WHATSAPP_ACCESS_TOKEN

    async def send_message(self, to_phone: str, message: str) -> WhatsAppSendResult:
        if not self.access_token or not self.phone_number_id:
            logger.warning("WhatsApp credentials missing. Falling back to simulated response.")
            return WhatsAppSendResult(
                success=False,
                delivery_status="failed",
                error_message="WhatsApp credentials not configured in environment"
            )

        url = f"{self.api_url.rstrip('/')}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        # Clean phone number
        cleaned_phone = to_phone.lstrip("+").strip()
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": cleaned_phone,
            "type": "text",
            "text": {"preview_url": False, "body": message}
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code in (200, 201):
                    data = response.json()
                    msg_id = data.get("messages", [{}])[0].get("id")
                    logger.info(f"WhatsApp message dispatched successfully to {cleaned_phone[-4:]}***")
                    return WhatsAppSendResult(
                        success=True,
                        provider_message_id=msg_id,
                        delivery_status="sent"
                    )
                else:
                    err_msg = f"Meta API error {response.status_code}: {response.text}"
                    logger.error(f"WhatsApp dispatch failed: {response.status_code}")
                    return WhatsAppSendResult(
                        success=False,
                        delivery_status="failed",
                        error_message=err_msg
                    )
        except Exception as ex:
            logger.error(f"WhatsApp network exception: {str(ex)}")
            return WhatsAppSendResult(
                success=False,
                delivery_status="failed",
                error_message=str(ex)
            )

    async def send_template_message(
        self,
        to_phone: str,
        template_name: str,
        parameters: dict[str, str]
    ) -> WhatsAppSendResult:
        if not self.access_token or not self.phone_number_id:
            return WhatsAppSendResult(
                success=False,
                delivery_status="failed",
                error_message="WhatsApp credentials not configured"
            )

        url = f"{self.api_url.rstrip('/')}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        cleaned_phone = to_phone.lstrip("+").strip()
        
        components = []
        if parameters:
            params = [{"type": "text", "text": val} for val in parameters.values()]
            components.append({"type": "body", "parameters": params})

        payload = {
            "messaging_product": "whatsapp",
            "to": cleaned_phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": "en_US"},
                "components": components
            }
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code in (200, 201):
                    data = response.json()
                    msg_id = data.get("messages", [{}])[0].get("id")
                    return WhatsAppSendResult(
                        success=True,
                        provider_message_id=msg_id,
                        delivery_status="sent"
                    )
                else:
                    return WhatsAppSendResult(
                        success=False,
                        delivery_status="failed",
                        error_message=f"Meta Template error {response.status_code}"
                    )
        except Exception as ex:
            return WhatsAppSendResult(
                success=False,
                delivery_status="failed",
                error_message=str(ex)
            )

    async def get_delivery_status(self, provider_message_id: str) -> str:
        # In cloud API, delivery receipts are pushed via webhooks; status query fallback
        return "delivered"


class MockWhatsAppProvider(WhatsAppProvider):
    """
    Mock WhatsApp Provider for local development and reliable testing.
    Logs reminder delivery without incurring external costs or API blocks.
    """

    async def send_message(self, to_phone: str, message: str) -> WhatsAppSendResult:
        fake_id = f"wamid_mock_{uuid.uuid4().hex[:12]}"
        masked_phone = f"{to_phone[:4]}***{to_phone[-2:]}" if len(to_phone) > 6 else to_phone
        logger.info(f"[MOCK WHATSAPP] Message sent to {masked_phone}: {message[:60]}... [ID: {fake_id}]")
        return WhatsAppSendResult(
            success=True,
            provider_message_id=fake_id,
            delivery_status="delivered"
        )

    async def send_template_message(
        self,
        to_phone: str,
        template_name: str,
        parameters: dict[str, str]
    ) -> WhatsAppSendResult:
        fake_id = f"wamid_mock_tpl_{uuid.uuid4().hex[:12]}"
        logger.info(f"[MOCK WHATSAPP] Template '{template_name}' sent to {to_phone}: {parameters}")
        return WhatsAppSendResult(
            success=True,
            provider_message_id=fake_id,
            delivery_status="delivered"
        )

    async def get_delivery_status(self, provider_message_id: str) -> str:
        return "delivered"


def get_whatsapp_provider() -> WhatsAppProvider:
    """Factory to instantiate the configured WhatsApp provider."""
    provider_name = (settings.WHATSAPP_PROVIDER or "mock").lower()
    if provider_name == "meta":
        return MetaWhatsAppProvider()
    return MockWhatsAppProvider()
