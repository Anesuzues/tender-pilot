"""RAG chatbot routes."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.deps import CompanyId, CurrentUser, DbSession
from app.models.chat import ChatMessage, ChatSession
from app.models.tender import Tender
from app.schemas.chat import (
    AskRequest,
    AskResponse,
    ChatMessageOut,
    ChatSessionDetail,
    ChatSessionOut,
    Citation,
    CreateSessionRequest,
)
from app.services import rag
from app.services.events import track
from app.services.llm import LLMMessage

router = APIRouter(prefix="/chat", tags=["chat"])


async def _owned_tender(db: DbSession, tender_id: str, company_id: str) -> Tender:
    tender = await db.get(Tender, tender_id)
    if not tender or tender.company_id != company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tender not found")
    return tender


@router.get("/sessions", response_model=list[ChatSessionOut])
async def list_sessions(user: CurrentUser, db: DbSession) -> list[ChatSessionOut]:
    rows = (
        await db.execute(
            select(ChatSession)
            .where(ChatSession.user_id == user.id)
            .order_by(ChatSession.updated_at.desc())
        )
    ).scalars().all()
    return [ChatSessionOut.model_validate(s) for s in rows]


@router.post("/sessions", response_model=ChatSessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: CreateSessionRequest, company_id: CompanyId, user: CurrentUser, db: DbSession
) -> ChatSessionOut:
    if payload.tender_id:
        await _owned_tender(db, payload.tender_id, company_id)
    session = ChatSession(
        user_id=user.id,
        tender_id=payload.tender_id,
        title=payload.title or "New conversation",
    )
    db.add(session)
    await db.flush()
    return ChatSessionOut.model_validate(session)


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
async def get_session(session_id: str, user: CurrentUser, db: DbSession) -> ChatSessionDetail:
    session = await _owned_session(db, session_id, user.id)
    return ChatSessionDetail.model_validate(session)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str, user: CurrentUser, db: DbSession) -> None:
    session = await _owned_session(db, session_id, user.id)
    await db.delete(session)


@router.post("/ask", response_model=AskResponse)
async def ask(
    payload: AskRequest, company_id: CompanyId, user: CurrentUser, db: DbSession
) -> AskResponse:
    """Ask a grounded question about a tender. Creates a session if none given."""
    tender_id = payload.tender_id
    if not tender_id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "tender_id is required")
    await _owned_tender(db, tender_id, company_id)

    session = ChatSession(
        user_id=user.id, tender_id=tender_id, title=payload.question[:60]
    )
    db.add(session)
    await db.flush()
    # Brand-new session → no prior history.
    return await _answer(db, session, payload.question, user.id, company_id, history=[])


@router.post("/sessions/{session_id}/ask", response_model=AskResponse)
async def ask_in_session(
    session_id: str,
    payload: AskRequest,
    company_id: CompanyId,
    user: CurrentUser,
    db: DbSession,
) -> AskResponse:
    session = await _owned_session(db, session_id, user.id)
    tender_id = session.tender_id or payload.tender_id
    if not tender_id:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Session has no tender; provide tender_id",
        )
    await _owned_tender(db, tender_id, company_id)
    if not session.tender_id:
        session.tender_id = tender_id
    # session was loaded via db.get → messages are selectin-loaded and safe.
    history = [
        LLMMessage(role=m.role, content=m.content)
        for m in session.messages
        if m.role in ("user", "assistant")
    ][-6:]
    return await _answer(db, session, payload.question, user.id, company_id, history)


async def _answer(
    db: DbSession,
    session: ChatSession,
    question: str,
    user_id: str,
    company_id: str,
    history: list[LLMMessage],
) -> AskResponse:
    user_msg = ChatMessage(session_id=session.id, role="user", content=question)
    db.add(user_msg)

    result = await rag.answer_question(db, session.tender_id, question, history)

    citations = [
        Citation(chunk_id=c.chunk_id, page=c.page, section=c.section, snippet=c.snippet)
        for c in result.citations
    ]
    assistant_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=result.answer,
        citations=[c.model_dump() for c in citations],
    )
    db.add(assistant_msg)
    await db.flush()
    await track(db, "chat_message", user_id, company_id, {"tender_id": session.tender_id})

    return AskResponse(
        session_id=session.id,
        answer=result.answer,
        citations=citations,
        message=ChatMessageOut.model_validate(assistant_msg),
    )


async def _owned_session(db: DbSession, session_id: str, user_id: str) -> ChatSession:
    session = await db.get(ChatSession, session_id)
    if not session or session.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return session
