"""
research_agent/cibil_agent.py

Credit Bureau / CIBIL integration layer.

- Runs as a mock stub when CIBIL_API_KEY is absent (safe for dev / demos).
- Provides a deterministic mock score based on the company name hash so the
  same company always gets the same score in testing.
- Real integration: set CIBIL_API_KEY in `.env` and replace the mock block
  with a live HTTP call to your bureau API.

CIBIL Score Scale  (india standard)
  300 – 549  → Poor    (High risk)
  550 – 649  → Fair    (Moderate risk)
  650 – 749  → Good    (Low-moderate risk)
  750 – 900  → Excellent (Low risk)
"""

import hashlib
from config import CIBIL_API_KEY
from utils.logger import logger


# ── Score classification ──────────────────────────────────────────────────────
def classify_cibil(score: int) -> dict:
    if score >= 750:
        return {"rating": "Excellent", "risk_level": "Low",          "weight_modifier": 1.10}
    elif score >= 650:
        return {"rating": "Good",      "risk_level": "Low-Moderate",  "weight_modifier": 1.00}
    elif score >= 550:
        return {"rating": "Fair",      "risk_level": "Moderate",      "weight_modifier": 0.90}
    else:
        return {"rating": "Poor",      "risk_level": "High",          "weight_modifier": 0.75}


# ── Mock deterministic score ──────────────────────────────────────────────────
def _mock_score(company_name: str, pan_number: str = "") -> int:
    """Derive a deterministic mock score from name + PAN so tests are repeatable."""
    seed = (company_name or "unknown").lower() + (pan_number or "")
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    # Map into 550–850 so demos always look plausible
    return 550 + (h % 300)


# ── Public entry point ────────────────────────────────────────────────────────
def fetch_credit_bureau_score(company_name: str, pan_number: str = "") -> dict:
    """
    Fetch (or mock) the CIBIL / credit bureau score for a company.

    Returns
    -------
    {
        "cibil_score":     750,
        "rating":          "Excellent",
        "risk_level":      "Low",
        "weight_modifier": 1.10,       # multiplier applied to weighted risk
        "default_history": [],
        "source":          "mock" | "live",
    }
    """
    if not CIBIL_API_KEY:
        score = _mock_score(company_name, pan_number)
        classification = classify_cibil(score)
        logger.info(
            f"[CIBIL] Mock score for '{company_name}' "
            f"(PAN={pan_number or 'N/A'}): {score} ({classification['rating']})"
        )
        return {
            "cibil_score":     score,
            "default_history": [],
            "source":          "mock",
            **classification,
        }

    # ── Live API integration (placeholder for real bureau call) ──────────────
    try:
        import httpx
        response = httpx.post(
            "https://api.cibil-bureau.example.com/v1/score",
            json={"company": company_name, "pan": pan_number},
            headers={"Authorization": f"Bearer {CIBIL_API_KEY}"},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        score = data.get("score", 600)
        classification = classify_cibil(score)
        logger.info(f"[CIBIL] Live score for '{company_name}': {score}")
        return {
            "cibil_score":     score,
            "default_history": data.get("defaults", []),
            "source":          "live",
            **classification,
        }
    except Exception as exc:
        logger.warning(f"[CIBIL] Live API failed ({exc}), using mock.")
        score = _mock_score(company_name, pan_number)
        classification = classify_cibil(score)
        return {"cibil_score": score, "default_history": [], "source": "mock_fallback", **classification}
