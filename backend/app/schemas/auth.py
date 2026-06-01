"""Auth + user schemas."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = Field(default=None, max_length=255)
    company_name: Optional[str] = Field(default=None, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class UserOut(ORMModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_active: bool
    is_superuser: bool = False
    company_id: Optional[str] = None


class AuthResult(BaseModel):
    user: UserOut
    tokens: TokenPair
