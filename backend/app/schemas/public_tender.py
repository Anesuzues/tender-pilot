"""Public tender feed schemas."""
from __future__ import annotations

from datetime import date
from typing import Optional

from app.schemas.common import TimestampedModel


class PublicTenderOut(TimestampedModel):
    ocid: str
    title: str
    description: Optional[str] = None
    buyer: Optional[str] = None
    category: Optional[str] = None
    province: Optional[str] = None
    status: Optional[str] = None
    value_amount: Optional[str] = None
    currency: Optional[str] = None
    published_date: Optional[date] = None
    deadline: Optional[date] = None
    closing_days: Optional[int] = None
    documents: list = []
    source_url: Optional[str] = None
