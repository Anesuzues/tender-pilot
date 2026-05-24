"""Unit tests for the core service algorithms (no HTTP)."""
from __future__ import annotations

from datetime import date, timedelta

from app.models.company import Company
from app.models.document import ComplianceDocument
from app.models.tender import Tender, TenderRequirement
from app.services import compliance, matching
from app.services.chunking import chunk_document
from app.services.embeddings import local_embed
from app.services.pdf import ExtractedDocument, ExtractedPage
from app.services.vectorstore import cosine


def test_local_embed_normalized_and_similar():
    a = local_embed("cybersecurity soc operations for the public sector")
    b = local_embed("public sector security operations centre services")
    c = local_embed("construction of a district office building phase two")
    # Vectors are L2-normalized.
    assert abs(sum(x * x for x in a) - 1.0) < 1e-6
    # Related texts are more similar than unrelated ones.
    assert cosine(a, b) > cosine(a, c)


def test_chunking_preserves_pages():
    pages = [
        ExtractedPage(1, "Para one on page one.\n\n" + "word " * 400),
        ExtractedPage(2, "Section 3.1 requirement text on page two."),
    ]
    doc = ExtractedDocument(pages=pages, page_count=2)
    chunks = chunk_document(doc)
    assert len(chunks) >= 2
    assert {c.page for c in chunks} <= {1, 2}
    assert all(c.content for c in chunks)


def test_derive_status_expiry():
    today = date.today()
    valid = ComplianceDocument(category="CSD", name="x", expires_on=today + timedelta(days=90), uploaded_on=today)
    expiring = ComplianceDocument(category="Tax", name="x", expires_on=today + timedelta(days=5), uploaded_on=today)
    expired = ComplianceDocument(category="Bank Letter", name="x", expires_on=today - timedelta(days=1), uploaded_on=today)
    assert compliance.derive_status(valid) == "valid"
    assert compliance.derive_status(expiring) == "expiring"
    assert compliance.derive_status(expired) == "expired"


def test_compliance_scoring_flags_missing_docs():
    tender = Tender(title="t", bbbee_required="Level 2")
    reqs = [
        TenderRequirement(id="r1", tender_id="t", text="CSD required", category="CSD", status="unknown"),
        TenderRequirement(id="r2", tender_id="t", text="Tax required", category="Tax", status="unknown"),
    ]
    company = Company(name="c", bbbee_level=2)
    docs = [
        ComplianceDocument(category="CSD", name="csd", expires_on=date.today() + timedelta(days=100), uploaded_on=date.today()),
    ]
    result = compliance.score_requirements(tender, reqs, company, docs)
    verdicts = {v.requirement_id: v.status for v in result.verdicts}
    assert verdicts["r1"] == "pass"   # CSD present
    assert verdicts["r2"] == "fail"   # Tax missing
    assert "Tax" in result.missing_documents
    assert 0 <= result.readiness_score <= 100


def test_matching_recommends_bid_for_strong_fit():
    company = Company(
        name="c", bbbee_level=1, province="Gauteng", years_experience=8,
        industry="Cybersecurity",
        service_categories=["Cybersecurity", "SOC operations"],
        certifications=["ISO 27001"],
    )
    tender = Tender(
        title="Cybersecurity SOC services", type="IT", province="Gauteng",
        bbbee_required="Level 2", tags=["ISO 27001"], value="R 10,000,000",
    )
    res = matching.compute_match(company, tender, compliance_readiness=90)
    assert res.match_score >= 70
    assert res.recommendation == "bid"
    assert 0 <= res.qualification_probability <= 1


def test_matching_no_bid_for_poor_fit():
    company = Company(
        name="c", bbbee_level=6, province="Limpopo", years_experience=1,
        industry="Catering", service_categories=["Catering"], certifications=[],
    )
    tender = Tender(
        title="Construction of bridge CIDB 9CE", type="Construction",
        province="Western Cape", bbbee_required="Level 1", tags=["CIDB 9CE"],
        value="R 200,000,000",
    )
    res = matching.compute_match(company, tender, compliance_readiness=20)
    assert res.recommendation in ("no-bid", "review")
    assert res.risk_score > 40


def test_bbbee_gate_fails_when_level_insufficient():
    tender = Tender(title="t", bbbee_required="Level 1")
    reqs = [TenderRequirement(id="r1", tender_id="t", text="B-BBEE Level 1", category="B-BBEE", status="unknown")]
    company = Company(name="c", bbbee_level=4)
    docs = [ComplianceDocument(category="B-BBEE", name="b", expires_on=date.today() + timedelta(days=100), uploaded_on=date.today())]
    result = compliance.score_requirements(tender, reqs, company, docs)
    assert result.verdicts[0].status == "fail"
