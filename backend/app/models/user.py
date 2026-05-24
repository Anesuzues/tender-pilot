"""User account model."""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.company import Company


# Role constants (RBAC). Stored as plain strings for portability.
ROLE_OWNER = "owner"
ROLE_ADMIN = "admin"
ROLE_MEMBER = "member"
ROLES = (ROLE_OWNER, ROLE_ADMIN, ROLE_MEMBER)


class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[Optional[str]] = mapped_column(String(255), default=None)
    role: Mapped[str] = mapped_column(String(32), default=ROLE_OWNER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    company_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("companies.id", ondelete="SET NULL"), default=None, index=True
    )
    company: Mapped[Optional["Company"]] = relationship(
        back_populates="members", lazy="selectin"
    )
