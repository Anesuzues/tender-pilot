"""Background task dispatch.

In dev (default, ``CELERY_EAGER=true`` / no Redis) the ingestion job runs in a
FastAPI ``BackgroundTask`` with its own DB session. In production, point
``REDIS_URL`` at a broker and run the Celery worker (see ``worker.py``); the
route code is unchanged — only ``enqueue_ingestion`` switches transport.
"""
from __future__ import annotations

import logging

from app.config import settings
from app.database import SessionLocal
from app.services.ingestion import process_tender_document

logger = logging.getLogger("tenderpilot.tasks")


async def ingest_tender_job(tender_id: str, data: bytes) -> None:
    """Self-contained ingestion job (opens + commits its own session)."""
    async with SessionLocal() as session:
        try:
            await process_tender_document(session, tender_id, data)
            await session.commit()
        except Exception:
            await session.rollback()
            logger.exception("Background ingestion failed for %s", tender_id)


def enqueue_ingestion(background_tasks, tender_id: str, data: bytes) -> None:
    """Schedule ingestion. Uses Celery when a broker is configured, else inline."""
    if settings.redis_url and not settings.celery_eager:
        try:  # pragma: no cover - requires celery + redis
            from app.worker import ingest_tender_celery

            ingest_tender_celery.delay(tender_id, data)
            return
        except Exception:
            logger.warning("Celery dispatch failed; running ingestion inline")
    background_tasks.add_task(ingest_tender_job, tender_id, data)
