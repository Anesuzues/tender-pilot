"""Application configuration.

All settings are sourced from environment variables (or a local ``.env`` file).
Sensible defaults let the whole backend run end-to-end on a developer machine
with no external accounts, API keys, or services — see README for the production
path (PostgreSQL + pgvector, Redis/Celery, Supabase storage, an LLM key).
"""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- App ---
    app_name: str = "TenderPilot AI"
    environment: Literal["development", "staging", "production", "test"] = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    # --- Security ---
    # NOTE: override with a strong random value in production (see README).
    secret_key: str = "dev-insecure-change-me-please-0123456789abcdef"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24h
    refresh_token_expire_minutes: int = 60 * 24 * 14  # 14 days

    # --- CORS ---
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5173", "*"]
    )

    # --- Database ---
    # SQLite (async) by default; set DATABASE_URL to a postgresql+asyncpg DSN
    # in production. pgvector is auto-detected when running on PostgreSQL.
    database_url: str = "sqlite+aiosqlite:///./tenderpilot.db"
    # Auto-run create_all on startup. Convenient for dev/demo; set to false and
    # use Alembic migrations for a managed production database.
    auto_create_db: bool = True
    # Serverless (e.g. Vercel) needs NullPool + pgbouncer-safe asyncpg so a
    # connection is never reused across frozen invocations. Enable on Vercel.
    db_use_null_pool: bool = False

    # --- Storage ---
    # "local" writes encrypted-at-rest files under STORAGE_DIR; "supabase"
    # uses Supabase Storage when SUPABASE_URL / SUPABASE_SERVICE_KEY are set.
    storage_backend: Literal["local", "supabase"] = "local"
    storage_dir: str = "./storage"
    supabase_url: str | None = None
    supabase_service_key: str | None = None
    supabase_bucket: str = "tenderpilot"

    # --- AI / RAG ---
    # When no provider key is configured the backend uses a deterministic local
    # stub so every endpoint (analysis, chat, proposals) still works offline.
    llm_provider: Literal["anthropic", "openai", "stub"] = "stub"
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    llm_model: str = "claude-sonnet-4-6"
    embedding_provider: Literal["openai", "local"] = "local"
    embedding_model: str = "text-embedding-3-small"
    embedding_dim: int = 256  # local hashing-embedder dimensionality

    # --- RAG retrieval ---
    chunk_target_tokens: int = 350
    chunk_overlap_tokens: int = 60
    rag_top_k: int = 6

    # --- Queue (optional) ---
    redis_url: str | None = None
    celery_eager: bool = True  # run tasks inline when no broker is configured
    # Run tender ingestion synchronously inside the upload request. Required on
    # serverless platforms (Vercel) where post-response background tasks and
    # Celery workers are not available.
    ingest_inline_sync: bool = False

    # --- Uploads ---
    max_upload_mb: int = 50

    @property
    def is_postgres(self) -> bool:
        return self.database_url.startswith("postgresql")

    @property
    def ai_enabled(self) -> bool:
        return bool(self.anthropic_api_key or self.openai_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
