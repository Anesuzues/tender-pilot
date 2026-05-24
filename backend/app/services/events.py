"""Audit logging, analytics, and notification helpers."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system import AnalyticsEvent, AuditLog, Notification


async def audit(
    db: AsyncSession,
    actor_id: str | None,
    action: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    ip_address: str | None = None,
    detail: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            detail=detail or {},
        )
    )


async def track(
    db: AsyncSession,
    name: str,
    user_id: str | None = None,
    company_id: str | None = None,
    properties: dict | None = None,
) -> None:
    db.add(
        AnalyticsEvent(
            name=name,
            user_id=user_id,
            company_id=company_id,
            properties=properties or {},
        )
    )


async def notify(
    db: AsyncSession,
    user_id: str,
    type: str,
    title: str,
    body: str | None = None,
    channel: str = "dashboard",
    link: str | None = None,
    meta: dict | None = None,
) -> Notification:
    n = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        channel=channel,
        link=link,
        meta=meta or {},
    )
    db.add(n)
    return n
