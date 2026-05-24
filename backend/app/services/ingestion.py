"""Tender ingestion pipeline: extract → clean → chunk → embed → store.

Mirrors the RAG pipeline in the developer guide. Designed to be called either
synchronously (small docs / dev) or from a Celery worker (production).
"""
from __future__ import annotations

import logging

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tender import (
    STATUS_EMBEDDING,
    STATUS_EXTRACTING,
    STATUS_FAILED,
    STATUS_READY,
    Tender,
    TenderChunk,
)
from app.services import pdf as pdf_service
from app.services.chunking import chunk_document
from app.services.embeddings import embed_texts

logger = logging.getLogger("tenderpilot.ingestion")


async def process_tender_document(db: AsyncSession, tender_id: str, data: bytes) -> Tender:
    """Run the full pipeline for one tender PDF and persist chunks + status."""
    tender = await db.get(Tender, tender_id)
    if tender is None:
        raise ValueError(f"Tender {tender_id} not found")

    try:
        tender.processing_status = STATUS_EXTRACTING
        await db.flush()

        doc = pdf_service.extract_pdf(data)
        tender.page_count = doc.page_count
        tender.extracted_text = doc.full_text[:500_000]  # cap stored text
        tender.document_count = 1

        if pdf_service.needs_ocr(doc):
            # OCR hook point — Tesseract/Document AI would run here. We continue
            # with whatever text exists so the pipeline never hard-fails.
            logger.warning("Tender %s looks scanned; OCR recommended", tender_id)

        tender.processing_status = STATUS_EMBEDDING
        await db.flush()

        # Replace any previous chunks (re-ingestion safe).
        await db.execute(delete(TenderChunk).where(TenderChunk.tender_id == tender_id))

        chunks = chunk_document(doc)
        if chunks:
            vectors = await embed_texts([c.content for c in chunks])
            for c, vec in zip(chunks, vectors):
                db.add(
                    TenderChunk(
                        tender_id=tender_id,
                        chunk_index=c.index,
                        content=c.content,
                        page=c.page,
                        token_count=c.token_count,
                        embedding=vec,
                        meta={},
                    )
                )

        tender.processing_status = STATUS_READY
        tender.processing_error = None
        await db.flush()
        return tender
    except Exception as exc:  # noqa: BLE001
        logger.exception("Ingestion failed for tender %s", tender_id)
        tender.processing_status = STATUS_FAILED
        tender.processing_error = str(exc)[:500]
        await db.flush()
        raise
