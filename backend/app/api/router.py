"""Aggregate API router mounting every module under the versioned prefix."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import (
    admin,
    analysis,
    analytics,
    auth,
    chat,
    companies,
    documents,
    notifications,
    proposals,
    public_tenders,
    tenders,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(companies.router)
api_router.include_router(documents.router)
api_router.include_router(tenders.router)
api_router.include_router(public_tenders.router)
api_router.include_router(analysis.router)
api_router.include_router(chat.router)
api_router.include_router(proposals.router)
api_router.include_router(notifications.router)
api_router.include_router(analytics.router)
api_router.include_router(admin.router)
