"""PDF text extraction and cleaning.

Uses pypdf (pure Python) by default. If PyMuPDF (``fitz``) or pdfplumber are
installed they are preferred for higher-fidelity extraction. Scanned/image PDFs
that yield little text are flagged so an OCR step (Tesseract / Document AI) can
be wired in — see ``needs_ocr``.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class ExtractedPage:
    page_number: int  # 1-based
    text: str


@dataclass
class ExtractedDocument:
    pages: list[ExtractedPage] = field(default_factory=list)
    page_count: int = 0

    @property
    def full_text(self) -> str:
        return "\n\n".join(p.text for p in self.pages)

    @property
    def total_chars(self) -> int:
        return sum(len(p.text) for p in self.pages)


_WS_RE = re.compile(r"[ \t]+")
_MULTINEWLINE_RE = re.compile(r"\n{3,}")
_PAGENUM_RE = re.compile(r"^\s*(page\s*)?\d+\s*(of\s*\d+)?\s*$", re.IGNORECASE)


def clean_text(text: str) -> str:
    """Normalize whitespace, drop obvious page-number lines, dehyphenate."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("­", "")  # soft hyphen
    # De-hyphenate words broken across line breaks.
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    lines = []
    for line in text.split("\n"):
        line = _WS_RE.sub(" ", line).rstrip()
        if _PAGENUM_RE.match(line):
            continue
        lines.append(line)
    out = "\n".join(lines)
    out = _MULTINEWLINE_RE.sub("\n\n", out)
    return out.strip()


def extract_pdf(data: bytes) -> ExtractedDocument:
    """Extract per-page text from PDF bytes, trying the best available library."""
    # 1) PyMuPDF (fitz) — fastest, best layout.
    try:  # pragma: no cover - optional dependency
        import fitz  # type: ignore

        doc = fitz.open(stream=data, filetype="pdf")
        pages = [
            ExtractedPage(i + 1, clean_text(page.get_text("text")))
            for i, page in enumerate(doc)
        ]
        return ExtractedDocument(pages=pages, page_count=len(pages))
    except Exception:
        pass

    # 2) pdfplumber — good for tables/columns.
    try:  # pragma: no cover - optional dependency
        import io

        import pdfplumber  # type: ignore

        pages = []
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for i, page in enumerate(pdf.pages):
                pages.append(ExtractedPage(i + 1, clean_text(page.extract_text() or "")))
        return ExtractedDocument(pages=pages, page_count=len(pages))
    except Exception:
        pass

    # 3) pypdf — always available (pure python).
    import io

    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(data))
    pages = []
    for i, page in enumerate(reader.pages):
        try:
            raw = page.extract_text() or ""
        except Exception:
            raw = ""
        pages.append(ExtractedPage(i + 1, clean_text(raw)))
    return ExtractedDocument(pages=pages, page_count=len(pages))


def needs_ocr(doc: ExtractedDocument, min_chars_per_page: int = 60) -> bool:
    """Heuristic: a (likely scanned) PDF with almost no extractable text."""
    if doc.page_count == 0:
        return False
    avg = doc.total_chars / max(doc.page_count, 1)
    return avg < min_chars_per_page
