# TenderPilot AI — Backend

AI-powered tender analysis & proposal platform for South African SMEs. This is
the **FastAPI backend**: authentication, company profiles, a compliance document
vault, tender PDF ingestion (extract → chunk → embed), a RAG chatbot with page
citations, a rule-based requirement extractor, compliance scoring, a tender
matching engine, a proposal builder, analytics and an admin surface.

> Built to run **fully offline with zero external accounts** (SQLite, local
> storage, deterministic stub LLM + local embeddings), then scale to production
> (PostgreSQL + pgvector, Redis/Celery, Supabase storage, Claude/OpenAI) by
> changing environment variables only — no code changes.

---

## Quick start (no API keys, no Docker)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows  (source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt

# (optional) seed a demo company, user, 6 tenders and 11 vault documents
python -m app.seed
#   Login:  demo@tenderpilot.ai  /  TenderPilot123!

uvicorn app.main:app --reload
```

Open **http://localhost:8000/docs** for interactive Swagger (with an Authorize
button — log in via `POST /api/v1/auth/login`).

Run the test suite:

```bash
pytest                 # 23 tests, all green, no network required
```

---

## What's implemented

| Module | Endpoints (prefix `/api/v1`) |
|---|---|
| **Auth & users** | `auth/register`, `auth/login`, `auth/login/json`, `auth/refresh`, `auth/me` (JWT access+refresh, PBKDF2 hashing, RBAC) |
| **Company profile** | `companies` (create), `companies/me` (get/patch) |
| **Compliance vault** | `documents` (summary + create), `documents/upload`, `documents/{id}` (patch/delete) — expiry tracking, completeness score |
| **Tenders** | `tenders` (list/create), `tenders/upload` (PDF), `tenders/{id}` (get/patch/delete), `/reprocess`, `/download` |
| **AI analysis** | `tenders/{id}/analysis` (run/get) — summary, grounded requirement extraction, eval criteria, compliance verdicts, match score, risk, bid/no-bid |
| **RAG chatbot** | `chat/sessions`, `chat/ask`, `chat/sessions/{id}/ask` — grounded answers with page citations |
| **Proposal builder** | `proposals` (create/list/get), `/sections/generate`, `/sections/{id}` (patch), `/export` (markdown/html/text) |
| **Notifications** | `notifications` (list), `/{id}/read`, `/read-all` |
| **Analytics** | `analytics/overview` — dashboard stats, activity by month, breakdowns |
| **Admin** | `admin/overview`, `admin/audit-logs` (owner/admin only) |

The RAG pipeline follows the developer guide: **upload → extract (pypdf, with
PyMuPDF/pdfplumber auto-preferred if installed) → clean → semantic chunk →
embed → store → hybrid retrieve → grounded answer with citations.** The
assistant never invents requirements and always cites pages.

---

## Architecture

```
app/
  main.py            FastAPI app factory, CORS, lifespan, health
  config.py          Pydantic settings (all env-driven, safe defaults)
  database.py        Async SQLAlchemy engine/session, Base, init_db
  security.py        PBKDF2 password hashing + JWT
  deps.py            Auth dependency, RBAC, tenant (company) scoping
  models/            ORM: users, companies, tenders, tender_chunks,
                     tender_requirements, evaluation_criteria, tender_matches,
                     compliance_documents, proposal_drafts/sections,
                     chat_sessions/messages, notifications, subscriptions,
                     analytics_events, audit_logs
  schemas/           Pydantic request/response models
  services/          storage · pdf · chunking · embeddings · vectorstore ·
                     llm · rag · ingestion · analysis · compliance · matching ·
                     proposals · events · tasks
  api/routes/        One router per module
  worker.py          Optional Celery worker (production)
  seed.py            Demo data matching the frontend prototype
tests/               pytest suite (auth, vault, services, full E2E flow)
```

### Tenant isolation & security
- Every domain resource is scoped to the caller's `company_id`; cross-tenant
  access returns 404 (covered by `test_tenant_isolation`).
- JWT access/refresh tokens; refresh tokens can't be used as access tokens.
- RBAC roles: `owner`, `admin`, `member`; admin routes gated.
- Uploads are size-limited and content-addressed (SHA-256) with path-traversal
  guards on local storage; Supabase backend issues signed URLs.
- Audit log + analytics events recorded for sensitive actions.

---

## Going to production (flip env vars, no code changes)

| Capability | Dev default | Production |
|---|---|---|
| Database | SQLite (`aiosqlite`) | `DATABASE_URL=postgresql+asyncpg://…` (+ `pip install asyncpg`) |
| Vectors | JSON column + Python cosine | pgvector (see note below) |
| LLM | `stub` (deterministic, offline) | `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` (or `openai`) |
| Embeddings | `local` hashing embedder | `EMBEDDING_PROVIDER=openai` + `OPENAI_API_KEY` |
| Storage | local filesystem | `STORAGE_BACKEND=supabase` + `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` |
| Queue | inline background tasks | `REDIS_URL=…`, `CELERY_EAGER=false`, run `celery -A app.worker.celery_app worker` |
| Schema | `auto_create_db=true` | `AUTO_CREATE_DB=false` + Alembic migrations |

