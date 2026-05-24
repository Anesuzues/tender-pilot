"""Proposal section generation (grounded in tender + company profile)."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.models.tender import Tender, TenderChunk, TenderRequirement
from app.services.llm import generate

# Canonical sections the builder can produce.
SECTION_DEFS = [
    ("cover_letter", "Cover Letter"),
    ("executive_summary", "Executive Summary"),
    ("company_background", "Company Background"),
    ("methodology", "Technical Methodology"),
    ("compliance_matrix", "Compliance Matrix"),
    ("pricing_notes", "Pricing Schedule Notes"),
    ("references", "References & Case Studies"),
    ("submission_checklist", "Submission Checklist"),
]
SECTION_TITLES = dict(SECTION_DEFS)

# Sections built deterministically from structured data (not free-form LLM text).
DATA_DRIVEN = {"compliance_matrix", "submission_checklist"}


def word_count(text: str | None) -> int:
    return len(text.split()) if text else 0


async def _tender_context(db: AsyncSession, tender: Tender, limit: int = 6) -> str:
    chunks = (
        await db.execute(
            select(TenderChunk)
            .where(TenderChunk.tender_id == tender.id)
            .order_by(TenderChunk.chunk_index)
            .limit(limit)
        )
    ).scalars().all()
    return "\n\n".join(c.content for c in chunks)[:5000]


def _company_brief(company: Company) -> str:
    parts = [f"Company: {company.name}"]
    if company.industry:
        parts.append(f"Industry: {company.industry}")
    if company.province:
        parts.append(f"Province: {company.province}")
    if company.bbbee_level:
        parts.append(f"B-BBEE Level: {company.bbbee_level}")
    if company.years_experience:
        parts.append(f"Experience: {company.years_experience} years")
    if company.certifications:
        parts.append("Certifications: " + ", ".join(company.certifications))
    if company.service_categories:
        parts.append("Services: " + ", ".join(company.service_categories))
    if company.capability_statement:
        parts.append("Capability: " + company.capability_statement[:600])
    return "\n".join(parts)


async def generate_section(
    db: AsyncSession, tender: Tender, company: Company, kind: str
) -> str:
    if kind == "compliance_matrix":
        return await _compliance_matrix(db, tender, company)
    if kind == "submission_checklist":
        return _submission_checklist(tender)

    context = await _tender_context(db, tender)
    company_brief = _company_brief(company)
    instructions = _PROMPTS.get(kind, "Write this proposal section.")

    prompt = (
        f"{instructions}\n\n"
        f"COMPANY PROFILE:\n{company_brief}\n\n"
        f"CONTEXT:\n{context}\n\n"
        f"QUESTION: Draft the '{SECTION_TITLES.get(kind, kind)}' section now. "
        "Use the company profile for our strengths and the tender context for "
        "requirements. Do not invent tender requirements; cite pages where used."
    )
    return await generate(prompt)


_PROMPTS = {
    "cover_letter": (
        "Write a concise, professional cover letter (under 300 words) from the "
        "bidding company to the procuring entity, referencing the tender title "
        "and reference number, and expressing intent to bid."
    ),
    "executive_summary": (
        "Write an executive summary (300-500 words) positioning the company to "
        "win, highlighting fit with the tender scope and key differentiators."
    ),
    "company_background": (
        "Write a company background section establishing credibility, experience, "
        "B-BBEE status and relevant capabilities."
    ),
    "methodology": (
        "Write a technical methodology / delivery approach describing phases, "
        "governance, quality and risk management aligned to the tender scope."
    ),
    "pricing_notes": (
        "Write pricing schedule notes: assumptions, exclusions, validity period, "
        "and PPPFA price-evaluation alignment. Do NOT invent prices."
    ),
    "references": (
        "Write a references and case-studies section template with placeholders "
        "for 3 comparable past projects (client, scope, value, outcome)."
    ),
}


async def _compliance_matrix(db: AsyncSession, tender: Tender, company: Company) -> str:
    reqs = (
        await db.execute(
            select(TenderRequirement)
            .where(TenderRequirement.tender_id == tender.id)
            .order_by(TenderRequirement.section)
        )
    ).scalars().all()
    if not reqs:
        return (
            "| # | Requirement | Status | Evidence |\n"
            "|---|-------------|--------|----------|\n"
            "| — | No requirements extracted yet. Run analysis first. | — | — |\n"
        )
    lines = [
        "| Section | Requirement | Status | Evidence / Note |",
        "|---------|-------------|--------|-----------------|",
    ]
    status_label = {"pass": "✅ Met", "warn": "⚠️ Partial", "fail": "❌ Gap", "unknown": "🔍 Review"}
    for r in reqs:
        evidence = r.note or ("Page " + str(r.page) if r.page else "—")
        text = r.text.replace("|", "/")[:160]
        lines.append(
            f"| {r.section or '—'} | {text} | {status_label.get(r.status, r.status)} | {evidence} |"
        )
    return "\n".join(lines)


def _submission_checklist(tender: Tender) -> str:
    items = [
        "Signed cover letter on company letterhead",
        "Valid CSD registration report",
        "Tax Compliance Status (TCS) PIN — issued within 12 months",
        "B-BBEE certificate or sworn affidavit",
        "CIPC company registration documents (CoR 14.3 / CoR 15.1)",
        "SBD 1 — Invitation to Bid (completed & signed)",
        "SBD 4 — Declaration of Interest",
        "SBD 6.1 — Preference Points Claim Form",
        "SBD 8 — Declaration of Bidder's Past Supply Chain Practices",
        "SBD 9 — Certificate of Independent Bid Determination",
        "Completed pricing schedule",
        "Technical proposal / methodology",
        "Company profile & relevant references",
    ]
    if tender.cidb:
        items.append(f"CIDB grading certificate ({tender.cidb})")
    header = f"Submission checklist for {tender.reference or tender.title}:\n"
    return header + "\n".join(f"- [ ] {it}" for it in items)


def render_proposal(title: str, sections: list[tuple[str, str | None]], fmt: str) -> str:
    """Render the full proposal for export (markdown/html/text)."""
    if fmt == "html":
        parts = [f"<h1>{title}</h1>"]
        for stitle, content in sections:
            parts.append(f"<h2>{stitle}</h2>")
            parts.append(f"<div>{(content or '').replace(chr(10), '<br/>')}</div>")
        return "\n".join(parts)
    if fmt == "text":
        parts = [title, "=" * len(title), ""]
        for stitle, content in sections:
            parts += [stitle, "-" * len(stitle), content or "(empty)", ""]
        return "\n".join(parts)
    # markdown (default)
    parts = [f"# {title}", ""]
    for stitle, content in sections:
        parts += [f"## {stitle}", "", content or "_(empty)_", ""]
    return "\n".join(parts)
