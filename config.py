import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (silently ignored if file doesn't exist)
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# ── Directories ────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Database ────────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./credit_app.db")

# ── AI / LLM ───────────────────────────────────────────────────────────────────
GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY", "")
USE_LLM_EXTRACTOR = os.getenv("USE_LLM_EXTRACTOR", "false").lower() == "true"

# ── External APIs (Phase 2) ────────────────────────────────────────────────────
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")

# ── Cloud Storage — AWS S3 (Phase 4) ──────────────────────────────────────────
AWS_ACCESS_KEY_ID     = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION            = os.getenv("AWS_REGION", "ap-south-1")
S3_BUCKET_NAME        = os.getenv("S3_BUCKET_NAME", "")
USE_S3_STORAGE        = bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and S3_BUCKET_NAME)

# ── Authentication — JWT (Phase 4) ────────────────────────────────────────────
JWT_SECRET_KEY   = os.getenv("JWT_SECRET_KEY", "change-me-in-production-to-a-secure-random-secret")
JWT_ALGORITHM    = "HS256"
JWT_EXPIRE_MINS  = int(os.getenv("JWT_EXPIRE_MINS", "60"))

# ── Async Workers — Celery / Redis (Phase 4) ──────────────────────────────────
REDIS_URL          = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL  = os.getenv("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_URL  = os.getenv("CELERY_RESULT_URL", REDIS_URL)

# ── Credit Bureau / CIBIL (Phase 5) ───────────────────────────────────────────
CIBIL_API_KEY = os.getenv("CIBIL_API_KEY", "")  # Leave blank to use deterministic mock

