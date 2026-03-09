"""
services/draft_pipeline.py

Handles the first stage of the Human-in-the-Loop workflow:
  1. Save the uploaded PDF.
  2. Extract raw text.
  3. Run financial extraction (LLM or regex).
  4. Persist a DraftEvaluation record (status = pending_review).
  5. Return extracted data to the analyst for correction.
"""

from sqlalchemy.orm import Session

from config import USE_LLM_EXTRACTOR, GEMINI_API_KEY
from ingestion.file_handler import save_uploaded_file
from ingestion.pdf_parser import extract_text_from_pdf
from ingestion.financial_extractor import extract_financial_data
from ingestion.llm_extractor import extract_with_llm
from database.crud import create_draft
from utils.logger import logger


class DraftPipeline:
    """Extraction-only pipeline that produces a DraftEvaluation for analyst review."""

    def __init__(self, db: Session):
        self.db = db

    async def run(self, file, industry: str = "general") -> dict:
        """
        Save the file, extract financial data, create a draft DB record.

        Returns a dict the API can send straight back to the analyst.
        """
        # 1. Save & parse
        file_location  = await save_uploaded_file(file)
        extracted_text = extract_text_from_pdf(file_location)

        company_name = file.filename.rsplit(".", 1)[0].replace("_", " ").strip()

        # 2. Financial extraction (LLM preferred, regex fallback)
        financial_data = None
        if USE_LLM_EXTRACTOR:
            logger.info("Draft pipeline: attempting LLM extraction...")
            financial_data = extract_with_llm(extracted_text, GEMINI_API_KEY)
            if financial_data:
                logger.info("Draft pipeline: LLM extraction succeeded.")
            else:
                logger.warning("Draft pipeline: LLM returned None — falling back to regex.")

        if financial_data is None:
            logger.info("Draft pipeline: using regex extractor.")
            financial_data = extract_financial_data(extracted_text)

        # 3. Persist draft
        draft = create_draft(
            db=self.db,
            company_name=company_name,
            file_path=file_location,
            extracted_text_preview=extracted_text,
            financial_data=financial_data,
            industry=industry,
        )

        logger.info(f"Created draft ID={draft.id} for '{company_name}' (status: pending_review)")

        return {
            "draft_id":       draft.id,
            "company_name":   company_name,
            "status":         draft.status,
            "industry":       draft.industry,
            "financial_data": financial_data,
            "message":        (
                "Draft created. Review the extracted financial data below and submit "
                "corrections via PUT /verify/{draft_id} before finalizing."
            ),
        }
