"""Company profile model — the bidding SME's identity used for matching."""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import JSON, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.document import ComplianceDocument


class Company(Base):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(255), index=True)
    registration_number: Mapped[Optional[str]] = mapped_column(String(64), default=None)
    csd_number: Mapped[Optional[str]] = mapped_column(String(64), default=None)
    vat_number: Mapped[Optional[str]] = mapped_column(String(32), default=None)

    industry: Mapped[Optional[str]] = mapped_column(String(120), default=None)
    province: Mapped[Optional[str]] = mapped_column(String(64), default=None)
    bbbee_level: Mapped[Optional[int]] = mapped_column(Integer, default=None)
    cidb_grading: Mapped[Optional[str]] = mapped_column(String(32), default=None)

    years_experience: Mapped[Optional[int]] = mapped_column(Integer, default=None)
    employee_count: Mapped[Optional[int]] = mapped_column(Integer, default=None)
    annual_turnover: Mapped[Optional[str]] = mapped_column(String(64), default=None)

    # Free-form capability tags, certifications, service categories.
    service_categories: Mapped[list] = mapped_column(JSON, default=list)
    certifications: Mapped[list] = mapped_column(JSON, default=list)
    capability_statement: Mapped[Optional[str]] = mapped_column(Text, default=None)
    contact_email: Mapped[Optional[str]] = mapped_column(String(320), default=None)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(32), default=None)

    members: Mapped[list["User"]] = relationship(
        back_populates="company", lazy="selectin"
    )
    documents: Mapped[list["ComplianceDocument"]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
