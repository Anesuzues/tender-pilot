"""Compliance Document Vault routes."""
from __future__ import annotations

from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select

from app.config import settings
from app.deps import CompanyId, CurrentUser, DbSession
from app.models.document import DOC_VALID, ComplianceDocument
from app.schemas.document import (
    DocumentCreate,
    DocumentOut,
    DocumentUpdate,
    VaultSummary,
)
from app.services import compliance
from app.services.events import audit
from app.services.storage import compute_hash, get_storage

router = APIRouter(prefix="/documents", tags=["documents"])

# Keyword → compliance category. Used to auto-classify uploads whose category
# is unspecified or generic, so the vault organises documents without manual tagging.
_CATEGORY_KEYWORDS = {
    "Tax": ["tax", "sars", "tcc", "pin", "clearance", "vat"],
    "B-BBEE": ["bbbee", "b-bbee", "bee", "affidavit", "transformation", "eme", "qse"],
    "CIPC": ["cipc", "cor14", "cor 14", "disclosure", "incorporation", "directors"],
    "CSD": ["csd", "central supplier", "maaa"],
    "Insurance": ["insurance", "liability", "indemnity", "coid", "policy", "cover"],
    "Bank Letter": ["bank", "fnb", "absa", "nedbank", "standard bank", "capitec", "confirmation"],
    "SBD Forms": ["sbd", "sbd4", "sbd 4", "sbd6", "sbd8", "sbd9", "declaration"],
    "Capability": ["capability", "company profile", "cv", "reference", "portfolio", "experience"],
}


def _auto_classify(filename: str | None, given: str | None) -> str:
    """Infer a compliance category from the filename when none is given."""
    if given and given not in ("", "Other", "other", "auto"):
        return given
    name = (filename or "").lower()
    for category, keywords in _CATEGORY_KEYWORDS.items():
        if any(kw in name for kw in keywords):
            return category
    return given or "Other"


def _to_out(doc: ComplianceDocument) -> DocumentOut:
    out = DocumentOut.model_validate(doc)
    out.status = compliance.derive_status(doc)  # always reflect current expiry
    return out


async def _company_docs(db: DbSession, company_id: str) -> list[ComplianceDocument]:
    return list(
        (
            await db.execute(
                select(ComplianceDocument).where(
                    ComplianceDocument.company_id == company_id
                )
            )
        ).scalars().all()
    )


@router.get("", response_model=VaultSummary)
async def list_documents(company_id: CompanyId, db: DbSession) -> VaultSummary:
    docs = await _company_docs(db, company_id)
    stats = compliance.vault_stats(docs)
    return VaultSummary(
        total=stats.total,
        valid=stats.valid,
        expiring=stats.expiring,
        expired=stats.expired,
        missing=stats.missing,
        completeness=stats.completeness,
        documents=[_to_out(d) for d in docs],
    )


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def create_document(
    payload: DocumentCreate, company_id: CompanyId, user: CurrentUser, db: DbSession
) -> DocumentOut:
    doc = ComplianceDocument(company_id=company_id, **payload.model_dump())
    doc.status = compliance.derive_status(doc)
    db.add(doc)
    await db.flush()
    await audit(db, user.id, "document.create", "document", doc.id)
    return _to_out(doc)


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    company_id: CompanyId,
    user: CurrentUser,
    db: DbSession,
    file: Annotated[UploadFile, File()],
    category: Annotated[str, Form()],
    name: Annotated[Optional[str], Form()] = None,
    expires_on: Annotated[Optional[date], Form()] = None,
    reference: Annotated[Optional[str], Form()] = None,
) -> DocumentOut:
    data = await file.read()
    _guard_size(data)
    file_hash = compute_hash(data)
    key = f"company/{company_id}/compliance/{file_hash}-{file.filename}"
    get_storage().save(key, data, file.content_type)

    # Auto-classify the document from its filename when no explicit category given.
    resolved_category = _auto_classify(file.filename, category)
    auto_classified = resolved_category != (category or "")

    doc = ComplianceDocument(
        company_id=company_id,
        category=resolved_category,
        name=name or file.filename or resolved_category,
        expires_on=expires_on,
        reference=reference,
        uploaded_on=date.today(),
        file_size=_human_size(len(data)),
        storage_key=key,
        file_hash=file_hash,
        status=DOC_VALID,
        ai_verified=auto_classified,
    )
    doc.status = compliance.derive_status(doc)
    db.add(doc)
    await db.flush()
    await audit(db, user.id, "document.upload", "document", doc.id, detail={"key": key})
    return _to_out(doc)


@router.get("/{doc_id}/file")
async def download_document_file(doc_id: str, company_id: CompanyId, db: DbSession):
    from fastapi.responses import Response
    doc = await _get_owned(db, doc_id, company_id)
    if not doc.storage_key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No file on record")
    try:
        data = get_storage().read(doc.storage_key)
    except Exception:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found in storage")
    return Response(
        content=data,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{doc.name}"'},
    )


@router.patch("/{doc_id}", response_model=DocumentOut)
async def update_document(
    doc_id: str, payload: DocumentUpdate, company_id: CompanyId, db: DbSession
) -> DocumentOut:
    doc = await _get_owned(db, doc_id, company_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(doc, field, value)
    doc.status = compliance.derive_status(doc)
    await db.flush()
    return _to_out(doc)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: str, company_id: CompanyId, user: CurrentUser, db: DbSession
) -> None:
    doc = await _get_owned(db, doc_id, company_id)
    if doc.storage_key:
        try:
            get_storage().delete(doc.storage_key)
        except Exception:
            pass
    await db.delete(doc)
    await audit(db, user.id, "document.delete", "document", doc_id)


async def _get_owned(db: DbSession, doc_id: str, company_id: str) -> ComplianceDocument:
    doc = await db.get(ComplianceDocument, doc_id)
    if not doc or doc.company_id != company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    return doc


def _guard_size(data: bytes) -> None:
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File exceeds {settings.max_upload_mb} MB limit",
        )


def _human_size(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"
