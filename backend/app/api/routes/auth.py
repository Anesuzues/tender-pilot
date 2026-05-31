"""Authentication & account routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select

import jwt

from app.deps import CurrentUser, DbSession
from app.models.company import Company
from app.models.user import ROLE_OWNER, User
from app.config import settings
from app.schemas.auth import (
    AuthResult,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenPair,
    UserOut,
)
from app.schemas.common import Message
from app.security import create_token, decode_token, hash_password, verify_password
from app.services.email import send_email
from app.services.events import audit, track

router = APIRouter(prefix="/auth", tags=["auth"])
_limiter = Limiter(key_func=get_remote_address)


def _tokens(user: User) -> TokenPair:
    return TokenPair(
        access_token=create_token(user.id, "access", role=user.role),
        refresh_token=create_token(user.id, "refresh"),
    )


@router.post("/register", response_model=AuthResult, status_code=status.HTTP_201_CREATED)
@_limiter.limit("5/minute")
async def register(request: Request, payload: RegisterRequest, db: DbSession) -> AuthResult:
    existing = (
        await db.execute(select(User).where(User.email == payload.email.lower()))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    company = None
    if payload.company_name:
        company = Company(name=payload.company_name)
        db.add(company)
        await db.flush()

    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=ROLE_OWNER,
        company_id=company.id if company else None,
    )
    db.add(user)
    await db.flush()

    await audit(db, user.id, "user.register", "user", user.id)
    await track(db, "user_registered", user.id, company.id if company else None)

    return AuthResult(user=UserOut.model_validate(user), tokens=_tokens(user))


async def _authenticate(db: DbSession, email: str, password: str) -> User:
    user = (
        await db.execute(select(User).where(User.email == email.lower()))
    ).scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account disabled")
    return user


@router.post("/login", response_model=TokenPair)
async def login_form(
    db: DbSession,
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> TokenPair:
    """OAuth2 password flow (username = email) — powers the Swagger Authorize box."""
    user = await _authenticate(db, form.username, form.password)
    await audit(db, user.id, "user.login", "user", user.id)
    return _tokens(user)


@router.post("/login/json", response_model=AuthResult)
@_limiter.limit("10/minute")
async def login_json(request: Request, payload: LoginRequest, db: DbSession) -> AuthResult:
    user = await _authenticate(db, payload.email, payload.password)
    await audit(db, user.id, "user.login", "user", user.id)
    return AuthResult(user=UserOut.model_validate(user), tokens=_tokens(user))


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshRequest, db: DbSession) -> TokenPair:
    try:
        claims = decode_token(payload.refresh_token)
        if claims.get("type") != "refresh":
            raise ValueError("not a refresh token")
        user_id = claims["sub"]
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    return _tokens(user)


@router.post("/forgot-password", response_model=Message)
@_limiter.limit("5/minute")
async def forgot_password(
    request: Request, payload: ForgotPasswordRequest, db: DbSession
) -> Message:
    """Send a password-reset link. Always returns success to prevent account
    enumeration; only sends an email if the account actually exists."""
    user = (
        await db.execute(select(User).where(User.email == payload.email.lower()))
    ).scalar_one_or_none()
    if user and user.is_active:
        token = create_token(user.id, "access", scope="password_reset")
        reset_link = f"{settings.app_url}/?reset_token={token}"
        await send_email(
            to=user.email,
            subject="Reset your TenderPilot password",
            html=(
                f"<p>Hi{(' ' + user.full_name) if user.full_name else ''},</p>"
                f"<p>We received a request to reset your TenderPilot password. "
                f"Click the link below to choose a new one (valid for "
                f"{settings.reset_token_expire_minutes} minutes):</p>"
                f'<p><a href="{reset_link}">Reset my password</a></p>'
                f"<p>If you didn't request this, you can safely ignore this email.</p>"
            ),
            text=f"Reset your TenderPilot password: {reset_link}",
        )
    return Message(message="If an account exists for that email, a reset link has been sent.")


@router.post("/reset-password", response_model=Message)
@_limiter.limit("5/minute")
async def reset_password(
    request: Request, payload: ResetPasswordRequest, db: DbSession
) -> Message:
    try:
        claims = decode_token(payload.token)
        if claims.get("scope") != "password_reset":
            raise ValueError("wrong scope")
        user_id = claims["sub"]
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset link")
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset link")
    user.hashed_password = hash_password(payload.new_password)
    await audit(db, user.id, "user.reset_password", "user", user.id)
    return Message(message="Password updated. You can now sign in with your new password.")


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)
