"""Proposal builder models."""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    pass

# Section workflow states (mirrors frontend PROPOSAL_SECTIONS).
SECTION_AUTO = "auto"
SECTION_DRAFT = "draft"
SECTION_AI_DRAFT = "ai-draft"
SECTION_IN_REVIEW = "in-review"
SECTION_APPROVED = "approved"


class ProposalDraft(Base):
    __tablename__ = "proposal_drafts"

    tender_id: Mapped[str] = mapped_column(
        ForeignKey("tenders.id", ondelete="CASCADE"), index=True
    )
    company_id: Mapped[str] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(512))
    status: Mapped[str] = mapped_column(String(32), default="draft")

    sections: Mapped[list["ProposalSection"]] = relationship(
        back_populates="draft",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ProposalSection.order_index",
    )


class ProposalSection(Base):
    __tablename__ = "proposal_sections"

    draft_id: Mapped[str] = mapped_column(
        ForeignKey("proposal_drafts.id", ondelete="CASCADE"), index=True
    )
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    # cover_letter | executive_summary | compliance_matrix | methodology | ...
    kind: Mapped[str] = mapped_column(String(64))
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[Optional[str]] = mapped_column(Text, default=None)
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default=SECTION_DRAFT)

    draft: Mapped["ProposalDraft"] = relationship(back_populates="sections")
