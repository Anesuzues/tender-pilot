"""Public tender discovery feed (mirrored from National Treasury eTenders)."""
from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request, status
from sqlalchemy import func, select

from app.config import settings
from app.deps import CompanyId, CurrentUser, DbSession
from app.models.public_tender import PublicTender
from app.models.tender import STATUS_UPLOADED, Tender
from app.schemas.common import Page
from app.schemas.public_tender import PublicTenderOut
from app.schemas.tender import TenderOut
from app.services.etenders import sync_public_tenders
from app.services.events import audit, track
from app.services.storage import compute_hash, get_storage
from app.services.tasks import ingest_tender_job

logger = logging.getLogger("tenderpilot.public_tenders")

router = APIRouter(prefix="/public-tenders", tags=["public-tenders"])


def _to_out(row: PublicTender) -> PublicTenderOut:
    out = PublicTenderOut.model_validate(row)
    if row.deadline:
        out.closing_days = (row.deadline - date.today()).days
    return out


@router.get("", response_model=Page[PublicTenderOut])
async def list_public_tenders(
    user: CurrentUser,
    db: DbSession,
    q: Optional[str] = Query(default=None, description="Search title/buyer/category"),
    province: Optional[str] = None,
    category: Optional[str] = None,
    closing_within_days: Optional[int] = Query(default=None, ge=0, le=365),
    limit: int = Query(default=25, le=100),
    offset: int = 0,
) -> Page[PublicTenderOut]:
    stmt = select(PublicTender).where(
        # Only opportunities that are still open.
        (PublicTender.deadline.is_(None)) | (PublicTender.deadline >= date.today())
    )
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            PublicTender.title.ilike(like)
            | PublicTender.buyer.ilike(like)
            | PublicTender.category.ilike(like)
            | PublicTender.description.ilike(like)
        )
    if province:
        stmt = stmt.where(PublicTender.province == province)
    if category:
        stmt = stmt.where(PublicTender.category.ilike(f"%{category}%"))
    if closing_within_days is not None:
        stmt = stmt.where(
            PublicTender.deadline <= date.today() + timedelta(days=closing_within_days)
        )

    total = (
        await db.execute(select(func.count()).select_from(stmt.subquery()))
    ).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(PublicTender.deadline.asc().nulls_last())
            .limit(limit)
            .offset(offset)
        )
    ).scalars().all()
    return Page(items=[_to_out(r) for r in rows], total=total, limit=limit, offset=offset)


@router.get("/sync")
@router.post("/sync")
async def sync_feed(request: Request, db: DbSession, days_back: int = 3) -> dict:
    """Pull the latest releases from the eTenders OCDS API.

    Callable by the Vercel cron (Authorization: Bearer CRON_SECRET, sent
    automatically when the env var is set) or by a super-admin JWT."""
    auth = request.headers.get("authorization", "")
    token = auth.removeprefix("Bearer ").strip()

    allowed = False
    if settings.cron_secret and token == settings.cron_secret:
        allowed = True
    else:
        # Fall back to super-admin JWT.
        try:
            from app.security import decode_token
            from app.models.user import User

            claims = decode_token(token)
            u = await db.get(User, claims.get("sub"))
            allowed = bool(u and u.is_superuser)
        except Exception:
            allowed = False
    if not allowed:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Sync requires cron secret or super-admin")

    result = await sync_public_tenders(db, days_back=days_back)
    return {"status": "ok", **result}


@router.post("/{public_id}/import", response_model=TenderOut)
async def import_to_workspace(
    public_id: str, company_id: CompanyId, user: CurrentUser, db: DbSession
) -> TenderOut:
    """Copy a public tender into the user's workspace. If a PDF bid document
    is attached, download and run it through the normal AI ingestion pipeline."""
    pub = await db.get(PublicTender, public_id)
    if not pub:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Public tender not found")

    # Skip duplicates: same ocid already imported by this company.
    existing = (
        await db.execute(
            select(Tender).where(
                Tender.company_id == company_id, Tender.source_url == pub.source_url
            )
        )
    ).scalar_one_or_none()
    if existing:
        return TenderOut.model_validate(existing)

    value_str = None
    if pub.value_amount:
        try:
            amount = float(pub.value_amount)
            if amount > 0:
                value_str = f"R {amount:,.0f}"
        except ValueError:
            pass

    tender = Tender(
        company_id=company_id,
        title=pub.title,
        reference=pub.ocid,
        issuer=pub.buyer,
        type=pub.category,
        province=pub.province,
        value=value_str,
        deadline=pub.deadline,
        published_date=pub.published_date,
        source_url=pub.source_url,
        processing_status=STATUS_UPLOADED,
    )
    db.add(tender)
    await db.flush()
    await audit(db, user.id, "tender.import_public", "tender", tender.id,
                detail={"ocid": pub.ocid})
    await track(db, "public_tender_imported", user.id, company_id, {"ocid": pub.ocid})

    # Try to fetch the first PDF bid document and run the AI pipeline on it.
    pdf_url = next(
        (d["url"] for d in (pub.documents or [])
         if ".pdf" in (d.get("url") or "").lower()),
        None,
    )
    data: bytes | None = None
    if pdf_url:
        try:
            import httpx

            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                resp = await client.get(pdf_url)
                resp.raise_for_status()
                if len(resp.content) <= settings.max_upload_mb * 1024 * 1024:
                    data = resp.content
        except Exception as exc:
            logger.warning("Bid document download failed for %s: %s", pub.ocid, exc)

    if data:
        file_hash = compute_hash(data)
        key = f"company/{company_id}/tenders/{file_hash}-{pub.ocid}.pdf"
        get_storage().save(key, data, "application/pdf")
        tender.storage_key = key
        tender.file_name = f"{pub.ocid}.pdf"
        tender.file_hash = file_hash

    await db.commit()
    if data:
        await ingest_tender_job(tender.id, data)
        # Ingestion runs in its own session — expire this session's cached
        # row so the response reflects the post-pipeline processing status.
        db.expire_all()
        refreshed = await db.get(Tender, tender.id)
        if refreshed is not None:
            tender = refreshed
    return TenderOut.model_validate(tender)
