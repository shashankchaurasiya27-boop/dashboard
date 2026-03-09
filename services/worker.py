"""
services/worker.py

Celery application for background task processing.
Heavy pipeline work (LLM calls, PDF generation) runs here so the API
returns immediately and the frontend can poll /status/{task_id}.

Start the worker with:
    celery -A services.worker worker --loglevel=info
"""

import json
from celery import Celery
from config import CELERY_BROKER_URL, CELERY_RESULT_URL
from utils.logger import logger

celery_app = Celery(
    "intelli_credit",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)


# ─────────────────────────────────────────────────────────────────────────────
# Task 1: Full express evaluation
# ─────────────────────────────────────────────────────────────────────────────
@celery_app.task(bind=True, name="tasks.run_evaluation")
def run_evaluation_task(self, file_path: str, company_name: str, industry: str = "general"):
    """
    Background task for the full /upload/ pipeline.
    Called with file already saved locally (and mirrored to S3).
    Returns the final evaluation dict serialised as JSON.
    """
    from ingestion.pdf_parser import extract_text_from_pdf
    from ingestion.financial_extractor import extract_financial_data
    from ingestion.llm_extractor import extract_with_llm
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
    from database.db import SessionLocal
    from config import USE_LLM_EXTRACTOR, GEMINI_API_KEY, NEWS_API_KEY

    self.update_state(state="PROGRESS", meta={"step": "Extracting text"})
    extracted_text = extract_text_from_pdf(file_path)

    self.update_state(state="PROGRESS", meta={"step": "Extracting financials"})
    financial_data = None
    if USE_LLM_EXTRACTOR:
        financial_data = extract_with_llm(extracted_text, GEMINI_API_KEY)
    if financial_data is None:
        financial_data = extract_financial_data(extracted_text)

    self.update_state(state="PROGRESS", meta={"step": "Scoring"})
    ratios        = calculate_ratios(financial_data)
    trends        = analyze_financial_trends([financial_data])
    risk_output   = calculate_risk_score(financial_data, ratios, trends, industry)
    news_output   = analyze_company_news(company_name, api_key=NEWS_API_KEY)
    adjusted      = adjust_score_with_external_risk(risk_output["risk_score"], news_output)

    # PIPELINE FIX: fetch CIBIL score (was missing from async worker)
    from research_agent.cibil_agent import fetch_credit_bureau_score
    bureau_data   = fetch_credit_bureau_score(company_name, "")
    weighted      = calculate_weighted_risk(financial_data, ratios, bureau_data, industry)

    decision      = generate_credit_decision(adjusted["final_score"], financial_data.get("revenue", 0))
    explanation   = generate_explanation(financial_data, ratios, risk_output)

    self.update_state(state="PROGRESS", meta={"step": "Generating CAM PDF"})
    cam_output  = generate_cam(company_name, financial_data, ratios, risk_output, decision, explanation)
    pdf_path    = generate_cam_pdf(company_name, cam_output)

    db = SessionLocal()
    try:
        evaluation_id = save_evaluation(db, {
            "company_name": company_name,
            "revenue":      financial_data.get("revenue"),
            "cogs":         financial_data.get("cogs"),   # COGS now persisted
            "net_profit":   financial_data.get("net_profit"),
            "total_debt":   financial_data.get("total_debt"),
            "risk_score":   adjusted.get("final_score", weighted),
            "decision":     decision.get("decision"),
            "explanation":  explanation.get("summary"),
            "pdf_path":     pdf_path,
        })
    finally:
        db.close()

    logger.info(f"[Worker] Evaluation complete: ID={evaluation_id}, company={company_name}")
    return {
        "evaluation_id":   evaluation_id,
        "company_name":    company_name,
        "financial_data":  financial_data,
        "ratios":          ratios,
        "base_risk":       risk_output,
        "news_risk":       news_output,
        "adjusted_risk":   adjusted,
        "bureau_data":     bureau_data,
        "weighted_score":  weighted,
        "credit_decision": decision,
        "explanation":     explanation,
        "trends":          trends,
        "pdf_path":        pdf_path,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Task 2: Finalize draft
# ─────────────────────────────────────────────────────────────────────────────
@celery_app.task(bind=True, name="tasks.finalize_draft")
def finalize_draft_task(self, draft_id: int):
    """
    Background task for POST /finalize/{draft_id}.
    Runs the scoring pipeline on verified data and generates the CAM PDF.
    """
    import json as _json
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
    from database.crud import get_draft, save_evaluation, finalize_draft
    from database.db import SessionLocal
    from config import NEWS_API_KEY

    db = SessionLocal()
    try:
        self.update_state(state="PROGRESS", meta={"step": "Loading draft"})
        draft = get_draft(db, draft_id)
        if not draft:
            raise ValueError(f"Draft {draft_id} not found")

        financial_data = _json.loads(draft.corrected_financial_json or draft.raw_financial_json or "{}")
        industry = draft.industry or "general"

        self.update_state(state="PROGRESS", meta={"step": "Scoring"})
        ratios      = calculate_ratios(financial_data)
        trends      = analyze_financial_trends([financial_data])
        risk_output = calculate_risk_score(financial_data, ratios, trends, industry)
        news_output = analyze_company_news(draft.company_name, api_key=NEWS_API_KEY)
        adjusted    = adjust_score_with_external_risk(risk_output["risk_score"], news_output)
        weighted    = calculate_weighted_risk(financial_data, ratios)
        decision    = generate_credit_decision(adjusted["final_score"], financial_data.get("revenue", 0))
        explanation = generate_explanation(financial_data, ratios, risk_output)

        self.update_state(state="PROGRESS", meta={"step": "Generating CAM"})
        cam_output = generate_cam(draft.company_name, financial_data, ratios, risk_output, decision, explanation)
        pdf_path   = generate_cam_pdf(draft.company_name, cam_output)

        evaluation_id = save_evaluation(db, {
            "company_name": draft.company_name,
            "revenue":      financial_data.get("revenue"),
            "net_profit":   financial_data.get("net_profit"),
            "total_debt":   financial_data.get("total_debt"),
            "risk_score":   adjusted.get("final_score", weighted),
            "decision":     decision.get("decision"),
            "explanation":  explanation.get("summary"),
            "pdf_path":     pdf_path,
        })
        finalize_draft(db, draft_id, evaluation_id)
        logger.info(f"[Worker] Draft {draft_id} finalized → Evaluation #{evaluation_id}")

        return {
            "evaluation_id": evaluation_id,
            "draft_id":      draft_id,
            "company_name":  draft.company_name,
            "industry":      industry,
            "adjusted_risk": adjusted,
            "credit_decision": decision,
            "pdf_path":      pdf_path,
        }
    finally:
        db.close()
