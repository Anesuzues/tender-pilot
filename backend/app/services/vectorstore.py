"""Vector similarity search over stored tender chunks.

Portable implementation: chunk embeddings are stored as JSON arrays and scored
with cosine similarity in Python. For production on PostgreSQL, store embeddings
in a pgvector ``Vector`` column and replace ``search`` with an ``ORDER BY
embedding <=> :query`` SQL query — the surrounding API stays identical.

A lightweight keyword (BM25-ish) score is blended in for hybrid retrieval.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tender import TenderChunk

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    # Vectors are pre-normalized; dot product == cosine.
    return sum(x * y for x, y in zip(a, b))


def _keyword_overlap(query: str, content: str) -> float:
    q = set(_TOKEN_RE.findall(query.lower()))
    if not q:
        return 0.0
    c = _TOKEN_RE.findall(content.lower())
    if not c:
        return 0.0
    cset = set(c)
    hits = len(q & cset)
    return hits / len(q)


@dataclass
class RetrievedChunk:
    chunk_id: str
    content: str
    page: int | None
    section: str | None
    score: float


async def search(
    db: AsyncSession,
    tender_id: str,
    query: str,
    query_embedding: list[float],
    top_k: int,
    alpha: float = 0.75,
) -> list[RetrievedChunk]:
    """Hybrid retrieval: alpha*cosine + (1-alpha)*keyword overlap."""
    rows = (
        await db.execute(
            select(TenderChunk).where(TenderChunk.tender_id == tender_id)
        )
    ).scalars().all()

    scored: list[RetrievedChunk] = []
    for chunk in rows:
        vec = chunk.embedding or []
        sem = cosine(query_embedding, vec)
        kw = _keyword_overlap(query, chunk.content)
        score = alpha * sem + (1 - alpha) * kw
        section = (chunk.meta or {}).get("section")
        scored.append(
            RetrievedChunk(
                chunk_id=chunk.id,
                content=chunk.content,
                page=chunk.page,
                section=section,
                score=score,
            )
        )

    scored.sort(key=lambda c: c.score, reverse=True)
    # Drop zero-signal results when we have better ones.
    top = [c for c in scored[:top_k] if c.score > 0]
    return top or scored[:top_k]
