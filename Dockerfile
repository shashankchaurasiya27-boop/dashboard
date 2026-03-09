# ────────────────────────────────────────────────────────────────
# Intelli-Credit Backend — Production Dockerfile
# Platform: Render / Railway / Docker / Cloud Run
# ────────────────────────────────────────────────────────────────
FROM python:3.11-slim

# System deps for psycopg2, reportlab, PyMuPDF (PDF parsing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer-cached for speed)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Ensure upload/output directories exist
RUN mkdir -p uploads outputs

# Expose port (platforms inject $PORT at runtime)
EXPOSE 8000

# Production startup: 4 workers, uvicorn ASGI
CMD ["gunicorn", "main:app", \
     "-w", "4", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
