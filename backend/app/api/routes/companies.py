"""Company profile routes (one company per user in the MVP)."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.deps import CurrentUser, DbSession
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyOut, CompanyUpdate
from app.services.events import audit

router = APIRouter(prefix="/companies", tags=["companies"])


@router.post("", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
async def create_company(
    payload: CompanyCreate, user: CurrentUser, db: DbSession
) -> CompanyOut:
    if user.company_id:
        raise HTTPException(status.HTTP_409_CONFLICT, "User already has a company")
    company = Company(**payload.model_dump())
    db.add(company)
    await db.flush()
    user.company_id = company.id
    await audit(db, user.id, "company.create", "company", company.id)
    return CompanyOut.model_validate(company)


@router.get("/me", response_model=CompanyOut)
async def my_company(user: CurrentUser, db: DbSession) -> CompanyOut:
    if not user.company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No company profile")
    company = await db.get(Company, user.company_id)
    if not company:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No company profile")
    return CompanyOut.model_validate(company)


@router.patch("/me", response_model=CompanyOut)
async def update_company(
    payload: CompanyUpdate, user: CurrentUser, db: DbSession
) -> CompanyOut:
    if not user.company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No company profile")
    company = await db.get(Company, user.company_id)
    if not company:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No company profile")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    await db.flush()
    await audit(db, user.id, "company.update", "company", company.id)
    return CompanyOut.model_validate(company)
