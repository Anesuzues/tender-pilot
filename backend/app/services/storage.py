"""File storage abstraction.

Default backend writes to the local filesystem under ``settings.storage_dir``.
Set ``STORAGE_BACKEND=supabase`` plus Supabase credentials to use Supabase
Storage with signed URLs (production). Files are content-addressed by SHA-256
so duplicate uploads de-duplicate naturally.
"""
from __future__ import annotations

import hashlib
import os
from pathlib import Path
from typing import Optional

from app.config import settings


def compute_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class StorageBackend:
    def save(self, key: str, data: bytes, content_type: str | None = None) -> str:
        raise NotImplementedError

    def read(self, key: str) -> bytes:
        raise NotImplementedError

    def delete(self, key: str) -> None:
        raise NotImplementedError

    def signed_url(self, key: str, expires_seconds: int = 3600) -> Optional[str]:
        return None


class LocalStorage(StorageBackend):
    def __init__(self, base_dir: str) -> None:
        self.base = Path(base_dir).resolve()
        self.base.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        # Prevent path traversal — keys are flat, hashed names.
        safe = key.replace("..", "").lstrip("/\\")
        p = (self.base / safe).resolve()
        if not str(p).startswith(str(self.base)):
            raise ValueError("Invalid storage key")
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    def save(self, key: str, data: bytes, content_type: str | None = None) -> str:
        path = self._path(key)
        path.write_bytes(data)
        return key

    def read(self, key: str) -> bytes:
        return self._path(key).read_bytes()

    def delete(self, key: str) -> None:
        path = self._path(key)
        if path.exists():
            os.remove(path)


class SupabaseStorage(StorageBackend):
    """Thin Supabase Storage client over httpx (no SDK dependency)."""

    def __init__(self) -> None:
        if not (settings.supabase_url and settings.supabase_service_key):
            raise RuntimeError("Supabase storage requires SUPABASE_URL and key")
        self.base = settings.supabase_url.rstrip("/")
        self.bucket = settings.supabase_bucket
        self.key = settings.supabase_service_key

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.key}"}

    def save(self, key: str, data: bytes, content_type: str | None = None) -> str:
        import httpx

        url = f"{self.base}/storage/v1/object/{self.bucket}/{key}"
        headers = self._headers()
        headers["Content-Type"] = content_type or "application/octet-stream"
        headers["x-upsert"] = "true"
        resp = httpx.post(url, content=data, headers=headers, timeout=60)
        resp.raise_for_status()
        return key

    def read(self, key: str) -> bytes:
        import httpx

        url = f"{self.base}/storage/v1/object/{self.bucket}/{key}"
        resp = httpx.get(url, headers=self._headers(), timeout=60)
        resp.raise_for_status()
        return resp.content

    def delete(self, key: str) -> None:
        import httpx

        url = f"{self.base}/storage/v1/object/{self.bucket}/{key}"
        httpx.delete(url, headers=self._headers(), timeout=30)

    def signed_url(self, key: str, expires_seconds: int = 3600) -> Optional[str]:
        import httpx

        url = f"{self.base}/storage/v1/object/sign/{self.bucket}/{key}"
        resp = httpx.post(
            url, json={"expiresIn": expires_seconds}, headers=self._headers(), timeout=30
        )
        resp.raise_for_status()
        return self.base + resp.json().get("signedURL", "")


_backend: StorageBackend | None = None


def get_storage() -> StorageBackend:
    global _backend
    if _backend is None:
        if settings.storage_backend == "supabase":
            _backend = SupabaseStorage()
        else:
            _backend = LocalStorage(settings.storage_dir)
    return _backend
