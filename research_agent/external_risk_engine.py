"""
research_agent/external_risk_engine.py

Applies news-based risk adjustments to the base credit risk score.
"""
from utils.logger import logger


def adjust_score_with_external_risk(base_score: int, news_risk: dict) -> dict:
    """
    Deduct the news risk penalty from the base score.

    Parameters
    ----------
    base_score : int
        The credit score produced by the internal scoring engine.
    news_risk : dict
        The output from ``analyze_company_news()``.
        Keys: news_risk_score, news_flags, sentiment, headlines.

    Returns
    -------
    dict with keys:
        final_score     (int): adjusted score clamped to [0, 100]
        external_flags  (list): flagged negative headlines
        news_sentiment  (str): "positive" | "neutral" | "negative"
    """
    penalty        = int(news_risk.get("news_risk_score", 0))
    external_flags = list(news_risk.get("news_flags", []))
    sentiment      = news_risk.get("sentiment", "neutral")

    adjusted_score = max(base_score - penalty, 0)

    if penalty > 0:
        logger.info(
            f"External risk adjustment: base={base_score}, "
            f"penalty={penalty}, final={adjusted_score}, "
            f"sentiment={sentiment}"
        )

    return {
        "final_score":    adjusted_score,
        "external_flags": external_flags,
        "news_sentiment": sentiment,
    }