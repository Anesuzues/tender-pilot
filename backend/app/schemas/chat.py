"""RAG chat schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, TimestampedModel


class Citation(BaseModel):
    chunk_id: Optional[str] = None
    page: Optional[int] = None
    section: Optional[str] = None
    snippet: str


class ChatMessageOut(TimestampedModel):
    session_id: str
    role: str
    content: str
    citations: list[Citation] = Field(default_factory=list)


class ChatSessionOut(TimestampedModel):
    title: str
    tender_id: Optional[str] = None
    user_id: str


class ChatSessionDetail(ChatSessionOut):
    messages: list[ChatMessageOut] = Field(default_factory=list)


class CreateSessionRequest(BaseModel):
    tender_id: Optional[str] = None
    title: Optional[str] = None


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    tender_id: Optional[str] = None  # required if session has no tender bound


class AskResponse(BaseModel):
    session_id: str
    answer: str
    citations: list[Citation] = Field(default_factory=list)
    message: ChatMessageOut
