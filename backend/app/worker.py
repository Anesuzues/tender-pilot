"""Optional Celery worker for production async processing.

This module is only imported when Redis/Celery are configured. To run it:

    pip install celery redis
    celery -A app.worker.celery_app worker --loglevel=info

The web app dispatches ingestion through ``app.services.tasks.enqueue_ingestion``
which falls back to inline FastAPI background tasks when no broker is present, so
this file is entirely optional for local development.
"""
from __future__ import annotations

import asyncio

from app.config import settings

try:  # pragma: no cover - optional dependency
    from celery import Celery

    celery_app = Celery(
        "tenderpilot",
        broker=settings.redis_url or "redis://localhost:6379/0",
        backend=settings.redis_url or "redis://localhost:6379/1",
    )
    celery_app.conf.update(
        task_serializer="pickle",
        accept_content=["pickle", "json"],
        result_serializer="json",
        task_acks_late=True,
        worker_prefetch_multiplier=1,
    )

    @celery_app.task(name="ingest_tender", bind=True, max_retries=3)
    def ingest_tender_celery(self, tender_id: str, data: bytes) -> None:
        from app.services.tasks import ingest_tender_job

        try:
            asyncio.run(ingest_tender_job(tender_id, data))
        except Exception as exc:  # noqa: BLE001
            raise self.retry(exc=exc, countdown=10)

except ImportError:  # Celery not installed — production extra not enabled.
    celery_app = None  # type: ignore

    def ingest_tender_celery(*args, **kwargs):  # type: ignore
        raise RuntimeError("Celery is not installed; install the production extras")
