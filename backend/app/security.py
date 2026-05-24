"""Password hashing and JWT token utilities.

Password hashing uses PBKDF2-HMAC-SHA256 from the standard library, so there is
no compiled dependency to build. The interface (`hash_password` /
`verify_password`) is a drop-in for bcrypt/argon2 should you swap the algorithm.
"""
from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import timedelta
from typing import Any, Literal

import jwt

from app.config import settings
from app.database import utcnow

_PBKDF2_ROUNDS = 240_000
_SALT_BYTES = 16


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(_SALT_BYTES)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ROUNDS)
    return f"pbkdf2_sha256${_PBKDF2_ROUNDS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, rounds_s, salt_hex, hash_hex = encoded.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        rounds = int(rounds_s)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)
    except (ValueError, AttributeError):
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, rounds)
    return hmac.compare_digest(dk, expected)


TokenType = Literal["access", "refresh"]


def create_token(subject: str, token_type: TokenType = "access", **extra: Any) -> str:
    if token_type == "access":
        expires = timedelta(minutes=settings.access_token_expire_minutes)
    else:
        expires = timedelta(minutes=settings.refresh_token_expire_minutes)
    now = utcnow()
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires,
        **extra,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    """Decode/verify a JWT. Raises jwt.PyJWTError subclasses on failure."""
    return jwt.decode(
        token, settings.secret_key, algorithms=[settings.jwt_algorithm]
    )
