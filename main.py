import os
from datetime import timedelta

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status, Request
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from config import JWT_EXPIRE_MINS, USE_S3_STORAGE
from database.db import engine, get_db, Base
from database.crud import (
    get_evaluation_by_id, get_all_evaluations,
    create_draft, get_draft, get_all_drafts,
    update_draft_corrections, finalize_draft,
    create_user, get_user_by_username,
)
from models.schemas import HistoryItem
from services.credit_pipeline import CreditPipeline
from services.draft_pipeline import DraftPipeline
from services.auth import (
    authenticate_user, create_access_token,
    get_current_user, require_role,
)

# ── Startup: ensure all tables exist (including users, draft_evaluations) ─────
Base.metadata.create_all(bind=engine)


def _seed_default_users():
    """Create default admin + analyst accounts if users table is empty."""
    from database.db import SessionLocal
    db = SessionLocal()
    try:
        if not get_user_by_username(db, "admin"):
            create_user(db, username="admin", password="Admin@1234", role="manager")
        if not get_user_by_username(db, "analyst"):
            create_user(db, username="analyst", password="Analyst@1234", role="analyst")
    finally:
        db.close()


_seed_default_users()

app = FastAPI(
    title="Intelli-Credit API",
    version="5.0.0",
    description=(
        "AI-powered credit risk appraisal with Cloud Storage, JWT Auth, "
        "Industry Benchmarking, CIBIL Bureau Integration, and Async Workers."
    ),
)

# ── CORS — reads from env var for production ───────────────────────────────────
# In production, set:  ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
# For dev, the localhost fallbacks are used automatically.
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
)
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return structured JSON for any unhandled server error."""
    return JSONResponse(
        status_code=500,
        content={"error": type(exc).__name__, "detail": str(exc), "path": str(request.url)},
    )


# ─────────────────────────────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/token", tags=["Auth"])
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login with username + password → returns JWT bearer token."""
    user = authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=timedelta(minutes=JWT_EXPIRE_MINS),
    )
    return {"access_token": token, "token_type": "bearer", "role": user.role}


@app.get("/me", tags=["Auth"])
def current_user_info(user=Depends(get_current_user)):
    """Return info about the currently authenticated user."""
    return {"username": user.username, "role": user.role}


