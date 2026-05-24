"""Compliance document schemas."""
from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import TimestampedModel


class DocumentBase(BaseModel):
    category: str
    name: str
    expires_on: Optional[date] = None
    reference: Optional[str] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    expires_on: Optional[date] = None
    reference: Optional[str] = None
    status: Optional[str] = None


class DocumentOut(TimestampedModel, DocumentBase):
    company_id: str
    status: str
    uploaded_on: Optional[date] = None
    file_size: Optional[str] = None
    ai_verified: bool = False


class VaultSummary(BaseModel):
    total: int
    valid: int
    expiring: int
    expired: int
    missing: int
    completeness: int = Field(ge=0, le=100)
    documents: list[DocumentOut]
