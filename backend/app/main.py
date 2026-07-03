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

# Error monitoring — active only when SENTRY_DSN is configured.
if settings.sentry_dsn:  # pragma: no cover
    try:
        import sentry_sdk

        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.environment,
            traces_sample_rate=0.1,
        )
        logger.info("Sentry error monitoring enabled")
    except Exception as exc:
        logger.warning("Sentry init failed (%s) — continuing without monitoring", exc)


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


_DEFAULT_SUPERADMIN_PW = "TenderPilotAdmin123!"


async def _seed_superadmin() -> None:
    """Create the platform super-admin on first boot (oversees all companies)."""
    from sqlalchemy import select
    from app.models.user import ROLE_ADMIN, User
    from app.security import hash_password

    email = settings.superadmin_email.lower()
    try:
        async with SessionLocal() as db:
            existing = (
                await db.execute(select(User).where(User.email == email))
            ).scalar_one_or_none()
            if existing:
                # Ensure the flag stays set even if the row predates this feature.
                if not existing.is_superuser:
                    existing.is_superuser = True
                    await db.commit()
                    logger.info("Existing account promoted to super-admin: %s", email)
                return
            # Never create the account with the repo-committed default password
            # in production — require an explicit SUPERADMIN_PASSWORD env var.
            if (
                settings.environment == "production"
                and settings.superadmin_password == _DEFAULT_SUPERADMIN_PW
            ):
                logger.warning(
                    "Super-admin not seeded: set SUPERADMIN_PASSWORD env var "
                    "(refusing to use the default password in production)"
                )
                return
            user = User(
                email=email,
                hashed_password=hash_password(settings.superadmin_password),
                full_name="Platform Admin",
                role=ROLE_ADMIN,
                is_superuser=True,
                company_id=None,
            )
            db.add(user)
            await db.commit()
            logger.info("Super-admin seeded: %s", email)
    except Exception as exc:
        logger.warning("Super-admin seed failed (%s) — skipping", exc)


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
    await _seed_superadmin()

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

    @app.get("/health/db", tags=["health"])
    async def health_db() -> dict:
        """Runs a trivial query. Doubles as the daily keep-alive ping that
        stops the free-tier Supabase project from auto-pausing."""
        from sqlalchemy import text
        from app.database import SessionLocal

        try:
            async with SessionLocal() as db:
                await db.execute(text("SELECT 1"))
            return {"database": "ok"}
        except Exception as exc:
            logger.warning("DB health check failed: %s", exc)
            return JSONResponse(
                status_code=503,
                content={"database": "unavailable", "detail": "Database unreachable"},
            )

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
        # Connection-level DB failures (paused Supabase, network) → clean 503
        # instead of a raw 500, so the frontend can show a helpful message.
        name = type(exc).__name__
        text_ = str(exc).lower()
        db_signals = ("connect", "enotfound", "tenant", "pool", "timeout", "operationalerror")
        if any(s in text_ for s in db_signals) or "asyncpg" in type(exc).__module__:
            logger.error("Database unavailable on %s: %s: %s", request.url.path, name, exc)
            return JSONResponse(
                status_code=503,
                content={"detail": "Service temporarily unavailable — database unreachable. Please try again shortly."},
            )
        logger.exception("Unhandled error on %s", request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    return app


app = create_app()
