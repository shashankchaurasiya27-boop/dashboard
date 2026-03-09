from models.industry_benchmarks import get_thresholds


def calculate_risk_score(
    financial_data: dict,
    ratios: dict,
    trends: dict | None = None,
    industry: str = "general",
) -> dict:
    """
    Calculate a base risk score (0-100) using industry-aware rules.
    Starts at 100 and applies penalty/bonus deductions.

    Parameters
    ----------
    financial_data : dict  — raw extracted financials
    ratios         : dict  — computed ratios (profit_margin, debt_to_revenue)
    trends         : dict  — YoY growth signals (optional)
    industry       : str   — sector name for benchmarking (default: "general")
    """
    t = get_thresholds(industry)
    score = 100
    risk_flags = []

    profit_margin = ratios.get("profit_margin", 0.0)
    debt_ratio    = ratios.get("debt_to_revenue", 0.0)

    # Profit margin rules (industry-calibrated thresholds)
    if profit_margin < t["profit_margin_weak"]:
        score -= 20
        risk_flags.append("Low profitability")
    elif profit_margin < t["profit_margin_moderate"]:
        score -= 10

    # Debt ratio rules (industry-calibrated thresholds)
    if debt_ratio > t["debt_ratio_excessive"]:
        score -= 40
        risk_flags.append("Excessive leverage")
    elif debt_ratio > t["debt_ratio_high"]:
        score -= 25
    elif debt_ratio > t["debt_ratio_moderate"]:
        score -= 10

    # YoY Trend adjustments
    if trends and "trend_analysis" not in trends:
        revenue_growth = trends.get("revenue_growth") or 0.0
        debt_growth    = trends.get("debt_growth")    or 0.0

        if revenue_growth > 0.20:
            score += 10
        elif revenue_growth < -0.10:
            score -= 10
            risk_flags.append("Declining revenue trend")

        if debt_growth > 0.30:
            score -= 15
            risk_flags.append("Rapidly increasing debt")

    score = max(min(score, 100), 0)

    return {
        "risk_score": score,
        "risk_flags": risk_flags,
        "industry":   industry,
    }