"""Tender analysis endpoint: requirements, scoring, matching, recommendation."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.deps import CompanyId, CurrentUser, DbSession
from app.models.company import Company
from app.models.document import ComplianceDocument
from app.models.tender import STATUS_READY, Tender, TenderMatch, TenderRequirement
from app.schemas.tender import (
    AnalysisResult,
    EvaluationCriterionOut,
    MatchOut,
    RequirementOut,
)
from app.services import analysis as analysis_svc
from app.services import compliance as compliance_svc
from app.services import matching as matching_svc
from app.services.events import audit, notify, track

router = APIRouter(prefix="/tenders/{tender_id}/analysis", tags=["analysis"])


async def _get_owned(db: DbSession, tender_id: str, company_id: str) -> Tender:
    tender = await db.get(Tender, tender_id)
    if not tender or tender.company_id != company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tender not found")
    return tender


@router.post("", response_model=AnalysisResult)
async def run_analysis(
    tender_id: str, company_id: CompanyId, user: CurrentUser, db: DbSession
) -> AnalysisResult:
    tender = await _get_owned(db, tender_id, company_id)
    if tender.processing_status != STATUS_READY:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Tender is not ready (status: {tender.processing_status}). "
            "Wait for processing to finish or call /reprocess.",
        )

    # 1) Extract requirements + eval criteria + summary (grounded).
    extracted = await analysis_svc.extract_requirements(db, tender)
    requirements = await analysis_svc.persist_requirements(db, tender, extracted)
    eval_criteria = await analysis_svc.persist_eval_criteria(db, tender)
    tender.summary = await analysis_svc.summarize(db, tender)

    # 2) Score requirements against the company's compliance vault.
    company = await db.get(Company, company_id)
    docs = list(
        (
            await db.execute(
                select(ComplianceDocument).where(
                    ComplianceDocument.company_id == company_id
                )
            )
        ).scalars().all()
    )
    result = compliance_svc.score_requirements(tender, requirements, company, docs)
    verdict_by_id = {v.requirement_id: v for v in result.verdicts}
    for req in requirements:
        v = verdict_by_id.get(req.id)
        if v:
            req.status = v.status
            req.note = v.note

    # 3) Run the matching engine → scores + recommendation.
    match_res = matching_svc.compute_match(company, tender, result.readiness_score)
    tender.score = match_res.match_score
    tender.risk = matching_svc.risk_band(match_res.risk_score)

    match = (
        await db.execute(
            select(TenderMatch).where(
                TenderMatch.tender_id == tender.id,
                TenderMatch.company_id == company_id,
            )
        )
    ).scalar_one_or_none()
    if match is None:
        match = TenderMatch(tender_id=tender.id, company_id=company_id)
        db.add(match)
    match.match_score = match_res.match_score
    match.risk_score = match_res.risk_score
    match.qualification_probability = match_res.qualification_probability
    match.recommendation = match_res.recommendation
    match.rationale = match_res.rationale

    await db.flush()

    # 4) Notify on gaps + record analytics.
    if result.missing_documents:
        await notify(
            db,
            user.id,
            type="missing_requirement",
            title=f"{len(result.missing_documents)} document gap(s) for {tender.reference or tender.title}",
            body="Missing/expired: " + ", ".join(result.missing_documents),
            link=f"/tenders/{tender.id}",
        )
    await audit(db, user.id, "tender.analyze", "tender", tender.id)
    await track(
        db,
        "tender_analyzed",
        user.id,
        company_id,
        {"score": tender.score, "risk": tender.risk, "rec": match_res.recommendation},
    )

    return AnalysisResult(
        tender_id=tender.id,
        summary=tender.summary or "",
        requirements=[RequirementOut.model_validate(r) for r in requirements],
        eval_criteria=[EvaluationCriterionOut.model_validate(c) for c in eval_criteria],
        match=MatchOut.model_validate(match),
        score=tender.score,
        risk=tender.risk,
        recommendation=match_res.recommendation,
        missing_documents=result.missing_documents,
    )


@router.get("", response_model=AnalysisResult)
async def get_analysis(
    tender_id: str, company_id: CompanyId, db: DbSession
) -> AnalysisResult:
    tender = await _get_owned(db, tender_id, company_id)
    requirements = list(
        (
            await db.execute(
                select(TenderRequirement)
                .where(TenderRequirement.tender_id == tender.id)
                .order_by(TenderRequirement.section)
            )
        ).scalars().all()
    )
    if not requirements and not tender.summary:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "No analysis yet — POST to run it first"
        )
    match = (
        await db.execute(
            select(TenderMatch).where(
                TenderMatch.tender_id == tender.id,
                TenderMatch.company_id == company_id,
            )
        )
    ).scalar_one_or_none()
    return AnalysisResult(
        tender_id=tender.id,
        summary=tender.summary or "",
        requirements=[RequirementOut.model_validate(r) for r in requirements],
        eval_criteria=[
            EvaluationCriterionOut.model_validate(c) for c in tender.eval_criteria
        ],
        match=MatchOut.model_validate(match) if match else None,
        score=tender.score,
        risk=tender.risk,
        recommendation=match.recommendation if match else None,
        missing_documents=[],
    )
