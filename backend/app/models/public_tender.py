"""Public tender feed — mirrored from the National Treasury eTenders OCDS API.

These rows are platform-global (not company-scoped): every user browses the
same feed and imports interesting tenders into their own workspace, where the
normal per-company AI pipeline takes over.
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import JSON, Date, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PublicTender(Base):
    __tablename__ = "public_tenders"

    # OCDS open contracting ID — the upsert key.
    ocid: Mapped[str] = mapped_column(String(120), unique=True, index=True)

    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[Optional[str]] = mapped_column(Text, default=None)
    buyer: Mapped[Optional[str]] = mapped_column(String(255), index=True, default=None)
    category: Mapped[Optional[str]] = mapped_column(String(255), index=True, default=None)
    province: Mapped[Optional[str]] = mapped_column(String(64), index=True, default=None)
    status: Mapped[Optional[str]] = mapped_column(String(32), index=True, default=None)

    value_amount: Mapped[Optional[str]] = mapped_column(String(64), default=None)
    currency: Mapped[Optional[str]] = mapped_column(String(8), default=None)

    published_date: Mapped[Optional[date]] = mapped_column(Date, default=None)
    deadline: Mapped[Optional[date]] = mapped_column(Date, index=True, default=None)

    # [{"title": ..., "url": ...}] from the OCDS documents block.
    documents: Mapped[list] = mapped_column(JSON, default=list)
    source_url: Mapped[Optional[str]] = mapped_column(Text, default=None)
