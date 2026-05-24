"""Proposal builder routes."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.deps import CompanyId, CurrentUser, DbSession
from app.models.company import Company
from app.models.proposal import (
    SECTION_AI_DRAFT,
    SECTION_AUTO,
    ProposalDraft,
    ProposalSection,
)
from app.models.tender import Tender
from app.schemas.proposal import (
    CreateProposalRequest,
    ExportRequest,
    GenerateSectionRequest,
    ProposalOut,
    SectionOut,
    SectionUpdate,
)
from app.services import proposals as proposal_svc
from app.services.events import audit, notify

router = APIRouter(prefix="/proposals", tags=["proposals"])


async def _owned_tender(db: DbSession, tender_id: str, company_id: str) -> Tender:
    tender = await db.get(Tender, tender_id)
    if not tender or tender.company_id != company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tender not found")
    return tender


async def _owned_draft(db: DbSession, draft_id: str, company_id: str) -> ProposalDraft:
    draft = await db.get(ProposalDraft, draft_id)
    if not draft or draft.company_id != company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Proposal not found")
    return draft


@router.post("", response_model=ProposalOut, status_code=status.HTTP_201_CREATED)
async def create_proposal(
    payload: CreateProposalRequest, company_id: CompanyId, user: CurrentUser, db: DbSession
) -> ProposalOut:
    tender = await _owned_tender(db, payload.tender_id, company_id)
    draft = ProposalDraft(
        tender_id=tender.id,
        company_id=company_id,
        title=payload.title or f"Proposal — {tender.reference or tender.title}",
    )
    db.add(draft)
    await db.flush()

    # Seed the canonical section skeleton.
    for idx, (kind, title) in enumerate(proposal_svc.SECTION_DEFS):
        db.add(
            ProposalSection(
                draft_id=draft.id,
                order_index=idx,
                kind=kind,
                title=title,
                status=SECTION_AUTO if kind in proposal_svc.DATA_DRIVEN else "draft",
            )
        )
    await db.flush()
    # Load the just-created sections collection in async context before serializing.
    await db.refresh(draft, ["sections"])
    await audit(db, user.id, "proposal.create", "proposal", draft.id)
    return ProposalOut.model_validate(draft)


@router.get("", response_model=list[ProposalOut])
async def list_proposals(company_id: CompanyId, db: DbSession) -> list[ProposalOut]:
    rows = (
        await db.execute(
            select(ProposalDraft)
            .where(ProposalDraft.company_id == company_id)
            .order_by(ProposalDraft.created_at.desc())
        )
    ).scalars().all()
    return [ProposalOut.model_validate(p) for p in rows]


@router.get("/{draft_id}", response_model=ProposalOut)
async def get_proposal(draft_id: str, company_id: CompanyId, db: DbSession) -> ProposalOut:
    draft = await _owned_draft(db, draft_id, company_id)
    return ProposalOut.model_validate(draft)


@router.post("/{draft_id}/sections/generate", response_model=SectionOut)
async def generate_section(
    draft_id: str,
    payload: GenerateSectionRequest,
    company_id: CompanyId,
    user: CurrentUser,
    db: DbSession,
) -> SectionOut:
    draft = await _owned_draft(db, draft_id, company_id)
    tender = await _owned_tender(db, draft.tender_id, company_id)
    company = await db.get(Company, company_id)

    section = next((s for s in draft.sections if s.kind == payload.kind), None)
    if section is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown section '{payload.kind}'")

    content = await proposal_svc.generate_section(db, tender, company, payload.kind)
    section.content = content
    section.word_count = proposal_svc.word_count(content)
    section.status = (
        SECTION_AUTO if payload.kind in proposal_svc.DATA_DRIVEN else SECTION_AI_DRAFT
    )
    await db.flush()
    await audit(db, user.id, "proposal.generate_section", "proposal", draft.id,
                detail={"kind": payload.kind})
    return SectionOut.model_validate(section)


@router.patch("/{draft_id}/sections/{section_id}", response_model=SectionOut)
async def update_section(
    draft_id: str,
    section_id: str,
    payload: SectionUpdate,
    company_id: CompanyId,
    db: DbSession,
) -> SectionOut:
    draft = await _owned_draft(db, draft_id, company_id)
    section = next((s for s in draft.sections if s.id == section_id), None)
    if section is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Section not found")
    data = payload.model_dump(exclude_unset=True)
    if "content" in data:
        section.content = data["content"]
        section.word_count = proposal_svc.word_count(data["content"])
    if "status" in data:
        section.status = data["status"]
    if "title" in data:
        section.title = data["title"]
    await db.flush()
    return SectionOut.model_validate(section)


@router.post("/{draft_id}/export")
async def export_proposal(
    draft_id: str,
    payload: ExportRequest,
    company_id: CompanyId,
    user: CurrentUser,
    db: DbSession,
) -> Response:
    draft = await _owned_draft(db, draft_id, company_id)
    sections = [(s.title, s.content) for s in draft.sections]
    rendered = proposal_svc.render_proposal(draft.title, sections, payload.format)
    media = {
        "markdown": "text/markdown",
        "html": "text/html",
        "text": "text/plain",
    }[payload.format]
    ext = {"markdown": "md", "html": "html", "text": "txt"}[payload.format]
    await audit(db, user.id, "proposal.export", "proposal", draft.id,
                detail={"format": payload.format})
    await notify(
        db, user.id, "proposal_completion",
        title=f"Proposal exported: {draft.title}",
        link=f"/proposals/{draft.id}",
    )
    filename = f"proposal-{draft.id[:8]}.{ext}"
    return Response(
        content=rendered,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
