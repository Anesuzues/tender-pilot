"""Analytics & dashboard routes."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter
from sqlalchemy import func, select

from app.deps import CompanyId, CurrentUser, DbSession
from app.models.document import ComplianceDocument
from app.models.proposal import ProposalDraft
from app.models.system import Notification
from app.models.tender import WORKFLOW_ARCHIVED, Tender
from app.schemas.system import (
    AnalyticsOverview,
    DashboardStats,
    TenderActivityPoint,
)
from app.services import compliance as compliance_svc

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
async def overview(
    company_id: CompanyId, user: CurrentUser, db: DbSession
) -> AnalyticsOverview:
    tenders = list(
        (
            await db.execute(select(Tender).where(Tender.company_id == company_id))
        ).scalars().all()
    )
    docs = list(
        (
            await db.execute(
                select(ComplianceDocument).where(
                    ComplianceDocument.company_id == company_id
                )
            )
        ).scalars().all()
    )

    active = [t for t in tenders if t.workflow_status != WORKFLOW_ARCHIVED]
    scored = [t.score for t in tenders if t.score is not None]
    avg_score = round(sum(scored) / len(scored)) if scored else 0

    today = date.today()
    closing_soon = sum(
        1 for t in active if t.deadline and 0 <= (t.deadline - today).days <= 7
    )

    vault = compliance_svc.vault_stats(docs)

    open_proposals = (
        await db.execute(
            select(func.count())
            .select_from(ProposalDraft)
            .where(
                ProposalDraft.company_id == company_id,
                ProposalDraft.status != "submitted",
            )
        )
    ).scalar_one()

    unread = (
        await db.execute(
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user.id, Notification.is_read.is_(False))
        )
    ).scalar_one()

    stats = DashboardStats(
        active_tenders=len(active),
        avg_match_score=avg_score,
        closing_soon=closing_soon,
        vault_completeness=vault.completeness,
        open_proposals=open_proposals,
        unread_notifications=unread,
    )

    # Group by status / province.
    by_status: dict[str, int] = {}
    by_province: dict[str, int] = {}
    for t in tenders:
        by_status[t.workflow_status] = by_status.get(t.workflow_status, 0) + 1
        if t.province:
            by_province[t.province] = by_province.get(t.province, 0) + 1

    return AnalyticsOverview(
        stats=stats,
        activity_by_month=_activity_by_month(tenders),
        tenders_by_status=by_status,
        tenders_by_province=by_province,
    )


def _activity_by_month(tenders: list[Tender], months: int = 6) -> list[TenderActivityPoint]:
    now = datetime.now(timezone.utc)
    buckets: list[TenderActivityPoint] = []
    for i in range(months - 1, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30))
        label = month_start.strftime("%b")
        uploaded = sum(
            1
            for t in tenders
            if t.created_at and t.created_at.strftime("%b %Y") == month_start.strftime("%b %Y")
        )
        buckets.append(TenderActivityPoint(month=label, uploaded=uploaded, won=0, lost=0))
    return buckets
