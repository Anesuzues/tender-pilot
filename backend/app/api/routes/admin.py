"""Admin dashboard routes (owner/admin only)."""
from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import func, select

from datetime import timedelta

from app.config import settings
from app.database import utcnow
from app.deps import AdminUser, DbSession, SuperUser
from app.models.company import Company
from app.models.document import ComplianceDocument
from app.models.system import AuditLog
from app.models.tender import Tender
from app.models.user import User
from app.schemas.system import (
    AdminOverview,
    PlatformCompanyRow,
    PlatformOverview,
    PlatformUserRow,
)

router = APIRouter(prefix="/admin", tags=["admin"])


async def _count(db: DbSession, model) -> int:
    return (await db.execute(select(func.count()).select_from(model))).scalar_one()


@router.get("/overview", response_model=AdminOverview)
async def admin_overview(user: AdminUser, db: DbSession) -> AdminOverview:
    return AdminOverview(
        total_users=await _count(db, User),
        total_companies=await _count(db, Company),
        total_tenders=await _count(db, Tender),
        total_documents=await _count(db, ComplianceDocument),
        ai_enabled=settings.ai_enabled,
        llm_provider=settings.llm_provider,
        embedding_provider=settings.embedding_provider,
        storage_backend=settings.storage_backend,
        environment=settings.environment,
    )


@router.get("/platform", response_model=PlatformOverview)
async def platform_overview(user: SuperUser, db: DbSession) -> PlatformOverview:
    """Cross-company platform view — super-admin only."""
    companies = (
        await db.execute(select(Company).order_by(Company.created_at.desc()))
    ).scalars().all()

    # Per-company counts
    company_rows: list[PlatformCompanyRow] = []
    for c in companies:
        users = (
            await db.execute(select(func.count()).select_from(User).where(User.company_id == c.id))
        ).scalar_one()
        tenders = (
            await db.execute(select(func.count()).select_from(Tender).where(Tender.company_id == c.id))
        ).scalar_one()
        docs = (
            await db.execute(
                select(func.count()).select_from(ComplianceDocument).where(ComplianceDocument.company_id == c.id)
            )
        ).scalar_one()
        company_rows.append(PlatformCompanyRow(
            id=c.id, name=c.name, province=c.province, bbbee_level=c.bbbee_level,
            users=users, tenders=tenders, documents=docs,
            created_at=c.created_at.isoformat(),
        ))

    recent_users = (
        await db.execute(select(User).order_by(User.created_at.desc()).limit(25))
    ).scalars().all()
    user_rows = [
        PlatformUserRow(
            id=u.id, email=u.email, full_name=u.full_name, role=u.role,
            is_superuser=u.is_superuser, is_active=u.is_active,
            company_id=u.company_id, created_at=u.created_at.isoformat(),
        )
        for u in recent_users
    ]

    cutoff = utcnow() - timedelta(days=30)
    active_30d = (
        await db.execute(select(func.count()).select_from(User).where(User.created_at >= cutoff))
    ).scalar_one()

    return PlatformOverview(
        total_users=await _count(db, User),
        total_companies=await _count(db, Company),
        total_tenders=await _count(db, Tender),
        total_documents=await _count(db, ComplianceDocument),
        active_users_30d=active_30d,
        ai_enabled=settings.ai_enabled,
        llm_provider=settings.llm_provider,
        storage_backend=settings.storage_backend,
        environment=settings.environment,
        companies=company_rows,
        recent_users=user_rows,
    )


@router.get("/audit-logs")
async def audit_logs(user: AdminUser, db: DbSession, limit: int = 100) -> list[dict]:
    rows = (
        await db.execute(
            select(AuditLog).order_by(AuditLog.created_at.desc()).limit(min(limit, 500))
        )
    ).scalars().all()
    return [
        {
            "id": r.id,
            "actor_id": r.actor_id,
            "action": r.action,
            "resource_type": r.resource_type,
            "resource_id": r.resource_id,
            "detail": r.detail,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]
