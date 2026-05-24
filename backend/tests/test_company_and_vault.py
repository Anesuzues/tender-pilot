"""Company profile + compliance vault tests."""
from __future__ import annotations

from datetime import date, timedelta

from tests.conftest import API


async def test_company_created_on_register(authed):
    client, headers, _ = authed
    resp = await client.get(f"{API}/companies/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Acme Pty Ltd"


async def test_update_company_profile(authed):
    client, headers, _ = authed
    resp = await client.patch(
        f"{API}/companies/me",
        headers=headers,
        json={"bbbee_level": 2, "province": "Gauteng", "certifications": ["ISO 27001"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["bbbee_level"] == 2
    assert body["certifications"] == ["ISO 27001"]


async def test_vault_status_derivation(authed):
    client, headers, _ = authed
    today = date.today()

    # Valid (far future), expiring (within 30d), expired (past), no-expiry valid.
    docs = [
        {"category": "CSD", "name": "CSD report", "expires_on": str(today + timedelta(days=200))},
        {"category": "Tax", "name": "TCS PIN", "expires_on": str(today + timedelta(days=10))},
        {"category": "Bank Letter", "name": "Bank letter", "expires_on": str(today - timedelta(days=5))},
        {"category": "CIPC", "name": "CoR 14.3", "expires_on": None},
    ]
    for d in docs:
        r = await client.post(f"{API}/documents", headers=headers, json=d)
        assert r.status_code == 201, r.text

    summary = await client.get(f"{API}/documents", headers=headers)
    assert summary.status_code == 200
    body = summary.json()
    assert body["total"] == 4
    assert body["expiring"] == 1
    assert body["expired"] == 1
    # CSD + CIPC are valid (no/distant expiry)
    assert body["valid"] == 2
    assert 0 <= body["completeness"] <= 100


async def test_document_upload_and_delete(authed):
    client, headers, _ = authed
    files = {"file": ("bbbee.pdf", b"%PDF-1.4 fake", "application/pdf")}
    data = {"category": "B-BBEE", "name": "B-BBEE Affidavit"}
    r = await client.post(f"{API}/documents/upload", headers=headers, files=files, data=data)
    assert r.status_code == 201, r.text
    doc_id = r.json()["id"]
    assert r.json()["file_size"]

    d = await client.delete(f"{API}/documents/{doc_id}", headers=headers)
    assert d.status_code == 204


async def test_vault_requires_company(client):
    # Register without a company name → no company → vault should 409.
    resp = await client.post(
        f"{API}/auth/register",
        json={"email": "nocompany@example.com", "password": "Password123!"},
    )
    token = resp.json()["tokens"]["access_token"]
    r = await client.get(f"{API}/documents", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 409
