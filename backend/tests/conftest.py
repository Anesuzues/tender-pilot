"""Pytest fixtures: isolated SQLite DB, ASGI client, auth helpers.

Environment variables are set BEFORE importing any ``app`` module so the cached
Settings instance points at a throwaway database and local storage.
"""
from __future__ import annotations

import os
import tempfile

# --- Configure a throwaway environment up front -----------------------------
_TMP = tempfile.mkdtemp(prefix="tenderpilot-tests-")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ["DEBUG"] = "false"  # keep aiosqlite/SQL DEBUG logs out of test output
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TMP}/test.db"
os.environ["STORAGE_DIR"] = f"{_TMP}/storage"
os.environ["STORAGE_BACKEND"] = "local"
os.environ["LLM_PROVIDER"] = "stub"
os.environ["EMBEDDING_PROVIDER"] = "local"
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production-0000"
os.environ["CELERY_EAGER"] = "true"

import logging  # noqa: E402

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

for _noisy in ("httpx", "aiosqlite", "sqlalchemy.engine"):
    logging.getLogger(_noisy).setLevel(logging.WARNING)

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402

API = "/api/v1"


@pytest_asyncio.fixture(autouse=True)
async def _fresh_schema():
    """Recreate all tables before each test for isolation."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


async def register(client: AsyncClient, email="user@example.com", company="Acme Pty Ltd"):
    resp = await client.post(
        f"{API}/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": "Test User",
            "company_name": company,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def authed(client):
    """A registered user with company; returns (client, headers, payload)."""
    data = await register(client)
    headers = auth_headers(data["tokens"]["access_token"])
    return client, headers, data
