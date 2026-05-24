"""Tender analysis: requirement extraction, summary, eval criteria.

The extractor is rule-based and grounded — it only surfaces requirement-like
sentences that actually appear in the tender text, tagging each with the page it
came from (honouring "never invent requirements"). When an LLM key is present,
``summarize`` produces a richer narrative; otherwise an extractive summary is
used.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tender import (
    EvaluationCriterion,
    Tender,
    TenderChunk,
    TenderRequirement,
)
from app.services.llm import generate

# Phrases that signal a mandatory/eligibility requirement in SA tenders.
_REQ_TRIGGERS = re.compile(
    r"\b(must|shall|required to|is required|mandatory|bidders? must|"
    r"shall be|registered on|valid|minimum of|at least|certification|"
    r"compliance|tax compliance|csd|b-?bbee|cidb|psira|iso \d|sbd ?\d)\b",
    re.IGNORECASE,
)

# Category hints used for matching & compliance mapping.
_CATEGORY_HINTS = {
    "CSD": re.compile(r"\bcsd|central supplier database\b", re.I),
    "Tax": re.compile(r"\btax compliance|tcs|sars|vat\b", re.I),
    "B-BBEE": re.compile(r"\bb-?bbee|broad-based|preference points|sbd ?6", re.I),
    "CIPC": re.compile(r"\bcipc|cor ?14|company registration\b", re.I),
    "Insurance": re.compile(r"\binsurance|public liability|coid|good standing\b", re.I),
    "Certification": re.compile(r"\biso ?\d|certification|accredit", re.I),
    "Experience": re.compile(r"\bexperience|years|track record|references?\b", re.I),
    "CIDB": re.compile(r"\bcidb\b", re.I),
    "SBD": re.compile(r"\bsbd ?\d", re.I),
}

_SECTION_RE = re.compile(r"\b(\d+(?:\.\d+){0,2})\b")
_SENT_RE = re.compile(r"(?<=[.!?])\s+")


@dataclass
class ExtractedRequirement:
    section: str | None
    text: str
    page: int | None
    category: str | None


def _categorize(text: str) -> str | None:
    for cat, rx in _CATEGORY_HINTS.items():
        if rx.search(text):
            return cat
    return None


async def extract_requirements(
    db: AsyncSession, tender: Tender
) -> list[ExtractedRequirement]:
    chunks = (
        await db.execute(
            select(TenderChunk)
            .where(TenderChunk.tender_id == tender.id)
            .order_by(TenderChunk.chunk_index)
        )
    ).scalars().all()

    found: list[ExtractedRequirement] = []
    seen: set[str] = set()
    for chunk in chunks:
        for sent in _SENT_RE.split(chunk.content):
            s = sent.strip()
            if len(s) < 25 or len(s) > 400:
                continue
            if not _REQ_TRIGGERS.search(s):
                continue
            key = s.lower()[:120]
            if key in seen:
                continue
            seen.add(key)
            section_m = _SECTION_RE.search(s[:12])
            found.append(
                ExtractedRequirement(
                    section=section_m.group(1) if section_m else None,
                    text=s,
                    page=chunk.page,
                    category=_categorize(s),
                )
            )
            if len(found) >= 40:
                return found
    return found


async def persist_requirements(
    db: AsyncSession, tender: Tender, reqs: list[ExtractedRequirement]
) -> list[TenderRequirement]:
    await db.execute(
        delete(TenderRequirement).where(TenderRequirement.tender_id == tender.id)
    )
    rows = []
    for r in reqs:
        row = TenderRequirement(
            tender_id=tender.id,
            section=r.section,
            text=r.text,
            page=r.page,
            category=r.category,
            status="unknown",
        )
        db.add(row)
        rows.append(row)
    await db.flush()
    return rows


async def summarize(db: AsyncSession, tender: Tender) -> str:
    chunks = (
        await db.execute(
            select(TenderChunk)
            .where(TenderChunk.tender_id == tender.id)
            .order_by(TenderChunk.chunk_index)
            .limit(8)
        )
    ).scalars().all()
    context = "\n\n".join(c.content for c in chunks)[:6000]
    if not context:
        return "No extractable text was found in this tender document."

    prompt = (
        "Summarize this South African tender in 4-6 sentences for an SME bidder. "
        "Cover what is being procured, who the buyer is, key eligibility, and the "
        "closing arrangements. Cite page numbers where possible.\n\n"
        f"CONTEXT:\n{context}\n\nQUESTION: Provide the tender summary."
    )
    return await generate(prompt)


# --- Evaluation criteria -----------------------------------------------------

# Default 80/20 or 90/10 PPPFA split inferred from the tender value text.
def default_eval_criteria(tender: Tender) -> list[tuple[str, float]]:
    pref = 10.0 if _looks_high_value(tender.value) else 20.0
    price = 90.0 if pref == 10.0 else 80.0
    return [
        ("Functionality / Technical", 100.0),  # gate stage
        (f"Price ({int(price)}/{int(pref)} PPPFA)", price),
        ("Preference Points (B-BBEE)", pref),
    ]


def _looks_high_value(value: str | None) -> bool:
    if not value:
        return False
    digits = re.sub(r"[^\d]", "", value)
    try:
        # PPPFA threshold for 90/10 is contracts above R50m (post-2022 regs).
        return int(digits) >= 50_000_000
    except ValueError:
        return False


async def persist_eval_criteria(db: AsyncSession, tender: Tender) -> list[EvaluationCriterion]:
    await db.execute(
        delete(EvaluationCriterion).where(EvaluationCriterion.tender_id == tender.id)
    )
    rows = []
    for name, weight in default_eval_criteria(tender):
        row = EvaluationCriterion(tender_id=tender.id, name=name, weight=weight)
        db.add(row)
        rows.append(row)
    await db.flush()
    return rows
