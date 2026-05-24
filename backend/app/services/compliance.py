"""Compliance Vault status logic + bid-readiness scoring.

- ``derive_status`` recomputes valid/expiring/expired from a document's expiry.
- ``score_requirements`` maps a tender's extracted requirements against the
  company's vault to mark each pass/warn/fail and compute a readiness score.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.models.document import (
    DOC_EXPIRED,
    DOC_EXPIRING,
    DOC_MISSING,
    DOC_VALID,
    ComplianceDocument,
)
from app.models.tender import Tender, TenderRequirement

EXPIRY_WARN_DAYS = 30

# Documents every SA public tender effectively requires.
BASELINE_CATEGORIES = ["CSD", "Tax", "B-BBEE", "CIPC"]


def derive_status(doc: ComplianceDocument, today: date | None = None) -> str:
    today = today or date.today()
    # Explicit "missing" placeholder (a required doc the company has not provided).
    if (
        doc.status == DOC_MISSING
        and doc.storage_key is None
        and doc.uploaded_on is None
        and doc.expires_on is None
    ):
        return DOC_MISSING
    if doc.expires_on is None:
        return DOC_VALID  # tracked record with no expiry date
    if doc.expires_on < today:
        return DOC_EXPIRED
    if doc.expires_on <= today + timedelta(days=EXPIRY_WARN_DAYS):
        return DOC_EXPIRING
    return DOC_VALID


@dataclass
class VaultStats:
    total: int
    valid: int
    expiring: int
    expired: int
    missing: int
    completeness: int


def vault_stats(docs: list[ComplianceDocument]) -> VaultStats:
    counts = {DOC_VALID: 0, DOC_EXPIRING: 0, DOC_EXPIRED: 0, DOC_MISSING: 0}
    for d in docs:
        st = derive_status(d)
        counts[st] = counts.get(st, 0) + 1
    total = len(docs)
    usable = counts[DOC_VALID] + counts[DOC_EXPIRING]
    completeness = round((usable / total) * 100) if total else 0
    return VaultStats(
        total=total,
        valid=counts[DOC_VALID],
        expiring=counts[DOC_EXPIRING],
        expired=counts[DOC_EXPIRED],
        missing=counts[DOC_MISSING],
        completeness=completeness,
    )


@dataclass
class RequirementVerdict:
    requirement_id: str
    status: str  # pass | warn | fail
    note: str | None


@dataclass
class ComplianceResult:
    verdicts: list[RequirementVerdict]
    missing_documents: list[str]
    readiness_score: int  # 0-100


def _company_doc_categories(docs: list[ComplianceDocument]) -> dict[str, str]:
    """Best status per category (valid > expiring > expired > missing)."""
    rank = {DOC_VALID: 3, DOC_EXPIRING: 2, DOC_EXPIRED: 1, DOC_MISSING: 0}
    best: dict[str, str] = {}
    for d in docs:
        st = derive_status(d)
        if d.category not in best or rank[st] > rank[best[d.category]]:
            best[d.category] = st
    return best


def score_requirements(
    tender: Tender,
    requirements: list[TenderRequirement],
    company: Company | None,
    docs: list[ComplianceDocument],
) -> ComplianceResult:
    cat_status = _company_doc_categories(docs)
    verdicts: list[RequirementVerdict] = []
    missing: set[str] = set()

    for req in requirements:
        cat = req.category
        status = "warn"
        note: str | None = "Manual review recommended."

        if cat is None:
            status = "warn"
            note = "Could not auto-map to a vault document — review manually."
        else:
            doc_status = cat_status.get(cat)
            mapped_cat = "Tax" if cat in ("Tax",) else cat
            if doc_status == DOC_VALID:
                status, note = "pass", None
            elif doc_status == DOC_EXPIRING:
                status, note = "warn", f"{cat} document expires soon — renew before submission."
            elif doc_status == DOC_EXPIRED:
                status, note = "fail", f"{cat} document has expired."
                missing.add(cat)
            else:
                status, note = "fail", f"No {cat} document on file."
                missing.add(mapped_cat)

        # B-BBEE level gate.
        if cat == "B-BBEE" and company and company.bbbee_level and tender.bbbee_required:
            required_level = _parse_required_level(tender.bbbee_required)
            if required_level and company.bbbee_level > required_level:
                status = "fail"
                note = (
                    f"Company is B-BBEE Level {company.bbbee_level}; tender requires "
                    f"Level {required_level} or better."
                )

        verdicts.append(RequirementVerdict(req.id, status, note))

    # Baseline document gaps (independent of extracted requirements).
    for cat in BASELINE_CATEGORIES:
        if cat_status.get(cat, DOC_MISSING) in (DOC_MISSING, DOC_EXPIRED):
            missing.add(cat)

    readiness = _readiness_score(verdicts, cat_status)
    return ComplianceResult(verdicts, sorted(missing), readiness)


def _parse_required_level(text: str) -> int | None:
    import re

    m = re.search(r"level\s*(\d)", text, re.IGNORECASE)
    return int(m.group(1)) if m else None


def _readiness_score(
    verdicts: list[RequirementVerdict], cat_status: dict[str, str]
) -> int:
    if not verdicts:
        # Score purely on baseline doc coverage.
        have = sum(
            1 for c in BASELINE_CATEGORIES if cat_status.get(c) in (DOC_VALID, DOC_EXPIRING)
        )
        return round(have / len(BASELINE_CATEGORIES) * 100)

    weights = {"pass": 1.0, "warn": 0.5, "fail": 0.0}
    total = sum(weights[v.status] for v in verdicts)
    base = total / len(verdicts) * 100
    # Penalise missing baseline docs.
    baseline_have = sum(
        1 for c in BASELINE_CATEGORIES if cat_status.get(c) in (DOC_VALID, DOC_EXPIRING)
    )
    baseline_factor = 0.7 + 0.3 * (baseline_have / len(BASELINE_CATEGORIES))
    return max(0, min(100, round(base * baseline_factor)))
