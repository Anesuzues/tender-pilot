"""Proposal builder schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import TimestampedModel


class SectionOut(TimestampedModel):
    draft_id: str
    order_index: int
    kind: str
    title: str
    content: Optional[str] = None
    word_count: int
    status: str


class ProposalOut(TimestampedModel):
    tender_id: str
    company_id: str
    title: str
    status: str
    sections: list[SectionOut] = Field(default_factory=list)


class CreateProposalRequest(BaseModel):
    tender_id: str
    title: Optional[str] = None


class SectionUpdate(BaseModel):
    content: Optional[str] = None
    status: Optional[str] = None
    title: Optional[str] = None


class GenerateSectionRequest(BaseModel):
    # cover_letter | executive_summary | compliance_matrix | methodology |
    # pricing_notes | submission_checklist | company_background | references
    kind: str


class ExportRequest(BaseModel):
    format: str = Field(default="markdown", pattern="^(markdown|html|text)$")
