"""Compliance Document Vault model."""
from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.company import Company

# Derived status values surfaced to the vault UI.
DOC_VALID = "valid"
DOC_EXPIRING = "expiring"
DOC_EXPIRED = "expired"
DOC_MISSING = "missing"


class ComplianceDocument(Base):
    __tablename__ = "compliance_documents"

    company_id: Mapped[str] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    category: Mapped[str] = mapped_column(String(64))  # CSD, Tax, B-BBEE, CIPC...
    name: Mapped[str] = mapped_column(String(255))
    # Stored status; "expiring"/"expired" are recomputed from expires_on on read.
    status: Mapped[str] = mapped_column(String(16), default=DOC_MISSING)

    expires_on: Mapped[Optional[date]] = mapped_column(Date, default=None)
    uploaded_on: Mapped[Optional[date]] = mapped_column(Date, default=None)
    file_size: Mapped[Optional[str]] = mapped_column(String(32), default=None)
    storage_key: Mapped[Optional[str]] = mapped_column(String(512), default=None)
    file_hash: Mapped[Optional[str]] = mapped_column(String(64), default=None)

    ai_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    # Reference/identifier extracted from the doc (CSD no., policy no., etc.).
    reference: Mapped[Optional[str]] = mapped_column(String(255), default=None)

    company: Mapped["Company"] = relationship(back_populates="documents")
