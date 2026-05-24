"""RAG orchestration: retrieve grounded context, answer with citations."""
from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.services import vectorstore
from app.services.embeddings import embed_query
from app.services.llm import SYSTEM_PROMPT, LLMMessage, complete


@dataclass
class Citation:
    chunk_id: str | None
    page: int | None
    section: str | None
    snippet: str


@dataclass
class RagAnswer:
    answer: str
    citations: list[Citation]


def _build_context(chunks: list[vectorstore.RetrievedChunk]) -> str:
    blocks = []
    for c in chunks:
        loc = f"[page {c.page}]" if c.page else ""
        blocks.append(f"{loc} {c.content}".strip())
    return "\n\n".join(blocks)


async def answer_question(
    db: AsyncSession,
    tender_id: str,
    question: str,
    history: list[LLMMessage] | None = None,
) -> RagAnswer:
    query_vec = await embed_query(question)
    retrieved = await vectorstore.search(
        db, tender_id, question, query_vec, top_k=settings.rag_top_k
    )

    if not retrieved:
        return RagAnswer(
            answer=(
                "This tender has no indexed content yet. Please wait for "
                "processing to finish, then ask again."
            ),
            citations=[],
        )

    context = _build_context(retrieved)
    prompt = (
        "Answer the user's question using ONLY the tender context below. Cite the "
        "page number for each fact. If the answer is not in the context, say so.\n\n"
        f"CONTEXT:\n{context}\n\nQUESTION: {question}"
    )
    messages = (history or []) + [LLMMessage(role="user", content=prompt)]
    answer = await complete(SYSTEM_PROMPT, messages)

    citations = [
        Citation(
            chunk_id=c.chunk_id,
            page=c.page,
            section=c.section,
            snippet=(c.content[:240] + "…") if len(c.content) > 240 else c.content,
        )
        for c in retrieved[:4]
    ]
    return RagAnswer(answer=answer, citations=citations)
