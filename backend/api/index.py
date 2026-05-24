"""Vercel serverless entrypoint.

Vercel's @vercel/python runtime serves the ASGI ``app`` exported here. The
project root (``backend/``) is added to sys.path so ``app`` is importable
regardless of how Vercel sets the working directory.

Deploy with the project's Root Directory set to ``backend`` (see README →
"Deploying to Vercel").
"""
from __future__ import annotations

import os
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from app.main import app  # noqa: E402

# Vercel looks for a module-level ASGI/WSGI callable named ``app``.
__all__ = ["app"]
