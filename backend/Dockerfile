# TenderPilot AI backend — production image
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (optional OCR/PDF libs can be added here, e.g. tesseract-ocr).
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Install core + production extras (asyncpg, redis, celery) for the image.
RUN pip install -r requirements.txt \
    && pip install "asyncpg>=0.29" "redis>=5.0" "celery>=5.3"

COPY . .

EXPOSE 8000

# Use multiple workers behind the platform's load balancer.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
