"""Admin dashboard routes (owner/admin only)."""
from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import func, select

from app.config import settings
from app.deps import AdminUser, DbSession
from app.models.company import Company
from app.models.document import ComplianceDocument
from app.models.system import AuditLog
from app.models.tender import Tender
from app.models.user import User
from app.schemas.system import AdminOverview

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
