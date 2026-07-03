"""Cross-cutting models: notifications, subscriptions, analytics, audit logs."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    # new_match | closing_deadline | expiring_document | missing_requirement |
    # proposal_completion | system
    type: Mapped[str] = mapped_column(String(48))
    channel: Mapped[str] = mapped_column(String(24), default="dashboard")
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[Optional[str]] = mapped_column(Text, default=None)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    link: Mapped[Optional[str]] = mapped_column(String(512), default=None)
    meta: Mapped[dict] = mapped_column(JSON, default=dict)


class Subscription(Base):
    __tablename__ = "subscriptions"

    company_id: Mapped[str] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    plan: Mapped[str] = mapped_column(String(48), default="free")  # free|starter|pro|enterprise
    status: Mapped[str] = mapped_column(String(24), default="active")
    seats: Mapped[int] = mapped_column(default=1)
    provider_customer_id: Mapped[Optional[str]] = mapped_column(String(128), default=None)


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    user_id: Mapped[Optional[str]] = mapped_column(String(36), index=True, default=None)
    company_id: Mapped[Optional[str]] = mapped_column(String(36), index=True, default=None)
    name: Mapped[str] = mapped_column(String(120), index=True)
    properties: Mapped[dict] = mapped_column(JSON, default=dict)


class AuthThrottle(Base):
    """One row per sensitive auth attempt (login/register/forgot). Counting
    recent rows per key gives rate limiting that survives across serverless
    invocations, unlike in-memory limiters that reset on every cold start."""

    __tablename__ = "auth_throttle"

    key: Mapped[str] = mapped_column(String(400), index=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    actor_id: Mapped[Optional[str]] = mapped_column(String(36), index=True, default=None)
    action: Mapped[str] = mapped_column(String(120), index=True)
    resource_type: Mapped[Optional[str]] = mapped_column(String(64), default=None)
    resource_id: Mapped[Optional[str]] = mapped_column(String(64), default=None)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), default=None)
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
