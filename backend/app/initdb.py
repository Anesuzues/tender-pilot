"""One-time database initialization for managed/serverless databases.

Serverless platforms (Vercel) may not run the ASGI lifespan that auto-creates
tables, so run this once against your production DATABASE_URL to create the
schema:

    # locally, pointing at the remote DB
    DATABASE_URL=postgresql+asyncpg://USER:PASS@HOST:5432/DB python -m app.initdb

For an ongoing managed schema, prefer Alembic migrations instead.
"""
from __future__ import annotations

import asyncio

from app.config import settings
from app.database import init_db


async def main() -> None:
    await init_db()
    print(f"Schema created on {settings.database_url.split('://')[0]} database.")


if __name__ == "__main__":
    asyncio.run(main())
