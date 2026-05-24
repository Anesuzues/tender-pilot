"""Tender ↔ company matching engine.

Produces a match score, risk score, qualification probability and a bid/no-bid
recommendation from explainable, weighted criteria (industry, geography,
certifications, experience, B-BBEE, compliance readiness).
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from app.models.company import Company
from app.models.tender import Tender

# Criterion weights (sum = 1.0).
WEIGHTS = {
    "industry": 0.22,
    "geography": 0.12,
    "certifications": 0.16,
    "experience": 0.15,
    "bbbee": 0.15,
    "compliance": 0.20,
}


@dataclass
class MatchResult:
    match_score: float      # 0-100
    risk_score: float       # 0-100 (higher = riskier)
    qualification_probability: float  # 0-1
    recommendation: str     # "bid" | "review" | "no-bid"
    rationale: dict


def _industry_fit(company: Company, tender: Tender) -> float:
    hay = " ".join(
        filter(None, [tender.title, tender.type, " ".join(tender.tags or [])])
    ).lower()
    if not hay:
        return 0.5
    cats = [c.lower() for c in (company.service_categories or [])]
    if company.industry:
        cats.append(company.industry.lower())
    if not cats:
        return 0.5
    hits = sum(1 for c in cats if c and any(tok in hay for tok in c.split()))
    return min(1.0, 0.3 + 0.7 * (hits / max(len(cats), 1)))


def _geography_fit(company: Company, tender: Tender) -> float:
    if not tender.province or not company.province:
        return 0.7  # neutral-positive: most tenders are national
    return 1.0 if company.province.lower() == tender.province.lower() else 0.6


def _certifications_fit(company: Company, tender: Tender) -> float:
    required = _required_certs(tender)
    if not required:
        return 0.85
    have = {c.lower() for c in (company.certifications or [])}
    matched = sum(1 for r in required if any(r in h or h in r for h in have))
    return 0.2 + 0.8 * (matched / len(required))


def _required_certs(tender: Tender) -> list[str]:
    text = " ".join(filter(None, [tender.title, " ".join(tender.tags or [])])).lower()
    certs = []
    for pat in ["iso 27001", "iso 9001", "psira", "cidb", "nist", "sans"]:
        if pat in text:
            certs.append(pat)
    return certs


def _experience_fit(company: Company, tender: Tender) -> float:
    if company.years_experience is None:
        return 0.5
    required = _required_years(tender)
    if required == 0:
        return min(1.0, 0.5 + company.years_experience / 20)
    return min(1.0, company.years_experience / required)


def _required_years(tender: Tender) -> int:
    text = (tender.title or "") + " " + " ".join(tender.tags or [])
    m = re.search(r"(\d+)\s*[- ]?year", text, re.IGNORECASE)
    return int(m.group(1)) if m else 0


def _bbbee_fit(company: Company, tender: Tender) -> float:
    if not tender.bbbee_required:
        return 0.8
    m = re.search(r"level\s*(\d)", tender.bbbee_required, re.IGNORECASE)
    if not m or company.bbbee_level is None:
        return 0.6
    required = int(m.group(1))
    if company.bbbee_level <= required:
        # Better (lower) level than required → strong preference points.
        return min(1.0, 0.8 + 0.05 * (required - company.bbbee_level))
    return 0.2  # does not meet the minimum level


def compute_match(
    company: Company, tender: Tender, compliance_readiness: int
) -> MatchResult:
    scores = {
        "industry": _industry_fit(company, tender),
        "geography": _geography_fit(company, tender),
        "certifications": _certifications_fit(company, tender),
        "experience": _experience_fit(company, tender),
        "bbbee": _bbbee_fit(company, tender),
        "compliance": compliance_readiness / 100.0,
    }
    weighted = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)
    match_score = round(weighted * 100)

    # Risk rises when key gates are weak or the deadline is tight.
    gate_weakness = (
        (1 - scores["bbbee"]) * 0.4
        + (1 - scores["compliance"]) * 0.4
        + (1 - scores["certifications"]) * 0.2
    )
    risk_score = round(gate_weakness * 100)

    qualification = round(min(1.0, max(0.0, weighted * 1.05)), 2)

    if match_score >= 70 and risk_score <= 40:
        recommendation = "bid"
    elif match_score >= 50:
        recommendation = "review"
    else:
        recommendation = "no-bid"

    return MatchResult(
        match_score=match_score,
        risk_score=risk_score,
        qualification_probability=qualification,
        recommendation=recommendation,
        rationale={k: round(v, 3) for k, v in scores.items()},
    )


def risk_band(risk_score: float) -> str:
    if risk_score <= 33:
        return "low"
    if risk_score <= 66:
        return "medium"
    return "high"
