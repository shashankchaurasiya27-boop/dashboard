"""
ingestion/llm_extractor.py

Uses Google Gemini to extract structured financial data from raw PDF text.
Falls back gracefully if the API key is missing or the call fails.
"""

import json
import re
from utils.logger import logger

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-genai not installed — LLM extractor disabled.")

# Fields the LLM must always return
_REQUIRED_FIELDS = [
    "revenue", "net_profit", "total_debt",
    "total_assets", "total_liabilities",
    "current_assets", "current_liabilities",
    "ebit", "interest_expense", "cash",
]

_PROMPT_TEMPLATE = """
You are a financial data extraction assistant for an Indian credit appraisal system.

Extract the following fields from the text below and return ONLY a valid JSON object.
All values must be in plain numbers (Indian Rupees). Convert Lakhs × 100000, Crores × 10000000.
If a field cannot be found, use 0.

Fields to extract:
{fields}

Text:
\"\"\"
{text}
\"\"\"

Return ONLY a JSON object with these exact keys and no other text.
""".strip()


def extract_with_llm(text: str, api_key: str) -> dict | None:
    """
    Call Gemini to extract financial data from ``text``.

    Returns a dict with all required fields on success, or ``None`` on failure.
    The caller should fall back to the regex extractor when ``None`` is returned.
    """
    if not GENAI_AVAILABLE:
        logger.warning("LLM extraction skipped: google-genai not available.")
        return None

    if not api_key:
        logger.warning("LLM extraction skipped: GEMINI_API_KEY not set.")
        return None

    if not text or len(text.strip()) < 50:
        logger.warning("LLM extraction skipped: text too short.")
        return None

    try:
        client = genai.Client(api_key=api_key)

        prompt = _PROMPT_TEMPLATE.format(
            fields="\n".join(f"- {f}" for f in _REQUIRED_FIELDS),
            text=text[:8000],   # cap to stay within token limits
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        raw = response.text.strip()

        # Strip markdown fences if Gemini wraps in ```json ... ```
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        data = json.loads(raw)

        # Ensure all required fields are present and numeric
        result: dict = {}
        for field in _REQUIRED_FIELDS:
            raw_val = data.get(field, 0)
            try:
                result[field] = float(raw_val)
            except (TypeError, ValueError):
                result[field] = 0.0

        logger.info(f"LLM extractor succeeded. Fields found: "
                    f"{[k for k, v in result.items() if v != 0.0]}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"LLM extraction: could not parse JSON response — {e}")
    except Exception as e:
        logger.error(f"LLM extraction failed: {e}")

    return None