# ─────────────────────────────────────────────────────────────────────────────
# Root
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/", tags=["System"])
def read_root():
    return {
        "message": "Intelli-Credit API is running",
        "version": "5.0.0",
        "storage": "S3" if USE_S3_STORAGE else "local",
        "workflow": {
            "express": "POST /upload/ → instant evaluation",
            "analyst": "POST /draft/ → PUT /verify/{id} → POST /finalize/{id}",
            "async":   "POST /upload/async/ → GET /status/{task_id}",
        },
        "default_credentials": {
            "manager": "admin / Admin@1234",
            "analyst": "analyst / Analyst@1234",
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# Express Pipeline (synchronous, backward-compatible)
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/upload/", tags=["Evaluation"])
async def upload_files(
    files: List[UploadFile] = File(...),
    industry: Optional[str] = Form("general"),
    pan_number: Optional[str] = Form(""),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Upload PDF(s) for instant evaluation. Requires authentication."""
    pipeline = CreditPipeline(db)
    results = []
    for file in files:
        result = await pipeline.run(file, industry=industry or "general", pan_number=pan_number or "")
        results.append(result)
    return results[0] if len(results) == 1 else results


# ─────────────────────────────────────────────────────────────────────────────
# Async Express Pipeline (Celery)
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/upload/async/", tags=["Evaluation"])
async def upload_files_async(
    files: List[UploadFile] = File(...),
    industry: Optional[str] = Form("general"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Upload PDF(s) for background evaluation via Celery.
    Returns immediately with a task_id to poll.
    Requires Redis to be running (redis://localhost:6379).
    """
    from ingestion.file_handler import save_uploaded_file
    from services.worker import run_evaluation_task

    task_ids = []
    for file in files:
        file_location = await save_uploaded_file(file)
        company_name = file.filename.rsplit(".", 1)[0].replace("_", " ").strip()
        task = run_evaluation_task.delay(file_location, company_name, industry or "general")
        task_ids.append({"filename": file.filename, "task_id": task.id})

    return {
        "status":   "processing",
        "tasks":    task_ids,
        "poll_url": "/status/{task_id}",
        "message":  "Tasks dispatched to Celery workers. Poll /status/{task_id} for results.",
    }


@app.get("/status/{task_id}", tags=["Evaluation"])
def get_task_status(task_id: str, user=Depends(get_current_user)):
    """Poll the status of a background Celery task."""
    try:
        from celery.result import AsyncResult
        from services.worker import celery_app
        result = AsyncResult(task_id, app=celery_app)
        response = {"task_id": task_id, "status": result.state}
        if result.state == "PROGRESS":
            response["progress"] = result.info
        elif result.state == "SUCCESS":
            response["result"] = result.result
        elif result.state == "FAILURE":
            response["error"] = str(result.info)
        return response
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Celery unavailable: {exc}")


# ─────────────────────────────────────────────────────────────────────────────
# Human-in-the-Loop (Draft → Verify → Finalize)
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/draft/", tags=["Analyst Workflow"])
async def create_draft_evaluation(
    files: List[UploadFile] = File(...),
    industry: Optional[str] = Form("general"),
    pan_number: Optional[str] = Form(""),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Stage 1: Upload → extract → create draft for review."""
    draft_pipeline = DraftPipeline(db)
    results = []
    for file in files:
        result = await draft_pipeline.run(file, industry=industry or "general")
        results.append(result)
    return results[0] if len(results) == 1 else results


@app.put("/verify/{draft_id}", tags=["Analyst Workflow"])
async def verify_draft(
    draft_id: int,
    corrections: dict,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Stage 2: Analyst submits corrected financial numbers."""
    draft = update_draft_corrections(db, draft_id, corrections)
    if not draft:
        raise HTTPException(status_code=404, detail=f"Draft {draft_id} not found")
    corrected_data = json.loads(draft.corrected_financial_json or "{}")
    return {
        "draft_id":      draft.id,
        "status":        draft.status,
        "company_name":  draft.company_name,
        "corrected_data": corrected_data,
        "message": f"Draft {draft_id} verified. Call POST /finalize/{draft_id} to generate CAM.",
    }


@app.post("/finalize/{draft_id}", tags=["Analyst Workflow"])
async def finalize_evaluation(
    draft_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role(["manager", "analyst"])),
):
    """Stage 3: Score corrected data and generate CAM PDF (synchronous)."""
    draft = get_draft(db, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail=f"Draft {draft_id} not found")
    if draft.status not in ("verified", "pending_review"):
        raise HTTPException(status_code=400, detail=f"Cannot finalize draft with status '{draft.status}'.")

    financial_json = draft.corrected_financial_json or draft.raw_financial_json
    corrected_data = json.loads(financial_json or "{}")

    from models.ratio_calculator import calculate_ratios
    from models.financial_trend_analyzer import analyze_financial_trends
    from models.explainability_engine import generate_explanation
    from models.cam_generator import generate_cam
    from models.cam_pdf_generator import generate_cam_pdf
    from scoring_engine.rule_based_scoring import calculate_risk_score
    from scoring_engine.credit_decision import generate_credit_decision
    from scoring_engine.weighted_risk_model import calculate_weighted_risk
    from research_agent.news_agent import analyze_company_news
    from research_agent.external_risk_engine import adjust_score_with_external_risk
    from database.crud import save_evaluation
    from config import NEWS_API_KEY

    ratios          = calculate_ratios(corrected_data)
    trends          = analyze_financial_trends([corrected_data])
    risk_output     = calculate_risk_score(corrected_data, ratios, trends, draft.industry)
    news_output     = analyze_company_news(draft.company_name, api_key=NEWS_API_KEY)
    adjusted_output = adjust_score_with_external_risk(risk_output["risk_score"], news_output)
    weighted_score  = calculate_weighted_risk(corrected_data, ratios)
    decision_output = generate_credit_decision(adjusted_output["final_score"], corrected_data.get("revenue", 0))
    explanation     = generate_explanation(corrected_data, ratios, risk_output)
    cam_output      = generate_cam(draft.company_name, corrected_data, ratios, risk_output, decision_output, explanation)
    pdf_path        = generate_cam_pdf(draft.company_name, cam_output)

    evaluation_id = save_evaluation(db, {
        "company_name": draft.company_name,
        "revenue":      corrected_data.get("revenue"),
        "cogs":         corrected_data.get("cogs"),
        "net_profit":   corrected_data.get("net_profit"),
        "total_debt":   corrected_data.get("total_debt"),
        "risk_score":   adjusted_output.get("final_score", weighted_score),
        "decision":     decision_output.get("decision"),
        "explanation":  explanation.get("summary"),
        "pdf_path":     pdf_path,
    })
    finalize_draft(db, draft_id, evaluation_id)

    return {
        "evaluation_id":  evaluation_id,
        "draft_id":       draft_id,
        "company_name":   draft.company_name,
        "industry":       draft.industry,
        "financial_data": corrected_data,
        "ratios":         ratios,
        "base_risk":      risk_output,
        "news_risk":      news_output,
        "adjusted_risk":  adjusted_output,
        "weighted_score": weighted_score,
        "credit_decision": decision_output,
        "explanation":    explanation,
        "trends":         trends,
        "pdf_path":       pdf_path,
    }


@app.post("/finalize/{draft_id}/async", tags=["Analyst Workflow"])
async def finalize_evaluation_async(
    draft_id: int,
    user=Depends(require_role(["manager", "analyst"])),
):
    """Stage 3 (async): dispatch CAM generation to Celery worker."""
    from services.worker import finalize_draft_task
    task = finalize_draft_task.delay(draft_id)
    return {"task_id": task.id, "status": "processing", "poll_url": f"/status/{task.id}"}


@app.get("/draft/{draft_id}", tags=["Analyst Workflow"])
def get_draft_by_id(draft_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Fetch a single draft's details including raw extracted financial data."""
    draft = get_draft(db, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail=f"Draft {draft_id} not found")
    raw_data = json.loads(draft.raw_financial_json or "{}")
    corrected_data = json.loads(draft.corrected_financial_json or "{}")
    financial_data = corrected_data if corrected_data else raw_data
    return {
        "draft_id":     draft.id,
        "company_name": draft.company_name,
        "filename":     draft.company_name + ".pdf",
        "industry":     draft.industry,
        "status":       draft.status,
        "created_at":   str(draft.created_at),
        "financial_data": {
            "revenue":    financial_data.get("revenue", 0),
            "cogs":       financial_data.get("cogs", 0),
            "net_profit": financial_data.get("net_profit", 0),
            "total_debt": financial_data.get("total_debt", 0),
        },
    }


@app.get("/drafts/", tags=["Analyst Workflow"])
def list_drafts(db: Session = Depends(get_db), user=Depends(get_current_user)):
    drafts = get_all_drafts(db)
    return [
        {
            "draft_id":     d.id,
            "company_name": d.company_name,
            "status":       d.status,
            "industry":     d.industry,
            "created_at":   str(d.created_at),
        }
        for d in drafts
    ]


# ─────────────────────────────────────────────────────────────────────────────
# History & Reports
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/history/", response_model=List[HistoryItem], tags=["Reports"])
def get_history(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_all_evaluations(db)


@app.get("/evaluation/{evaluation_id}", tags=["Reports"])
def get_evaluation(evaluation_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    record = get_evaluation_by_id(evaluation_id)
    if not record:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return {
        "evaluation_id": record.id,
        "company_name":  record.company_name,
        "revenue":       record.revenue,
        "cogs":          record.cogs,
        "net_profit":    record.net_profit,
        "total_debt":    record.total_debt,
        "risk_score":    record.risk_score,
        "decision":      record.decision,
        "explanation":   record.explanation,
        "pdf_path":      record.pdf_path,
        "created_at":    str(record.created_at),
    }


@app.get("/download/{evaluation_id}", tags=["Reports"])
def download_report(evaluation_id: int, user=Depends(get_current_user)):
    record = get_evaluation_by_id(evaluation_id)
    if not record:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    # Try S3 pre-signed URL first
    if USE_S3_STORAGE:
        from services.storage_client import get_presigned_url
        s3_key = f"outputs/{record.company_name}_CAM.pdf"
        url = get_presigned_url(s3_key, expiry_seconds=300)
        if url:
            return RedirectResponse(url)

    # Fallback to local file
    import os
    from config import OUTPUT_DIR
    pdf_path = os.path.join(OUTPUT_DIR, f"{record.company_name}_CAM.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found on disk")
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"{record.company_name}_CAM.pdf",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Admin (Manager-only)
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/admin/users/", tags=["Admin"])
def list_users(db: Session = Depends(get_db), user=Depends(require_role(["manager"]))):
    """List all users. Manager only."""
    from database.crud import get_all_users
    users = get_all_users(db)
    return [{"id": u.id, "username": u.username, "role": u.role, "is_active": u.is_active} for u in users]


@app.post("/admin/users/", tags=["Admin"])
def add_user(
    username: str = Form(...),
    password: str = Form(...),
    role: str = Form("analyst"),
    db: Session = Depends(get_db),
    user=Depends(require_role(["manager"])),
):
    """Create a new user. Manager only."""
    if get_user_by_username(db, username):
        raise HTTPException(status_code=400, detail=f"Username '{username}' already exists.")
    new_user = create_user(db, username=username, password=password, role=role)
    return {"id": new_user.id, "username": new_user.username, "role": new_user.role}