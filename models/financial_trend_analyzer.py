"""
models/financial_trend_analyzer.py

Calculates Year-over-Year (YoY) growth rates from a list of financial snapshots.
Requires at least 2 data points to produce meaningful trends.
"""
from utils.logger import logger


def _safe_growth(current: float, previous: float) -> float | None:
    """Return percentage growth ((current - previous) / |previous|).
    Returns None if the base is 0 to avoid ZeroDivisionError."""
    if not previous:
        return None
    return (current - previous) / abs(previous)


def analyze_financial_trends(financial_history: list) -> dict:
    """
    Compute YoY growth metrics from a list of financial dicts.

    Parameters
    ----------
    financial_history : list[dict]
        Ordered list (oldest → newest) of financial_data dicts.
        Each dict must have: revenue, net_profit, total_debt.

    Returns
    -------
    dict with keys:
        revenue_growth (float | None): fraction growth, e.g. 0.15 → 15%
        profit_growth  (float | None)
        debt_growth    (float | None)
        trend_quality  (str): "high_growth" | "growing" | "stable" | "declining"
        multi_year     (bool): True if more than 2 snapshots were analysed
    """
    if len(financial_history) < 2:
        logger.info("Trend analysis: insufficient data (< 2 snapshots).")
        return {"trend_analysis": "Insufficient data — upload multiple years to enable trends."}

    # Use the first and last snapshot for a simple YoY comparison
    oldest = financial_history[0]
    newest = financial_history[-1]

    revenue_growth = _safe_growth(
        newest.get("revenue", 0),
        oldest.get("revenue", 0),
    )
    profit_growth = _safe_growth(
        newest.get("net_profit", 0),
        oldest.get("net_profit", 0),
    )
    debt_growth = _safe_growth(
        newest.get("total_debt", 0),
        oldest.get("total_debt", 0),
    )

    # Qualitative label for revenue trend
    if revenue_growth is None:
        trend_quality = "stable"
    elif revenue_growth > 0.20:
        trend_quality = "high_growth"
    elif revenue_growth > 0:
        trend_quality = "growing"
    elif revenue_growth < -0.10:
        trend_quality = "declining"
    else:
        trend_quality = "stable"

    logger.info(
        f"Trends: rev_growth={revenue_growth}, profit_growth={profit_growth}, "
        f"debt_growth={debt_growth}, quality={trend_quality}"
    )

    return {
        "revenue_growth": revenue_growth,
        "profit_growth":  profit_growth,
        "debt_growth":    debt_growth,
        "trend_quality":  trend_quality,
        "multi_year":     len(financial_history) > 2,
    }