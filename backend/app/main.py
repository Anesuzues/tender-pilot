"""FastAPI application factory and entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.api.router import api_router
from app.config import settings
from app.database import init_db

logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)
logger = logging.getLogger("tenderpilot")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables when enabled (dev/demo). Disable + use Alembic in prod.
    if settings.auto_create_db:
        await init_db()
        logger.info("Database initialized (auto create_all, %s)", settings.database_url.split("://")[0])
    logger.info(
        "TenderPilot AI %s starting — env=%s ai_enabled=%s storage=%s",
        __version__, settings.environment, settings.ai_enabled, settings.storage_backend,
    )
    yield
    logger.info("TenderPilot AI shutting down")


def create_app() -> FastAPI:
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

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
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
