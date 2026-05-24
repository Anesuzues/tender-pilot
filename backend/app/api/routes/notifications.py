"""Notification routes."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, update

from app.deps import CurrentUser, DbSession
from app.models.system import Notification
from app.schemas.common import Message
from app.schemas.system import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    user: CurrentUser, db: DbSession, unread_only: bool = False
) -> list[NotificationOut]:
    stmt = select(Notification).where(Notification.user_id == user.id)
    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))
    rows = (
        await db.execute(stmt.order_by(Notification.created_at.desc()).limit(100))
    ).scalars().all()
    return [NotificationOut.model_validate(n) for n in rows]


@router.post("/{notification_id}/read", response_model=NotificationOut)
async def mark_read(notification_id: str, user: CurrentUser, db: DbSession) -> NotificationOut:
    n = await db.get(Notification, notification_id)
    if not n or n.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    n.is_read = True
    await db.flush()
    return NotificationOut.model_validate(n)


@router.post("/read-all", response_model=Message)
async def mark_all_read(user: CurrentUser, db: DbSession) -> Message:
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    return Message(message="All notifications marked read")
