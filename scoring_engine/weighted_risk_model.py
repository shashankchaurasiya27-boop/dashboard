"""
scoring_engine/weighted_risk_model.py

Blended weighted risk scorer.

Weights (v2 — Phase 5):
  profitability  : 25%
  leverage       : 25%
  revenue_scale  : 20%
  bureau_score   : 30%   ← new CIBIL dimension

When no bureau data is provided the score falls back to equal-weight
profitability / leverage / revenue (same as v1 semantics).
"""

from models.industry_benchmarks import get_thresholds


def calculate_weighted_risk(
    financial_data: dict,
    ratios: dict,
    bureau_data: dict | None = None,
    industry: str = "general",
) -> int:
    """
    Calculate a blended weighted risk score (0–100).

    Parameters
    ----------
    financial_data : dict   — raw extracted financials
    ratios         : dict   — computed ratios
    bureau_data    : dict   — output from cibil_agent.fetch_credit_bureau_score()
    industry       : str    — sector for revenue threshold lookups

    Returns
    -------
    int — blended risk score (higher = better creditworthiness)
    """
    t = get_thresholds(industry)

    profit_margin = ratios.get("profit_margin", 0)
    debt_ratio    = ratios.get("debt_to_revenue", 0)
    revenue       = financial_data.get("revenue", 0) or 0

    # ── Profitability score ───────────────────────────────────────────────────
    if profit_margin > t["profit_margin_strong"]:
        profitability_score = 100
    elif profit_margin > t["profit_margin_moderate"]:
        profitability_score = 70
    else:
        profitability_score = 40

    # ── Leverage score ────────────────────────────────────────────────────────
    if debt_ratio < t["debt_ratio_low"]:
        leverage_score = 100
    elif debt_ratio < t["debt_ratio_moderate"]:
        leverage_score = 70
    else:
        leverage_score = 40

    # ── Revenue scale score ───────────────────────────────────────────────────
    if revenue > t["revenue_large"]:
        revenue_score = 100
    elif revenue > t["revenue_medium"]:
        revenue_score = 70
    else:
        revenue_score = 40

    # ── CIBIL / bureau score ──────────────────────────────────────────────────
    has_bureau = bureau_data and "cibil_score" in bureau_data
    if has_bureau:
        cibil = bureau_data["cibil_score"]
        # Map 300–900 → 0–100
        bureau_score = max(0, min(100, int((cibil - 300) / 6)))
        weights = {
            "profitability": 0.25,
            "leverage":      0.25,
            "revenue_scale": 0.20,
            "bureau":        0.30,
        }
        blended = (
            profitability_score * weights["profitability"]
            + leverage_score    * weights["leverage"]
            + revenue_score     * weights["revenue_scale"]
            + bureau_score      * weights["bureau"]
        )
    else:
        # Fall back to equal 3-way split (backward compatible)
        weights = {
            "profitability": 0.35,
            "leverage":      0.35,
            "revenue_scale": 0.30,
        }
        blended = (
            profitability_score * weights["profitability"]
            + leverage_score    * weights["leverage"]
            + revenue_score     * weights["revenue_scale"]
        )

    return int(blended)