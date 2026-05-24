"""Async SQLAlchemy engine, session factory, and declarative base."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

from sqlalchemy import DateTime, String, func
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.config import settings

# SQLite needs check_same_thread disabled for the async driver in some paths;
# asyncpg/Postgres ignores that arg.
_connect_args: dict = {}
if settings.database_url.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

_engine_kwargs: dict = {"echo": False, "future": True, "pool_pre_ping": True}
if settings.db_use_null_pool:
    # Serverless: don't keep a pool across frozen invocations. With a pgbouncer
    # (transaction-mode) pooler, asyncpg must disable its prepared-statement
    # cache or it errors on reused statement names.
    from sqlalchemy.pool import NullPool

    _engine_kwargs["poolclass"] = NullPool
    if "asyncpg" in settings.database_url:
        _connect_args["statement_cache_size"] = 0

engine = create_async_engine(
    settings.database_url, connect_args=_connect_args, **_engine_kwargs
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_uuid() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    """Declarative base with UUID PK + created/updated timestamps."""

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=new_uuid
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding a transactional session."""
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Create all tables (dev/test convenience — use Alembic in production)."""
    # Import models so they register on Base.metadata before create_all.
    from app import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
