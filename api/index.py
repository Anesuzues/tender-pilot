"""Vercel serverless entrypoint (repo-root level).

Vercel deploys from the repo root, so this file sits at api/index.py.
It adds the backend/ directory to sys.path so the FastAPI app is importable.
"""
from __future__ import annotations

import os
import sys

# Repo root is the parent of this file's directory (api/).
# Backend package lives at <repo-root>/backend/.
_BACKEND = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "backend",
)
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

from app.main import app  # noqa: E402

__all__ = ["app"]
