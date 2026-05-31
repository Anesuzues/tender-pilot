"""Transactional email service.

Uses the Resend HTTP API when ``RESEND_API_KEY`` is configured. When no key is
set the email is logged instead of sent, so flows still complete in development
without a provider (and never crash the request).
"""
from __future__ import annotations

import logging

from app.config import settings

logger = logging.getLogger("tenderpilot.email")


async def send_email(to: str, subject: str, html: str, text: str | None = None) -> bool:
    """Send an email. Returns True if dispatched to a provider, False if logged only."""
    if not settings.resend_api_key:
        logger.info("EMAIL (no provider configured) → to=%s subject=%s\n%s", to, subject, text or html)
        return False

    import httpx

    payload = {
        "from": settings.email_from,
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if text:
        payload["text"] = text
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                "https://api.resend.com/emails",
                json=payload,
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            )
            r.raise_for_status()
        logger.info("Email sent to %s (subject=%s)", to, subject)
        return True
    except Exception as exc:  # pragma: no cover
        logger.warning("Email send failed (%s) — continuing", exc)
        return False
