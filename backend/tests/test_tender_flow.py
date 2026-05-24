"""End-to-end tender flow: upload → ingest → analyze → chat → proposal → export."""
from __future__ import annotations

import pytest

from tests.conftest import API
from tests.pdfutil import make_pdf

TENDER_TEXT = (
    "RFB 2025/IT/0142 — Supply and Maintenance of Cybersecurity Infrastructure\n"
    "Issued by the South African Revenue Service (SARS).\n\n"
    "Section 3.1 Bidders must be registered on the Central Supplier Database (CSD).\n"
    "Section 3.2 A valid Tax Compliance Status (TCS) PIN issued within the last 12 months is required.\n"
    "Section 3.3 Bidders must hold a B-BBEE certificate of Level 2 or higher.\n"
    "Section 3.4 A minimum of 5 years experience in security operations centre operations is required.\n"
    "Section 3.5 ISO 27001 certification must be valid and submitted with the bid.\n"
    "Section 4.1 The closing date for submission of bids is 12 June 2026 at 11h00.\n"
    "Section 5.1 Bids will be evaluated using the 80/20 preference points system.\n"
) * 2


async def _company_setup(client, headers):
    await client.patch(
        f"{API}/companies/me",
        headers=headers,
        json={
            "bbbee_level": 2,
            "province": "Gauteng",
            "years_experience": 6,
            "industry": "Cybersecurity",
            "service_categories": ["Cybersecurity", "SOC operations"],
            "certifications": ["ISO 27001"],
        },
    )
    # Give the vault a couple of valid baseline docs.
    for cat, name in [("CSD", "CSD report"), ("Tax", "TCS PIN"), ("B-BBEE", "Affidavit"), ("CIPC", "CoR 14.3")]:
        await client.post(f"{API}/documents", headers=headers, json={"category": cat, "name": name})


async def _upload_tender(client, headers) -> str:
    pdf = make_pdf(TENDER_TEXT)
    files = {"file": ("sars-tender.pdf", pdf, "application/pdf")}
    data = {"title": "SARS Cybersecurity Infrastructure", "reference": "RFB 2025/IT/0142", "issuer": "SARS"}
    r = await client.post(f"{API}/tenders/upload", headers=headers, files=files, data=data)
    assert r.status_code == 201, r.text
    return r.json()["id"]


async def test_full_flow(authed):
    client, headers, _ = authed
    await _company_setup(client, headers)
    tender_id = await _upload_tender(client, headers)

    # Ingestion runs as a background task and completes within the ASGI cycle.
    detail = await client.get(f"{API}/tenders/{tender_id}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["processing_status"] == "ready", detail.json()

    # --- Analysis ---
    analysis = await client.post(f"{API}/tenders/{tender_id}/analysis", headers=headers)
    assert analysis.status_code == 200, analysis.text
    body = analysis.json()
    assert body["summary"]
    assert len(body["requirements"]) > 0
    # CSD / B-BBEE requirements should have been detected.
    texts = " ".join(r["text"].lower() for r in body["requirements"])
    assert "csd" in texts or "central supplier database" in texts
    assert body["score"] is not None
    assert body["match"]["recommendation"] in ("bid", "review", "no-bid")
    assert body["eval_criteria"], "expected PPPFA eval criteria"

    # --- RAG chat ---
    ask = await client.post(
        f"{API}/chat/ask",
        headers=headers,
        json={"tender_id": tender_id, "question": "What B-BBEE level is required?"},
    )
    assert ask.status_code == 200, ask.text
    ans = ask.json()
    assert ans["answer"]
    assert len(ans["citations"]) >= 1
    assert any(c.get("page") for c in ans["citations"])

    # Continue the conversation in the same session.
    follow = await client.post(
        f"{API}/chat/sessions/{ans['session_id']}/ask",
        headers=headers,
        json={"question": "When is the closing date?"},
    )
    assert follow.status_code == 200
    assert "2026" in follow.json()["answer"] or "june" in follow.json()["answer"].lower()

    # --- Proposal builder ---
    prop = await client.post(f"{API}/proposals", headers=headers, json={"tender_id": tender_id})
    assert prop.status_code == 201, prop.text
    draft_id = prop.json()["id"]
    assert len(prop.json()["sections"]) == 8

    gen = await client.post(
        f"{API}/proposals/{draft_id}/sections/generate",
        headers=headers,
        json={"kind": "compliance_matrix"},
    )
    assert gen.status_code == 200, gen.text
    assert gen.json()["content"]

    gen2 = await client.post(
        f"{API}/proposals/{draft_id}/sections/generate",
        headers=headers,
        json={"kind": "executive_summary"},
    )
    assert gen2.status_code == 200
    assert gen2.json()["word_count"] > 0

    # --- Export ---
    exp = await client.post(
        f"{API}/proposals/{draft_id}/export", headers=headers, json={"format": "markdown"}
    )
    assert exp.status_code == 200
    assert exp.headers["content-type"].startswith("text/markdown")
    assert "# Proposal" in exp.text or "Proposal" in exp.text


async def test_analysis_requires_ready(authed):
    client, headers, _ = authed
    # Create a metadata-only tender (no document → never becomes ready).
    r = await client.post(f"{API}/tenders", headers=headers, json={"title": "Empty tender"})
    tid = r.json()["id"]
    resp = await client.post(f"{API}/tenders/{tid}/analysis", headers=headers)
    assert resp.status_code == 409


async def test_tender_list_and_filter(authed):
    client, headers, _ = authed
    for i in range(3):
        await client.post(
            f"{API}/tenders",
            headers=headers,
            json={"title": f"Tender {i}", "province": "Gauteng" if i else "Limpopo"},
        )
    allt = await client.get(f"{API}/tenders", headers=headers)
    assert allt.json()["total"] == 3
    filtered = await client.get(f"{API}/tenders?province=Gauteng", headers=headers)
    assert filtered.json()["total"] == 2


async def test_tenant_isolation(client):
    """A user cannot read another company's tender."""
    from tests.conftest import auth_headers, register

    a = await register(client, email="tenant-a@example.com", company="Company A")
    b = await register(client, email="tenant-b@example.com", company="Company B")
    ha = auth_headers(a["tokens"]["access_token"])
    hb = auth_headers(b["tokens"]["access_token"])

    r = await client.post(f"{API}/tenders", headers=ha, json={"title": "A secret tender"})
    tid = r.json()["id"]

    leaked = await client.get(f"{API}/tenders/{tid}", headers=hb)
    assert leaked.status_code == 404
