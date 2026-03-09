"""
research_agent/news_agent.py

Fetches recent news articles about a company using the live NewsAPI and
scores their sentiment using TextBlob. Negative coverage translates into a
risk penalty that is injected into the credit evaluation pipeline.

Dependencies:  newsapi-python, textblob, python-dotenv (already installed)
API key:       Set NEWS_API_KEY in .env
"""

from utils.logger import logger

try:
    from newsapi import NewsApiClient
    NEWSAPI_AVAILABLE = True
except ImportError:
    NEWSAPI_AVAILABLE = False
    logger.warning("newsapi-python not installed — news agent disabled.")

try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False
    logger.warning("textblob not installed — sentiment scoring disabled.")

# Keywords that always flag an article as negative regardless of polarity
_HARD_NEGATIVE_KEYWORDS = [
    "fraud", "default", "bankruptcy", "scam", "litigation",
    "penalty", "investigation", "lawsuit", "money laundering",
    "wilful defaulter", "npa", "non-performing",
]

# Maximum news-based penalty deducted from the risk score
_MAX_NEWS_PENALTY = 30


def _keyword_penalty(text: str) -> float:
    """Return 1.0 if any hard-negative keyword is found in the text."""
    lowered = text.lower()
    for kw in _HARD_NEGATIVE_KEYWORDS:
        if kw in lowered:
            return 1.0
    return 0.0


def _sentiment_score(text: str) -> float:
    """
    Return the TextBlob polarity for a text snippet.
    Range: -1.0 (very negative) → 1.0 (very positive).
    Returns 0.0 if TextBlob is not available.
    """
    if not TEXTBLOB_AVAILABLE:
        return 0.0
    return TextBlob(text).sentiment.polarity


def analyze_company_news(company_name: str, api_key: str = "") -> dict:
    """
    Fetch and analyse recent news about ``company_name``.

    Returns
    -------
    dict with keys:
        news_risk_score (int): penalty in range [0, 30] to subtract from risk score
        news_flags      (list[str]): negative headline summaries flagged for the CAM
        sentiment       (str): "positive" | "neutral" | "negative"
        headlines       (list[str]): raw headlines fetched (up to 10)
    """
    base_result = {
        "news_risk_score": 0,
        "news_flags": [],
        "sentiment": "neutral",
        "headlines": [],
    }

    if not NEWSAPI_AVAILABLE:
        logger.warning("News agent skipped: newsapi-python not available.")
        return base_result

    if not api_key:
        logger.warning("News agent skipped: NEWS_API_KEY not configured.")
        return base_result

    try:
        client = NewsApiClient(api_key=api_key)
        response = client.get_everything(
            q=company_name,
            language="en",
            sort_by="relevancy",
            page_size=10,
        )

        articles = response.get("articles", [])
        if not articles:
            logger.info(f"No news articles found for '{company_name}'.")
            return base_result

        headlines = [
            a.get("title", "") or a.get("description", "")
            for a in articles
            if a.get("title") or a.get("description")
        ]
        base_result["headlines"] = headlines
        logger.info(f"Fetched {len(headlines)} articles for '{company_name}'.")

        # ── Score each headline ───────────────────────────────────────────────
        negative_scores: list[float] = []
        negative_flags: list[str] = []

        for headline in headlines:
            kw_pen  = _keyword_penalty(headline)
            polarity = _sentiment_score(headline)

            # Treat keyword hit OR strongly negative polarity as a red flag
            is_negative = kw_pen > 0 or polarity < -0.15

            if is_negative:
                negative_scores.append(abs(polarity) + kw_pen)
                negative_flags.append(headline[:160])   # truncate for CAM

        # ── Aggregate into a final risk penalty (0–30) ────────────────────────
        if negative_scores:
            avg_negativity       = sum(negative_scores) / len(negative_scores)
            raw_penalty          = avg_negativity * len(negative_scores) * 5
            news_risk_score      = int(min(raw_penalty, _MAX_NEWS_PENALTY))
            sentiment            = "negative"
        elif all(_sentiment_score(h) >= 0.1 for h in headlines):
            news_risk_score = 0
            sentiment       = "positive"
        else:
            news_risk_score = 0
            sentiment       = "neutral"

        logger.info(
            f"News analysis complete for '{company_name}': "
            f"sentiment={sentiment}, penalty={news_risk_score}, "
            f"flags={len(negative_flags)}"
        )

        return {
            "news_risk_score": news_risk_score,
            "news_flags":      negative_flags,
            "sentiment":       sentiment,
            "headlines":       headlines,
        }

    except Exception as e:
        logger.error(f"News agent error for '{company_name}': {e}")
        return base_result