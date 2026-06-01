"""FastAPI dependencies: current user resolution, RBAC, company scoping."""
from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import ROLE_ADMIN, ROLE_OWNER, User
from app.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.api_v1_prefix}/auth/login", auto_error=True
)

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: DbSession,
) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise credentials_exc
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_exc
    except jwt.PyJWTError:
        raise credentials_exc

    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_exc
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_company(user: CurrentUser) -> str:
    """Ensure the user belongs to a company; return its id (tenant scope)."""
    if not user.company_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No company profile. Create a company first.",
        )
    return user.company_id


CompanyId = Annotated[str, Depends(require_company)]


def require_roles(*roles: str):
    async def checker(user: CurrentUser) -> User:
        if user.is_superuser:
            return user
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return checker


AdminUser = Annotated[User, Depends(require_roles(ROLE_OWNER, ROLE_ADMIN))]


async def require_superuser(user: CurrentUser) -> User:
    if not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform super-admin only",
        )
    return user


SuperUser = Annotated[User, Depends(require_superuser)]