Copy `.env.example` to `.env` and fill what you need. **Nothing is required to
run locally.**

Full stack locally with Docker (PostgreSQL+pgvector, Redis, API, Celery worker):

```bash
docker compose up --build
```

## Deploying to Vercel

This backend ships Vercel-ready: [api/index.py](api/index.py) exposes the ASGI
app and [vercel.json](vercel.json) routes all traffic to it.

> ⚠️ **Vercel = serverless.** The filesystem is read-only, there's no local
> database, and background tasks don't run after a response. So you **must** use
> a hosted Postgres + external storage, and ingestion runs inline (env-driven —
> no code changes). For a heavy PDF/RAG workload, your architecture guide's
> recommendation (Vercel frontend + **Railway/Render** for this backend) is the
> smoother fit. Both options are supported.

**Steps**

1. **Provision a Postgres database** — Vercel Postgres, [Neon](https://neon.tech),
   or Supabase. Grab the **pooled** connection string and prefix the driver:
   `postgresql+asyncpg://USER:PASS@HOST:6543/DB?sslmode=require`.
2. **(Recommended) Provision Supabase Storage** for uploaded PDFs/documents, or
   accept ephemeral `/tmp` storage.
3. **Import the repo into Vercel** and set **Root Directory = `backend`**
   (Project → Settings → General). Vercel auto-detects the Python runtime and
   installs `requirements.txt`.
4. **Set environment variables** from [.env.vercel.example](.env.vercel.example)
   — at minimum `DATABASE_URL`, `ENVIRONMENT=production`, `DB_USE_NULL_POOL=true`,
   `INGEST_INLINE_SYNC=true`, `AUTO_CREATE_DB=false`, `SECRET_KEY`, `CORS_ORIGINS`.
5. **Create the schema once** (lifespan may not run on serverless):
   ```bash
   # locally, pointing at the remote DB
   DATABASE_URL="postgresql+asyncpg://…6543/DB?sslmode=require" python -m app.initdb
   # optional demo data:
   DATABASE_URL="…" python -m app.seed
   ```
6. **Deploy.** Verify `https://<your-app>.vercel.app/health` and `/docs`.

**Vercel notes**
- `maxDuration` is set to 60s in `vercel.json` (raise the plan if large PDFs hit
  the limit; ingestion runs inside the upload request when `INGEST_INLINE_SYNC=true`).
- `DB_USE_NULL_POOL=true` switches SQLAlchemy to `NullPool` and disables asyncpg's
  prepared-statement cache so it's safe behind a transaction-mode pgbouncer.
- This deploys the **API only**. Host the frontend separately and point it at
  this API's URL (set that origin in `CORS_ORIGINS`).

### pgvector note
Chunk embeddings are stored as a JSON float array and scored with cosine
similarity in Python — portable and correct everywhere. For production-scale
semantic search on PostgreSQL, replace `TenderChunk.embedding` with a pgvector
`Vector(dim)` column and swap `services/vectorstore.search` for an
`ORDER BY embedding <=> :q` query. The service interface is unchanged, so only
those two spots are touched.

---

## "Skipped — requires you" (intentionally deferred)

These need **your** accounts/keys and are wired but inert until configured:

- **LLM API key** (Anthropic/OpenAI) — runs on the offline stub until set.
- **OpenAI embeddings key** — uses the local embedder until set.
- **Supabase** project/bucket/keys — uses local storage until set.
- **Redis/Celery broker** — runs ingestion inline until `REDIS_URL` is set.
- **Tender discovery crawler** (Playwright/Scrapy) — the ingestion pipeline and
  `source_url` field are ready to receive crawled PDFs; the crawler itself is a
  separate Phase-3 service.
- **OCR** (Tesseract/Document AI) — scanned PDFs are detected (`needs_ocr`) and
  flagged; wire the OCR call at the marked hook in `services/ingestion.py`.
- **Payments**, **email/WhatsApp/SMS delivery** — notification records are
  created; outbound delivery integrations are deferred.
- **Production secrets/CORS** — set a strong `SECRET_KEY` and real CORS origins.

---

## Tech
FastAPI · SQLAlchemy 2 (async) · Pydantic v2 · PyJWT · pypdf · httpx · pytest.
Runs on Python 3.12–3.14 (verified on 3.14).
