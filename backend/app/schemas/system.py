"""Notification, analytics, and admin schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, TimestampedModel


class NotificationOut(TimestampedModel):
    type: str
    channel: str
    title: str
    body: Optional[str] = None
    is_read: bool
    link: Optional[str] = None


class TenderActivityPoint(BaseModel):
    month: str
    uploaded: int
    won: int
    lost: int


class DashboardStats(BaseModel):
    active_tenders: int
    avg_match_score: int
    closing_soon: int
    vault_completeness: int
    open_proposals: int
    unread_notifications: int


class AnalyticsOverview(BaseModel):
    stats: DashboardStats
    activity_by_month: list[TenderActivityPoint]
    tenders_by_status: dict[str, int]
    tenders_by_province: dict[str, int]


class AdminOverview(BaseModel):
    total_users: int
    total_companies: int
    total_tenders: int
    total_documents: int
    ai_enabled: bool
    llm_provider: str
    embedding_provider: str
    storage_backend: str
    environment: str


class PlatformCompanyRow(BaseModel):
    id: str
    name: str
    province: str | None = None
    bbbee_level: int | None = None
    users: int
    tenders: int
    documents: int
    created_at: str


class PlatformUserRow(BaseModel):
    id: str
    email: str
    full_name: str | None = None
    role: str
    is_superuser: bool
    is_active: bool
    company_id: str | None = None
    created_at: str


class PlatformOverview(BaseModel):
    total_users: int
    total_companies: int
    total_tenders: int
    total_documents: int
    active_users_30d: int
    ai_enabled: bool
    llm_provider: str
    storage_backend: str
    environment: str
    companies: list[PlatformCompanyRow]
    recent_users: list[PlatformUserRow]
