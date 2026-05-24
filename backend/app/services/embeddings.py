"""Embedding generation.

Two providers:
- ``local`` (default): a dependency-free hashing embedder. Deterministic and
  offline — good enough for keyword-overlap retrieval, tests, and demos.
- ``openai``: calls the OpenAI embeddings API via httpx when OPENAI_API_KEY is
  set. Swap ``EMBEDDING_PROVIDER=openai`` for production-grade semantic search.

All vectors are L2-normalized so cosine similarity reduces to a dot product.
"""
from __future__ import annotations

import hashlib
import math
import re

from app.config import settings

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def _normalize(vec: list[float]) -> list[float]:
    norm = math.sqrt(sum(v * v for v in vec))
    if norm == 0:
        return vec
    return [v / norm for v in vec]


def local_embed(text: str, dim: int | None = None) -> list[float]:
    """Hashing embedder with sublinear term weighting (TF-style)."""
    dim = dim or settings.embedding_dim
    vec = [0.0] * dim
    counts: dict[str, int] = {}
    for tok in _tokenize(text):
        counts[tok] = counts.get(tok, 0) + 1
    for tok, count in counts.items():
        h = hashlib.md5(tok.encode("utf-8")).digest()
        bucket = int.from_bytes(h[:4], "big") % dim
        sign = 1.0 if h[4] & 1 else -1.0
        weight = 1.0 + math.log(count)
        vec[bucket] += sign * weight
    return _normalize(vec)


async def openai_embed(texts: list[str]) -> list[list[float]]:  # pragma: no cover
    import httpx

    resp = await _aclient_post(
        "https://api.openai.com/v1/embeddings",
        json={"model": settings.embedding_model, "input": texts},
        headers={"Authorization": f"Bearer {settings.openai_api_key}"},
    )
    data = resp["data"]
    return [_normalize(item["embedding"]) for item in data]


async def _aclient_post(url: str, json: dict, headers: dict) -> dict:  # pragma: no cover
    import httpx

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(url, json=json, headers=headers)
        r.raise_for_status()
        return r.json()


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if settings.embedding_provider == "openai" and settings.openai_api_key:
        try:  # pragma: no cover - network path
            return await openai_embed(texts)
        except Exception:
            # Fall back to local rather than failing ingestion.
            pass
    return [local_embed(t) for t in texts]


async def embed_query(text: str) -> list[float]:
    return (await embed_texts([text]))[0]
