"""Seed the database with a demo company, user, tenders and vault documents.

Mirrors the frontend prototype's mock data so the API returns realistic content
out of the box. Run with:  python -m app.seed
Login afterwards with demo@tenderpilot.ai / TenderPilot123!
"""
from __future__ import annotations

import asyncio
from datetime import date, datetime, timedelta

from sqlalchemy import select

from app.database import SessionLocal, init_db
from app.models.company import Company
from app.models.document import ComplianceDocument
from app.models.tender import Tender
from app.models.user import ROLE_OWNER, User
from app.security import hash_password

DEMO_EMAIL = "demo@tenderpilot.ai"
DEMO_PASSWORD = "TenderPilot123!"


def _d(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


TENDERS = [
    dict(reference="RFB 2025/IT/0142", title="Supply, Delivery & Maintenance of Cybersecurity Infrastructure",
         issuer="South African Revenue Service (SARS)", type="Government · IT", value="R 24,500,000",
         deadline="2026-06-12", bbbee_required="Level 2 or higher", score=86, risk="low",
         workflow_status="in-review", province="Gauteng", document_count=14, page_count=187,
         published_date="2026-05-02", tags=["NIST 800-53", "5-year contract", "On-site support"]),
    dict(reference="MUN/JHB/SEC/2026/008", title="Provision of Physical Security Services at Municipal Depots",
         issuer="City of Johannesburg Metropolitan", type="Municipal · Security", value="R 8,200,000",
         deadline="2026-06-04", bbbee_required="Level 1", score=72, risk="medium",
         workflow_status="draft", province="Gauteng", document_count=9, page_count=96,
         published_date="2026-04-28", tags=["PSIRA registered", "24/7 coverage", "Armed response"]),
    dict(reference="DPWI/CON/0421/26", title="Construction of Mthatha District Office — Phase 2",
         issuer="Dept. of Public Works & Infrastructure", type="Government · Construction", value="R 142,000,000",
         deadline="2026-07-18", bbbee_required="Level 1", score=41, risk="high",
         workflow_status="flagged", province="Eastern Cape", cidb="8GB PE", document_count=22, page_count=312,
         published_date="2026-05-08", tags=["JBCC 2018", "CIDB 8GB", "BEP required"]),
    dict(reference="ESKOM/RFQ/2026/0337", title="Maintenance of SCADA Systems — Northern Region",
         issuer="Eskom Holdings SOC", type="SOE · Engineering", value="R 11,800,000",
         deadline="2026-05-29", bbbee_required="Level 4 or higher", score=78, risk="low",
         workflow_status="in-review", province="Limpopo", document_count=11, page_count=124,
         published_date="2026-04-30", tags=["ICS/SCADA", "Mandatory site visit", "OEM cert"]),
    dict(reference="WC/DOH/0218/26", title="Cleaning & Hygiene Services — Tygerberg Hospital",
         issuer="Western Cape Dept. of Health", type="Provincial · Services", value="R 6,400,000",
         deadline="2026-06-21", bbbee_required="Level 2", score=91, risk="low",
         workflow_status="shortlisted", province="Western Cape", document_count=8, page_count=71,
         published_date="2026-05-12", tags=["3-year contract", "OHSA compliant"]),
    dict(reference="TRANSNET/IT/2026/099", title="Cloud Migration & SAP HANA Modernisation",
         issuer="Transnet SOC Ltd", type="SOE · IT", value="R 58,000,000",
         deadline="2026-08-02", bbbee_required="Level 2", score=63, risk="medium",
         workflow_status="draft", province="KwaZulu-Natal", document_count=18, page_count=246,
         published_date="2026-05-18", tags=["Azure", "ISO 27001", "Skills transfer"]),
]

DOCS = [
    dict(category="CSD", name="CSD Registration Report", status="valid", expires_on="2026-11-04", uploaded_on="2026-02-11", file_size="412 KB", ai_verified=True, reference="MAAA0451729"),
    dict(category="Tax", name="Tax Compliance Status (TCS) PIN", status="valid", expires_on="2026-08-22", uploaded_on="2026-02-22", file_size="118 KB", ai_verified=True, reference="TCS9817-3204-1126"),
    dict(category="B-BBEE", name="B-BBEE Affidavit (EME) — Level 2", status="expiring", expires_on="2026-06-08", uploaded_on="2025-06-08", file_size="284 KB", ai_verified=True, reference="EME · Sworn"),
    dict(category="CIPC", name="CIPC Company Disclosure (CoR 14.3)", status="valid", expires_on=None, uploaded_on="2026-01-19", file_size="640 KB", ai_verified=True, reference="2019/487112/07"),
    dict(category="Insurance", name="Public Liability Insurance — R10m", status="valid", expires_on="2027-03-31", uploaded_on="2026-04-01", file_size="1.2 MB", ai_verified=True, reference="Hollard · POL/2026/887"),
    dict(category="Bank Letter", name="Bank Confirmation — FNB Business", status="expired", expires_on="2026-04-30", uploaded_on="2025-10-30", file_size="92 KB", ai_verified=False, reference="62849173210"),
    dict(category="SBD Forms", name="SBD 4 — Declaration of Interest", status="missing", expires_on=None, uploaded_on=None, file_size=None, ai_verified=False, reference=None),
    dict(category="SBD Forms", name="SBD 6.1 — Preference Points Claim", status="valid", expires_on=None, uploaded_on="2026-03-04", file_size="76 KB", ai_verified=True, reference=None),
    dict(category="Capability", name="Capability Statement — Cybersecurity", status="valid", expires_on=None, uploaded_on="2026-04-22", file_size="3.4 MB", ai_verified=True, reference="v4.2"),
    dict(category="Tax", name="UIF Compliance Letter", status="valid", expires_on="2026-09-15", uploaded_on="2026-03-15", file_size="104 KB", ai_verified=True, reference="U090332771"),
    dict(category="Insurance", name="Letter of Good Standing — COID", status="expiring", expires_on="2026-06-18", uploaded_on="2025-06-18", file_size="186 KB", ai_verified=True, reference="COID-2025/41773"),
]


async def seed() -> None:
    await init_db()
    async with SessionLocal() as db:
        existing = (
            await db.execute(select(User).where(User.email == DEMO_EMAIL))
        ).scalar_one_or_none()
        if existing:
            print(f"Demo user already exists ({DEMO_EMAIL}). Skipping seed.")
            return

        company = Company(
            name="Sentinel Cyber Solutions (Pty) Ltd",
            registration_number="2019/487112/07",
            csd_number="MAAA0451729",
            industry="Cybersecurity & ICT",
            province="Gauteng",
            bbbee_level=2,
            years_experience=6,
            employee_count=42,
            annual_turnover="R 38,000,000",
            service_categories=["Cybersecurity", "SOC operations", "ICT infrastructure", "SCADA/ICS"],
            certifications=["ISO 27001", "PSIRA", "NIST 800-53"],
            capability_statement="Boutique South African cybersecurity firm specialising in SOC operations, "
            "incident response and critical-infrastructure protection for the public sector.",
            contact_email="bids@sentinelcyber.co.za",
            contact_phone="+27 11 555 0142",
        )
        db.add(company)
        await db.flush()

        user = User(
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name="Lerato Mokoena",
            role=ROLE_OWNER,
            company_id=company.id,
        )
        db.add(user)

        for t in TENDERS:
            data = dict(t)
            data["deadline"] = _d(data["deadline"]) if data.get("deadline") else None
            data["published_date"] = _d(data["published_date"]) if data.get("published_date") else None
            db.add(Tender(company_id=company.id, processing_status="ready", **data))

        for d in DOCS:
            data = dict(d)
            data["expires_on"] = _d(data["expires_on"]) if data.get("expires_on") else None
            data["uploaded_on"] = _d(data["uploaded_on"]) if data.get("uploaded_on") else None
            db.add(ComplianceDocument(company_id=company.id, **data))

        await db.commit()
        print("Seed complete.")
        print(f"  Login: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        print(f"  Company: {company.name} ({len(TENDERS)} tenders, {len(DOCS)} documents)")


if __name__ == "__main__":
    asyncio.run(seed())
