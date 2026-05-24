"""SQLAlchemy ORM models.

Importing this package registers every model on ``Base.metadata`` so that
``init_db`` / Alembic can see the full schema.
"""
from app.models.user import User  # noqa: F401
from app.models.company import Company  # noqa: F401
from app.models.tender import (  # noqa: F401
    Tender,
    TenderChunk,
    TenderRequirement,
    TenderMatch,
    EvaluationCriterion,
)
from app.models.document import ComplianceDocument  # noqa: F401
from app.models.proposal import ProposalDraft, ProposalSection  # noqa: F401
from app.models.chat import ChatSession, ChatMessage  # noqa: F401
from app.models.system import (  # noqa: F401
    Notification,
    Subscription,
    AnalyticsEvent,
    AuditLog,
)

__all__ = [
    "User",
    "Company",
    "Tender",
    "TenderChunk",
    "TenderRequirement",
    "TenderMatch",
    "EvaluationCriterion",
    "ComplianceDocument",
    "ProposalDraft",
    "ProposalSection",
    "ChatSession",
    "ChatMessage",
    "Notification",
    "Subscription",
    "AnalyticsEvent",
    "AuditLog",
]
