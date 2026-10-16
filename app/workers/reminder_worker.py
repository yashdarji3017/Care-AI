import asyncio
from app.core.logging import logger
from app.core.config import settings
from app.db.session import SessionLocal
from app.services.reminder_service import ReminderService


class ReminderWorker:
    """
    Background worker that periodically checks for due visit reminders
    and processes WhatsApp transmissions safely.
    """

    def __init__(self, poll_interval_seconds: int = settings.REMINDER_POLL_INTERVAL_SECONDS) -> None:
        self.poll_interval = poll_interval_seconds
        self.is_running = False

    async def run_once(self) -> int:
        db = SessionLocal()
        try:
            processed = await ReminderService.process_due_reminders(db)
            if processed > 0:
                logger.info(f"[ReminderWorker] Processed and sent {processed} due reminders.")
            return processed
        except Exception as e:
            logger.error(f"[ReminderWorker] Error in reminder processing run: {str(e)}")
            return 0
        finally:
            db.close()

    async def start(self) -> None:
        self.is_running = True
        logger.info(f"[ReminderWorker] Background worker started. Polling every {self.poll_interval}s.")
        while self.is_running:
            try:
                await self.run_once()
            except Exception as e:
                logger.error(f"[ReminderWorker] Unexpected worker error: {str(e)}")
            await asyncio.sleep(self.poll_interval)

    def stop(self) -> None:
        self.is_running = False
        logger.info("[ReminderWorker] Worker stopping requested.")


reminder_worker = ReminderWorker()

if __name__ == "__main__":
    try:
        asyncio.run(reminder_worker.start())
    except KeyboardInterrupt:
        reminder_worker.stop()
