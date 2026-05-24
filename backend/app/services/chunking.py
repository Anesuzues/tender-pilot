"""Semantic-ish chunking with page citations preserved.

We split each page into paragraphs, then greedily pack paragraphs into chunks of
roughly ``chunk_target_tokens`` (estimated at ~0.75 words/token) with a small
overlap so retrieval keeps surrounding context. Each chunk keeps the page number
it started on so the RAG layer can cite "page N".
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from app.config import settings
from app.services.pdf import ExtractedDocument


@dataclass
class Chunk:
    index: int
    content: str
    page: int
    token_count: int


def estimate_tokens(text: str) -> int:
    # Cheap, dependency-free token estimate (~1.3 tokens per word).
    words = len(text.split())
    return max(1, int(words * 1.3))


_PARA_RE = re.compile(r"\n\s*\n")
_HEADING_RE = re.compile(r"^\s*(\d+(\.\d+)*\.?|[A-Z][A-Z \-]{4,})\s")


def _split_paragraphs(text: str) -> list[str]:
    parts = _PARA_RE.split(text)
    out: list[str] = []
    for p in parts:
        p = p.strip()
        if p:
            out.append(p)
    return out


def chunk_document(doc: ExtractedDocument) -> list[Chunk]:
    target = settings.chunk_target_tokens
    overlap = settings.chunk_overlap_tokens

    chunks: list[Chunk] = []
    buffer: list[str] = []
    buffer_tokens = 0
    buffer_page = 1
    idx = 0

    def flush(next_page: int) -> None:
        nonlocal buffer, buffer_tokens, idx
        if not buffer:
            return
        content = "\n\n".join(buffer).strip()
        if content:
            chunks.append(
                Chunk(
                    index=idx,
                    content=content,
                    page=buffer_page,
                    token_count=estimate_tokens(content),
                )
            )
            idx += 1
        # Carry overlap tail into the next buffer.
        if overlap > 0 and content:
            tail_words = content.split()[-int(overlap / 1.3):]
            buffer = [" ".join(tail_words)] if tail_words else []
            buffer_tokens = estimate_tokens(buffer[0]) if buffer else 0
        else:
            buffer = []
            buffer_tokens = 0

    for page in doc.pages:
        for para in _split_paragraphs(page.text):
            ptokens = estimate_tokens(para)
            # A single huge paragraph: hard-split on sentences.
            if ptokens > target * 1.5:
                sentences = re.split(r"(?<=[.!?])\s+", para)
                for sent in sentences:
                    stok = estimate_tokens(sent)
                    if buffer_tokens + stok > target and buffer:
                        flush(page.page_number)
                        buffer_page = page.page_number
                    if not buffer:
                        buffer_page = page.page_number
                    buffer.append(sent)
                    buffer_tokens += stok
                continue

            if buffer_tokens + ptokens > target and buffer:
                flush(page.page_number)
                buffer_page = page.page_number
            if not buffer:
                buffer_page = page.page_number
            buffer.append(para)
            buffer_tokens += ptokens

    flush(doc.page_count or 1)
    # Drop a possible trailing overlap-only chunk duplicate.
    return chunks
