"""RAG chatbot session + message models."""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    pass


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    tender_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("tenders.id", ondelete="CASCADE"), index=True, default=None
    )
    title: Mapped[str] = mapped_column(String(255), default="New conversation")

    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ChatMessage.created_at",
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    session_id: Mapped[str] = mapped_column(
        ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(String(16))  # user | assistant | system
    content: Mapped[str] = mapped_column(Text)
    # Citations: list of {chunk_id, page, section, snippet}.
    citations: Mapped[list] = mapped_column(JSON, default=list)

    session: Mapped["ChatSession"] = relationship(back_populates="messages")
