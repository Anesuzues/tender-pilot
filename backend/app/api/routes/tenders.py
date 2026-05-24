"""Tender CRUD + PDF upload/ingestion routes."""
from __future__ import annotations

from datetime import date
from typing import Annotated, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import func, select

from app.config import settings
from app.deps import CompanyId, CurrentUser, DbSession
from app.models.tender import STATUS_UPLOADED, Tender
from app.schemas.common import Page
from app.schemas.tender import TenderCreate, TenderDetail, TenderOut, TenderUpdate
from app.services.events import audit, track
from app.services.storage import compute_hash, get_storage
from app.services.tasks import enqueue_ingestion, ingest_tender_job

router = APIRouter(prefix="/tenders", tags=["tenders"])


def _closing_days(deadline: Optional[date]) -> Optional[int]:
    if not deadline:
        return None
    return (deadline - date.today()).days


def _to_out(tender: Tender) -> TenderOut:
    out = TenderOut.model_validate(tender)
    out.closing_days = _closing_days(tender.deadline)
    return out


def _to_detail(tender: Tender) -> TenderDetail:
    out = TenderDetail.model_validate(tender)
    out.closing_days = _closing_days(tender.deadline)
    return out


async def _get_owned(db: DbSession, tender_id: str, company_id: str) -> Tender:
    tender = await db.get(Tender, tender_id)
    if not tender or tender.company_id != company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tender not found")
    return tender


@router.get("", response_model=Page[TenderOut])
async def list_tenders(
    company_id: CompanyId,
    db: DbSession,
    workflow_status: Optional[str] = None,
    province: Optional[str] = None,
    q: Optional[str] = Query(default=None, description="Search title/issuer/reference"),
    limit: int = Query(default=50, le=200),
    offset: int = 0,
) -> Page[TenderOut]:
    stmt = select(Tender).where(Tender.company_id == company_id)
    if workflow_status:
        stmt = stmt.where(Tender.workflow_status == workflow_status)
    if province:
        stmt = stmt.where(Tender.province == province)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            Tender.title.ilike(like)
            | Tender.issuer.ilike(like)
            | Tender.reference.ilike(like)
        )

    total = (
        await db.execute(select(func.count()).select_from(stmt.subquery()))
    ).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(Tender.created_at.desc()).limit(limit).offset(offset)
        )
    ).scalars().all()
    return Page(
        items=[_to_out(t) for t in rows], total=total, limit=limit, offset=offset
    )


@router.post("", response_model=TenderOut, status_code=status.HTTP_201_CREATED)
async def create_tender(
    payload: TenderCreate, company_id: CompanyId, user: CurrentUser, db: DbSession
) -> TenderOut:
    tender = Tender(company_id=company_id, **payload.model_dump())
    db.add(tender)
    await db.flush()
    await audit(db, user.id, "tender.create", "tender", tender.id)
    return _to_out(tender)


@router.post("/upload", response_model=TenderOut, status_code=status.HTTP_201_CREATED)
async def upload_tender(
    company_id: CompanyId,
    user: CurrentUser,
    db: DbSession,
    background_tasks: BackgroundTasks,
    file: Annotated[UploadFile, File()],
    title: Annotated[Optional[str], Form()] = None,
    reference: Annotated[Optional[str], Form()] = None,
    issuer: Annotated[Optional[str], Form()] = None,
) -> TenderOut:
    data = await file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File exceeds {settings.max_upload_mb} MB limit",
        )
    if not (file.filename or "").lower().endswith(".pdf") and file.content_type not in (
        "application/pdf",
    ):
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Only PDF is supported")

    file_hash = compute_hash(data)
    key = f"company/{company_id}/tenders/{file_hash}-{file.filename}"
    get_storage().save(key, data, "application/pdf")

    tender = Tender(
        company_id=company_id,
        title=title or (file.filename or "Untitled tender"),
        reference=reference,
        issuer=issuer,
        file_name=file.filename,
        storage_key=key,
        file_hash=file_hash,
        processing_status=STATUS_UPLOADED,
    )
    db.add(tender)
    await db.flush()

    await audit(db, user.id, "tender.upload", "tender", tender.id, detail={"key": key})
    await track(db, "tender_uploaded", user.id, company_id, {"tender_id": tender.id})

    # Commit now so the ingestion worker (separate session / Celery process) can
    # see the tender row before the extract → chunk → embed pipeline runs.
    await db.commit()
    if settings.ingest_inline_sync:
        # Serverless: process within the request (no post-response background).
        await ingest_tender_job(tender.id, data)
    else:
        enqueue_ingestion(background_tasks, tender.id, data)
    return _to_out(tender)


@router.get("/{tender_id}", response_model=TenderDetail)
async def get_tender(tender_id: str, company_id: CompanyId, db: DbSession) -> TenderDetail:
    tender = await _get_owned(db, tender_id, company_id)
    return _to_detail(tender)


@router.patch("/{tender_id}", response_model=TenderOut)
async def update_tender(
    tender_id: str, payload: TenderUpdate, company_id: CompanyId, db: DbSession
) -> TenderOut:
    tender = await _get_owned(db, tender_id, company_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tender, field, value)
    await db.flush()
    return _to_out(tender)


@router.delete("/{tender_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tender(
    tender_id: str, company_id: CompanyId, user: CurrentUser, db: DbSession
) -> None:
    tender = await _get_owned(db, tender_id, company_id)
    if tender.storage_key:
        try:
            get_storage().delete(tender.storage_key)
        except Exception:
            pass
    await db.delete(tender)
    await audit(db, user.id, "tender.delete", "tender", tender_id)


@router.post("/{tender_id}/reprocess", response_model=TenderOut)
async def reprocess_tender(
    tender_id: str,
    company_id: CompanyId,
    db: DbSession,
    background_tasks: BackgroundTasks,
) -> TenderOut:
    tender = await _get_owned(db, tender_id, company_id)
    if not tender.storage_key:
        raise HTTPException(status.HTTP_409_CONFLICT, "Tender has no source document")
    data = get_storage().read(tender.storage_key)
    tender.processing_status = STATUS_UPLOADED
    await db.commit()  # persist status reset before the worker re-reads the row
    if settings.ingest_inline_sync:
        await ingest_tender_job(tender.id, data)
    else:
        enqueue_ingestion(background_tasks, tender.id, data)
    return _to_out(tender)


@router.get("/{tender_id}/download")
async def download_url(tender_id: str, company_id: CompanyId, db: DbSession) -> dict:
    tender = await _get_owned(db, tender_id, company_id)
    if not tender.storage_key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No source document")
    url = get_storage().signed_url(tender.storage_key)
    return {"storage_key": tender.storage_key, "signed_url": url}
