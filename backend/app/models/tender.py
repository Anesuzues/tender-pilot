"""Tender, chunk, extracted-requirement, match, and evaluation models."""
from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    JSON,
    Date,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    pass

# Tender lifecycle / processing status.
STATUS_UPLOADED = "uploaded"
STATUS_EXTRACTING = "extracting"
STATUS_EMBEDDING = "embedding"
STATUS_ANALYZING = "analyzing"
STATUS_READY = "ready"
STATUS_FAILED = "failed"

# Workflow / pipeline status (mirrors the frontend badges).
WORKFLOW_DRAFT = "draft"
WORKFLOW_IN_REVIEW = "in-review"
WORKFLOW_SHORTLISTED = "shortlisted"
WORKFLOW_FLAGGED = "flagged"
WORKFLOW_ARCHIVED = "archived"


class Tender(Base):
    __tablename__ = "tenders"

    # Human-facing official reference, e.g. "RFB 2025/IT/0142".
    reference: Mapped[Optional[str]] = mapped_column(String(120), index=True, default=None)
    title: Mapped[str] = mapped_column(String(512))
    issuer: Mapped[Optional[str]] = mapped_column(String(255), default=None)
    type: Mapped[Optional[str]] = mapped_column(String(120), default=None)
    province: Mapped[Optional[str]] = mapped_column(String(64), default=None)

    value: Mapped[Optional[str]] = mapped_column(String(64), default=None)
    deadline: Mapped[Optional[date]] = mapped_column(Date, default=None)
    published_date: Mapped[Optional[date]] = mapped_column(Date, default=None)
    bbbee_required: Mapped[Optional[str]] = mapped_column(String(64), default=None)
    cidb: Mapped[Optional[str]] = mapped_column(String(32), default=None)
    tags: Mapped[list] = mapped_column(JSON, default=list)

    # Workflow + processing state.
    workflow_status: Mapped[str] = mapped_column(String(32), default=WORKFLOW_DRAFT)
    processing_status: Mapped[str] = mapped_column(String(32), default=STATUS_UPLOADED)
    processing_error: Mapped[Optional[str]] = mapped_column(Text, default=None)

    # Scores produced by the matching / scoring engines.
    score: Mapped[Optional[int]] = mapped_column(Integer, default=None)
    risk: Mapped[Optional[str]] = mapped_column(String(16), default=None)

    # Source document.
    source_url: Mapped[Optional[str]] = mapped_column(Text, default=None)
    storage_key: Mapped[Optional[str]] = mapped_column(Text, default=None)
    file_name: Mapped[Optional[str]] = mapped_column(String(512), default=None)
    file_hash: Mapped[Optional[str]] = mapped_column(String(64), index=True, default=None)
    page_count: Mapped[Optional[int]] = mapped_column(Integer, default=None)
    document_count: Mapped[Optional[int]] = mapped_column(Integer, default=None)

    # Extracted plain text + AI summary.
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, default=None)
    summary: Mapped[Optional[str]] = mapped_column(Text, default=None)

    company_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True, default=None
    )

    chunks: Mapped[list["TenderChunk"]] = relationship(
        back_populates="tender", cascade="all, delete-orphan", lazy="selectin"
    )
    requirements: Mapped[list["TenderRequirement"]] = relationship(
        back_populates="tender", cascade="all, delete-orphan", lazy="selectin"
    )
    eval_criteria: Mapped[list["EvaluationCriterion"]] = relationship(
        back_populates="tender", cascade="all, delete-orphan", lazy="selectin"
    )


class TenderChunk(Base):
    __tablename__ = "tender_chunks"
    __table_args__ = (
        UniqueConstraint("tender_id", "chunk_index", name="uq_chunk_tender_index"),
    )

    tender_id: Mapped[str] = mapped_column(
        ForeignKey("tenders.id", ondelete="CASCADE"), index=True
    )
    chunk_index: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    page: Mapped[Optional[int]] = mapped_column(Integer, default=None)
    token_count: Mapped[Optional[int]] = mapped_column(Integer, default=None)
    # Embedding stored as a JSON float array (portable). On PostgreSQL with
    # pgvector you would swap this for a Vector(dim) column — see README.
    embedding: Mapped[Optional[list]] = mapped_column(JSON, default=None)
    meta: Mapped[dict] = mapped_column(JSON, default=dict)

    tender: Mapped["Tender"] = relationship(back_populates="chunks")


class TenderRequirement(Base):
    __tablename__ = "tender_requirements"

    tender_id: Mapped[str] = mapped_column(
        ForeignKey("tenders.id", ondelete="CASCADE"), index=True
    )
    section: Mapped[Optional[str]] = mapped_column(String(32), default=None)
    text: Mapped[str] = mapped_column(Text)
    # pass | warn | fail | unknown
    status: Mapped[str] = mapped_column(String(16), default="unknown")
    page: Mapped[Optional[int]] = mapped_column(Integer, default=None)
    note: Mapped[Optional[str]] = mapped_column(Text, default=None)
    category: Mapped[Optional[str]] = mapped_column(String(64), default=None)

    tender: Mapped["Tender"] = relationship(back_populates="requirements")


class EvaluationCriterion(Base):
    __tablename__ = "evaluation_criteria"

    tender_id: Mapped[str] = mapped_column(
        ForeignKey("tenders.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    weight: Mapped[float] = mapped_column(Float, default=0.0)
    score: Mapped[Optional[float]] = mapped_column(Float, default=None)

    tender: Mapped["Tender"] = relationship(back_populates="eval_criteria")


class TenderMatch(Base):
    __tablename__ = "tender_matches"
    __table_args__ = (
        UniqueConstraint("tender_id", "company_id", name="uq_match_tender_company"),
    )

    tender_id: Mapped[str] = mapped_column(
        ForeignKey("tenders.id", ondelete="CASCADE"), index=True
    )
    company_id: Mapped[str] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    match_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    qualification_probability: Mapped[float] = mapped_column(Float, default=0.0)
    recommendation: Mapped[Optional[str]] = mapped_column(String(16), default=None)
    rationale: Mapped[dict] = mapped_column(JSON, default=dict)
