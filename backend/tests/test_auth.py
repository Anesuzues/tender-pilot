"""Auth & account tests."""
from __future__ import annotations

from tests.conftest import API, auth_headers, register


async def test_register_and_me(client):
    data = await register(client, email="alice@example.com")
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["role"] == "owner"
    assert data["tokens"]["access_token"]

    headers = auth_headers(data["tokens"]["access_token"])
    me = await client.get(f"{API}/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["email"] == "alice@example.com"


async def test_duplicate_email_rejected(client):
    await register(client, email="dup@example.com")
    resp = await client.post(
        f"{API}/auth/register",
        json={"email": "dup@example.com", "password": "Password123!"},
    )
    assert resp.status_code == 409


async def test_login_json_and_form(client):
    await register(client, email="bob@example.com")

    # JSON login
    j = await client.post(
        f"{API}/auth/login/json",
        json={"email": "bob@example.com", "password": "Password123!"},
    )
    assert j.status_code == 200
    assert j.json()["tokens"]["access_token"]

    # OAuth2 form login
    f = await client.post(
        f"{API}/auth/login",
        data={"username": "bob@example.com", "password": "Password123!"},
    )
    assert f.status_code == 200
    assert f.json()["token_type"] == "bearer"


async def test_wrong_password(client):
    await register(client, email="carol@example.com")
    resp = await client.post(
        f"{API}/auth/login/json",
        json={"email": "carol@example.com", "password": "wrong"},
    )
    assert resp.status_code == 401


async def test_refresh_token(client):
    data = await register(client, email="dave@example.com")
    resp = await client.post(
        f"{API}/auth/refresh",
        json={"refresh_token": data["tokens"]["refresh_token"]},
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


async def test_protected_route_requires_auth(client):
    resp = await client.get(f"{API}/auth/me")
    assert resp.status_code == 401


async def test_refresh_rejects_access_token(client):
    data = await register(client, email="erin@example.com")
    # Passing an access token where a refresh token is expected must fail.
    resp = await client.post(
        f"{API}/auth/refresh",
        json={"refresh_token": data["tokens"]["access_token"]},
    )
    assert resp.status_code == 401
