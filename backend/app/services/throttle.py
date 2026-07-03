"""Database-backed rate limiting for sensitive auth endpoints.

In-memory limiters (slowapi) reset on every serverless cold start, so a
brute-forcer hitting fresh lambdas is never throttled. Counting recent rows
in a shared table enforces the limit across all invocations.
"""
from __future__ import annotations

from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import utcnow
from app.models.system import AuthThrottle


async def enforce(
    db: AsyncSession,
    key: str,
    limit: int,
    window_seconds: int,
) -> None:
    """Record this attempt and raise 429 if `key` exceeded `limit` attempts
    within the window. Old rows for the key are pruned opportunistically."""
    cutoff = utcnow() - timedelta(seconds=window_seconds)

    # Prune expired rows for this key (keeps the table small without a cron).
    await db.execute(
        delete(AuthThrottle).where(AuthThrottle.key == key, AuthThrottle.created_at < cutoff)
    )

    recent = (
        await db.execute(
            select(func.count())
            .select_from(AuthThrottle)
            .where(AuthThrottle.key == key, AuthThrottle.created_at >= cutoff)
        )
    ).scalar_one()

    if recent >= limit:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many attempts. Please wait a few minutes and try again.",
        )

    db.add(AuthThrottle(key=key))
    # Commit immediately in its own transaction: if the endpoint later raises
    # (e.g. 401 wrong password), the session rollback must NOT erase the
    # recorded attempt, or failed logins would never count toward the limit.
    await db.commit()
