"""
services/credit_pipeline.py

Orchestrates the end-to-end credit evaluation pipeline.
Encapsulates all steps from file ingestion to CAM PDF generation,
keeping the FastAPI routes in main.py thin and readable.
"""

from sqlalchemy.orm import Session

from config import USE_LLM_EXTRACTOR, GEMINI_API_KEY, NEWS_API_KEY
from ingestion.file_handler import save_uploaded_file
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
from research_agent.cibil_agent import fetch_credit_bureau_score
from database.crud import save_evaluation
from utils.logger import logger


class CreditPipeline:
    """
    Orchestrates the full credit evaluation lifecycle for a single uploaded
    financial document.

    Usage::

        pipeline = CreditPipeline(db_session)
        result = await pipeline.run(uploaded_file)
    """

    def __init__(self, db: Session):
        self.db = db

    async def run(self, file, industry: str = "general", pan_number: str = "") -> dict:
        """
        Execute the credit pipeline for the given UploadFile object.

        Steps:
            1. Save and parse the uploaded PDF.
            2. Extract financial data and compute ratios.
            3. Run rule-based risk scoring.
            4. Perform external/news-based risk adjustment.
            5. Run the weighted risk model for a blended score.
            6. Generate a credit decision and natural-language explanation.
            7. Build the CAM and export it as a PDF.
            8. Persist the evaluation to the database.

        Returns:
            dict: A structured evaluation result containing all intermediate
                  and final outputs from every pipeline stage.
        """
        # ── 1. Ingest ──────────────────────────────────────────────────────────
        file_location  = await save_uploaded_file(file)
        extracted_text = extract_text_from_pdf(file_location)

        # Derive a clean company name from the uploaded filename
        company_name = file.filename.rsplit(".", 1)[0].replace("_", " ").strip()

        # ── 1b. Financial extraction — LLM preferred, regex as fallback ────────
        financial_data = None
        if USE_LLM_EXTRACTOR:
            logger.info("Attempting LLM-based financial extraction...")
            financial_data = extract_with_llm(extracted_text, GEMINI_API_KEY)
            if financial_data:
                logger.info("LLM extraction succeeded.")
            else:
                logger.warning("LLM extraction returned None — falling back to regex.")

        if financial_data is None:
            logger.info("Using regex financial extractor.")
            financial_data = extract_financial_data(extracted_text)

        # ── 2. Ratios ──────────────────────────────────────────────────────────
        ratios = calculate_ratios(financial_data)

        # ── 3. Rule-based scoring ──────────────────────────────────────────────
        financial_history = [financial_data]
        trends = analyze_financial_trends(financial_history)
        risk_output = calculate_risk_score(financial_data, ratios, trends, industry)

        # ── 4. External / news risk adjustment ────────────────────────────────
        news_output = analyze_company_news(company_name, api_key=NEWS_API_KEY)
        adjusted_output = adjust_score_with_external_risk(
            risk_output["risk_score"], news_output
        )

        # ── 5. CIBIL / credit bureau score ──────────────────────────────────────────
        bureau_data = fetch_credit_bureau_score(company_name, pan_number)

        # ── 6. Blended weighted score ─────────────────────────────────────────────────
        weighted_score = calculate_weighted_risk(financial_data, ratios, bureau_data, industry)

        # ── 6. Credit decision & explanation ─────────────────────────────────
        decision_output = generate_credit_decision(
            weighted_score, financial_data.get("revenue", 0)
        )
        explanation = generate_explanation(financial_data, ratios, risk_output)

        # ── 7. CAM generation ─────────────────────────────────────────────────
        cam_output = generate_cam(
            company_name,
            financial_data,
            ratios,
            risk_output,
            decision_output,
            explanation,
        )
        pdf_path = generate_cam_pdf(company_name, cam_output)

        # ── 8. Persist ────────────────────────────────────────────────────────
        evaluation_id = save_evaluation(
            self.db,
            {
                "company_name": company_name,
                "revenue":      financial_data.get("revenue"),
                "net_profit":   financial_data.get("net_profit"),
                "total_debt":   financial_data.get("total_debt"),
                "risk_score":   adjusted_output.get("final_score", weighted_score),
                "decision":     decision_output.get("decision"),
                "explanation":  explanation.get("summary"),
                "pdf_path":     pdf_path,
            },
        )

        # ── Return full result ─────────────────────────────────────────────────
        return {
            "evaluation_id":  evaluation_id,
            "filename":       file.filename,
            "company_name":   company_name,
            "financial_data": financial_data,
            "ratios":         ratios,
            "base_risk":      risk_output,
            "news_risk":      news_output,
            "adjusted_risk":  adjusted_output,
            "bureau_data":    bureau_data,
            "weighted_score": weighted_score,
            "trends":         trends,
            "credit_decision": decision_output,
            "explanation":    explanation,
            "pdf_path":       pdf_path,
        }
