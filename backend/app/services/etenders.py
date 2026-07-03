"""Sync from the National Treasury eTenders OCDS API.

Official endpoint (verified): https://ocds-api.etenders.gov.za
Releases follow the Open Contracting Data Standard; we flatten the fields the
platform needs into PublicTender rows, upserting on `ocid`. Data completeness
depends on what procuring entities submit — the UI carries a "verify before
bidding" disclaimer.
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.public_tender import PublicTender

logger = logging.getLogger("tenderpilot.etenders")

OCDS_BASE = "https://ocds-api.etenders.gov.za/api/OCDSReleases"
# Serverless budget: keep well inside the 60s function limit.
MAX_PAGES = 3
PAGE_SIZE = 100


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def _flatten(release: dict) -> dict | None:
    """Map one OCDS release to PublicTender column values."""
    tender = release.get("tender") or {}
    ocid = release.get("ocid")
    if not ocid:
        return None

    buyer = (release.get("buyer") or {}).get("name") or (
        (tender.get("procuringEntity") or {}).get("name")
    )
    value = tender.get("value") or {}
    amount = value.get("amount")
    period = tender.get("tenderPeriod") or {}
    docs = [
        {"title": d.get("title") or d.get("documentType") or "Document", "url": d.get("url")}
        for d in (tender.get("documents") or [])
        if d.get("url")
    ]

    # Prefer a human title; fall back to description or the reference id.
    title = tender.get("title") or ""
    description = tender.get("description") or ""
    if len(title) < 20 and len(description) > len(title):
        title, description = (description[:512], title)

    return dict(
        ocid=ocid,
        title=(title or "Untitled tender")[:512],
        description=description or None,
        buyer=(buyer or None) and buyer[:255],
        category=(tender.get("category") or tender.get("mainProcurementCategory") or None),
        province=(tender.get("province") or None),
        status=(tender.get("status") or None),
        value_amount=(str(amount) if amount else None),
        currency=value.get("currency"),
        published_date=_parse_date(release.get("date")),
        deadline=_parse_date(period.get("endDate")),
        documents=docs,
        source_url=f"https://www.etenders.gov.za/Home/opportunities?id={ocid}",
    )


async def sync_public_tenders(db: AsyncSession, days_back: int = 3) -> dict:
    """Pull recent OCDS releases and upsert them. Returns counts."""
    import httpx

    date_to = date.today() + timedelta(days=1)
    date_from = date.today() - timedelta(days=days_back)
    created = updated = skipped = 0

    async with httpx.AsyncClient(timeout=25) as client:
        for page in range(1, MAX_PAGES + 1):
            resp = await client.get(
                OCDS_BASE,
                params={
                    "PageNumber": page,
                    "PageSize": PAGE_SIZE,
                    "dateFrom": date_from.isoformat(),
                    "dateTo": date_to.isoformat(),
                },
            )
            resp.raise_for_status()
            releases = resp.json().get("releases") or []
            if not releases:
                break

            for release in releases:
                row = _flatten(release)
                if row is None:
                    skipped += 1
                    continue
                existing = (
                    await db.execute(
                        select(PublicTender).where(PublicTender.ocid == row["ocid"])
                    )
                ).scalar_one_or_none()
                if existing:
                    for k, v in row.items():
                        setattr(existing, k, v)
                    updated += 1
                else:
                    db.add(PublicTender(**row))
                    created += 1
            await db.flush()

            if len(releases) < PAGE_SIZE:
                break

    await db.commit()
    logger.info("eTenders sync: %s created, %s updated, %s skipped", created, updated, skipped)
    return {"created": created, "updated": updated, "skipped": skipped}
