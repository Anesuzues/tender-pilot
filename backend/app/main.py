"""FastAPI application factory and entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app import __version__
from app.api.router import api_router
from app.config import settings
from app.database import init_db, SessionLocal

logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)
logger = logging.getLogger("tenderpilot")


async def _seed_demo_user() -> None:
    """Create demo account on first boot if it doesn't exist yet."""
    from sqlalchemy import select
    from app.models.company import Company
    from app.models.user import ROLE_OWNER, User
    from app.security import hash_password

    DEMO_EMAIL = "demo@tenderpilot.ai"
    DEMO_PASSWORD = "TenderPilot123!"

    try:
        async with SessionLocal() as db:
            existing = (
                await db.execute(select(User).where(User.email == DEMO_EMAIL))
            ).scalar_one_or_none()
            if existing:
                return
            company = Company(name="TenderPilot Demo Co.")
            db.add(company)
            await db.flush()
            user = User(
                email=DEMO_EMAIL,
                hashed_password=hash_password(DEMO_PASSWORD),
                full_name="Demo User",
                role=ROLE_OWNER,
                company_id=company.id,
            )
            db.add(user)
            await db.commit()
            logger.info("Demo user seeded: %s", DEMO_EMAIL)
    except Exception as exc:
        logger.warning("Demo user seed failed (%s) — skipping", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables when enabled (dev/demo). Disable + use Alembic in prod.
    if settings.auto_create_db:
        try:
            await init_db()
            logger.info("Database initialized (auto create_all, %s)", settings.database_url.split("://")[0])
        except Exception as exc:
            logger.warning("auto_create_db failed (%s) — continuing startup", exc)

    await _seed_demo_user()

    logger.info(
        "TenderPilot AI %s starting — env=%s ai_enabled=%s storage=%s",
        __version__, settings.environment, settings.ai_enabled, settings.storage_backend,
    )
    yield
    logger.info("TenderPilot AI shutting down")


def create_app() -> FastAPI:
    limiter = Limiter(key_func=get_remote_address)
    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        description=(
            "AI-powered tender analysis & proposal platform for South African SMEs. "
            "RAG-grounded analysis, compliance scoring, tender matching, and proposal "
            "generation."
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.effective_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/", tags=["health"])
    async def root() -> dict:
        return {
            "name": settings.app_name,
            "version": __version__,
            "status": "ok",
            "docs": "/docs",
        }

    @app.get("/health", tags=["health"])
    async def health() -> dict:
        return {
            "status": "healthy",
            "environment": settings.environment,
            "ai_enabled": settings.ai_enabled,
            "llm_provider": settings.llm_provider,
            "embedding_provider": settings.embedding_provider,
            "storage_backend": settings.storage_backend,
        }

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    return app


app = create_app()
