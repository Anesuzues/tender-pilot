"""Tender, requirement, match, and analysis schemas."""
from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, TimestampedModel


class TenderBase(BaseModel):
    title: str = Field(max_length=512)
    reference: Optional[str] = None
    issuer: Optional[str] = None
    type: Optional[str] = None
    province: Optional[str] = None
    value: Optional[str] = None
    deadline: Optional[date] = None
    published_date: Optional[date] = None
    bbbee_required: Optional[str] = None
    cidb: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    source_url: Optional[str] = None


class TenderCreate(TenderBase):
    pass


class TenderUpdate(BaseModel):
    title: Optional[str] = None
    issuer: Optional[str] = None
    type: Optional[str] = None
    province: Optional[str] = None
    value: Optional[str] = None
    deadline: Optional[date] = None
    bbbee_required: Optional[str] = None
    cidb: Optional[str] = None
    tags: Optional[list[str]] = None
    workflow_status: Optional[str] = None


class RequirementOut(TimestampedModel):
    section: Optional[str] = None
    text: str
    status: str
    page: Optional[int] = None
    note: Optional[str] = None
    category: Optional[str] = None


class EvaluationCriterionOut(ORMModel):
    id: str
    name: str
    weight: float
    score: Optional[float] = None


class TenderOut(TimestampedModel, TenderBase):
    workflow_status: str
    processing_status: str
    processing_error: Optional[str] = None
    score: Optional[int] = None
    risk: Optional[str] = None
    page_count: Optional[int] = None
    document_count: Optional[int] = None
    file_name: Optional[str] = None
    summary: Optional[str] = None
    closing_days: Optional[int] = None


class TenderDetail(TenderOut):
    requirements: list[RequirementOut] = Field(default_factory=list)
    eval_criteria: list[EvaluationCriterionOut] = Field(default_factory=list)


class MatchOut(ORMModel):
    id: str
    tender_id: str
    company_id: str
    match_score: float
    risk_score: float
    qualification_probability: float
    recommendation: Optional[str] = None
    rationale: dict = Field(default_factory=dict)


class AnalysisResult(BaseModel):
    tender_id: str
    summary: str
    requirements: list[RequirementOut]
    eval_criteria: list[EvaluationCriterionOut]
    match: Optional[MatchOut] = None
    score: Optional[int] = None
    risk: Optional[str] = None
    recommendation: Optional[str] = None
    missing_documents: list[str] = Field(default_factory=list)
