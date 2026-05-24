"""Company profile schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import TimestampedModel


class CompanyBase(BaseModel):
    name: str = Field(max_length=255)
    registration_number: Optional[str] = None
    csd_number: Optional[str] = None
    vat_number: Optional[str] = None
    industry: Optional[str] = None
    province: Optional[str] = None
    bbbee_level: Optional[int] = Field(default=None, ge=1, le=8)
    cidb_grading: Optional[str] = None
    years_experience: Optional[int] = Field(default=None, ge=0)
    employee_count: Optional[int] = Field(default=None, ge=0)
    annual_turnover: Optional[str] = None
    service_categories: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    capability_statement: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    registration_number: Optional[str] = None
    csd_number: Optional[str] = None
    vat_number: Optional[str] = None
    industry: Optional[str] = None
    province: Optional[str] = None
    bbbee_level: Optional[int] = Field(default=None, ge=1, le=8)
    cidb_grading: Optional[str] = None
    years_experience: Optional[int] = Field(default=None, ge=0)
    employee_count: Optional[int] = Field(default=None, ge=0)
    annual_turnover: Optional[str] = None
    service_categories: Optional[list[str]] = None
    certifications: Optional[list[str]] = None
    capability_statement: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class CompanyOut(TimestampedModel, CompanyBase):
    pass
