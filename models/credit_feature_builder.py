"""
models/credit_feature_builder.py

Transforms raw financial data, computed ratios, trend analysis, and risk
signals into a clean, normalized feature dictionary that can be consumed
by any scoring engine, ML model, or explainability layer.
"""

from __future__ import annotations

from typing import Any


# ──────────────────────────────────────────────────────────────────────────────
# Helper thresholds (centralised so scorers stay in sync with the builder)
# ──────────────────────────────────────────────────────────────────────────────

_PROFIT_MARGIN_STRONG   = 0.20   # > 20 % → strong
_PROFIT_MARGIN_MODERATE = 0.10   # 10–20 % → moderate; < 10 % → weak

_DEBT_RATIO_LOW         = 0.50   # < 0.5 → low leverage
_DEBT_RATIO_MODERATE    = 1.00   # 0.5–1.0 → moderate

_REVENUE_LARGE          = 100_000   # > 100 k → large enterprise
_REVENUE_MEDIUM         = 50_000    # > 50 k  → SME

_LIQUIDITY_HEALTHY      = 1.50   # current ratio ≥ 1.5 is healthy
_INTEREST_COVER_SAFE    = 3.00   # EBIT / interest ≥ 3 is safe

_GROWTH_STRONG          = 0.20   # > 20 % revenue growth


class CreditFeatureBuilder:
    """
    Assembles a normalised feature vector from the various intermediate
    outputs produced by the credit evaluation pipeline.

    Typical usage::

        builder = CreditFeatureBuilder(
            financial_data=financial_data,
            ratios=ratios,
            trends=trends,
            risk_output=risk_output,
            news_output=news_output,
            adjusted_output=adjusted_output,
        )
        features = builder.build()

    The returned dictionary is the single source of truth for all downstream
    scoring and explainability components.
    """

    def __init__(
        self,
        financial_data: dict[str, Any],
        ratios: dict[str, Any],
        trends: dict[str, Any] | None = None,
        risk_output: dict[str, Any] | None = None,
        news_output: dict[str, Any] | None = None,
        adjusted_output: dict[str, Any] | None = None,
    ) -> None:
        self._fd  = financial_data or {}
        self._r   = ratios or {}
        self._t   = trends or {}
        self._ro  = risk_output or {}
        self._no  = news_output or {}
        self._ao  = adjusted_output or {}

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    def build(self) -> dict[str, Any]:
        """
        Return the complete feature dictionary.

        Groups
        ------
        raw           – verbatim values from the financial statement
        ratios        – derived financial ratios
        scale         – size / scale categorisation flags
        quality       – categorical quality labels per dimension
        trends        – year-on-year growth metrics
        risk          – flags and scores from the risk engine
        news          – external sentiment signals
        composite     – blended / aggregate features
        """
        features: dict[str, Any] = {}
        features.update(self._raw_features())
        features.update(self._ratio_features())
        features.update(self._scale_features())
        features.update(self._quality_features())
        features.update(self._trend_features())
        features.update(self._risk_features())
        features.update(self._news_features())
        features.update(self._composite_features(features))
        return features

    # ──────────────────────────────────────────────────────────────────────────
    # Feature groups
    # ──────────────────────────────────────────────────────────────────────────

    def _raw_features(self) -> dict[str, Any]:
        """Direct readings from the financial statement."""
        return {
            "revenue":              self._fd.get("revenue", 0),
            "net_profit":           self._fd.get("net_profit", 0),
            "total_debt":           self._fd.get("total_debt", 0),
            "total_assets":         self._fd.get("total_assets", 0),
            "total_liabilities":    self._fd.get("total_liabilities", 0),
            "current_assets":       self._fd.get("current_assets", 0),
            "current_liabilities":  self._fd.get("current_liabilities", 0),
            "ebit":                 self._fd.get("ebit", 0),
            "interest_expense":     self._fd.get("interest_expense", 0),
            "cash":                 self._fd.get("cash", 0),
        }

    def _ratio_features(self) -> dict[str, Any]:
        """Pre-computed and derived ratios."""
        profit_margin = self._r.get("profit_margin", 0)
        debt_to_rev   = self._r.get("debt_to_revenue", 0)

        # Additional ratios computed here if not already present
        total_assets  = self._fd.get("total_assets", 0)
        total_debt    = self._fd.get("total_debt", 0)
        cur_assets    = self._fd.get("current_assets", 0)
        cur_liab      = self._fd.get("current_liabilities", 0)
        ebit          = self._fd.get("ebit", 0)
        interest      = self._fd.get("interest_expense", 0)

        debt_to_assets   = (total_debt / total_assets) if total_assets > 0 else 0.0
        current_ratio    = (cur_assets / cur_liab)     if cur_liab > 0 else 0.0
        interest_coverage = (ebit / interest)          if interest > 0 else 0.0

        return {
            "ratio_profit_margin":     profit_margin,
            "ratio_debt_to_revenue":   debt_to_rev,
            "ratio_debt_to_assets":    debt_to_assets,
            "ratio_current_ratio":     current_ratio,
            "ratio_interest_coverage": interest_coverage,
        }

    def _scale_features(self) -> dict[str, Any]:
        """Categorical size / scale flags (useful as ML one-hot inputs)."""
        revenue = self._fd.get("revenue", 0)

        if revenue > _REVENUE_LARGE:
            scale = "large"
        elif revenue > _REVENUE_MEDIUM:
            scale = "medium"
        else:
            scale = "small"

        return {
            "scale_category":      scale,
            "scale_is_large":      scale == "large",
            "scale_is_medium":     scale == "medium",
            "scale_is_small":      scale == "small",
        }

    def _quality_features(self) -> dict[str, Any]:
        """
        Human-readable quality labels for each key financial dimension.
        These feed both the explainability engine and the scoring model.
        """
        profit_margin = self._r.get("profit_margin", 0)
        debt_ratio    = self._r.get("debt_to_revenue", 0)
        cur_assets    = self._fd.get("current_assets", 0)
        cur_liab      = self._fd.get("current_liabilities", 0)
        ebit          = self._fd.get("ebit", 0)
        interest      = self._fd.get("interest_expense", 0)

        # Profitability quality
        if profit_margin > _PROFIT_MARGIN_STRONG:
            profitability_quality = "strong"
        elif profit_margin > _PROFIT_MARGIN_MODERATE:
            profitability_quality = "moderate"
        else:
            profitability_quality = "weak"

        # Leverage quality
        if debt_ratio < _DEBT_RATIO_LOW:
            leverage_quality = "low"
        elif debt_ratio < _DEBT_RATIO_MODERATE:
            leverage_quality = "moderate"
        else:
            leverage_quality = "high"

        # Liquidity quality
        current_ratio = (cur_assets / cur_liab) if cur_liab > 0 else 0.0
        if current_ratio == 0.0 and cur_assets == 0.0:
            liquidity_quality = "unknown"
        elif current_ratio >= _LIQUIDITY_HEALTHY:
            liquidity_quality = "healthy"
        else:
            liquidity_quality = "stressed"

        # Debt-service quality
        interest_coverage = (ebit / interest) if interest > 0 else 0.0
        if interest_coverage == 0.0 and ebit == 0.0:
            debt_service_quality = "unknown"
        elif interest_coverage >= _INTEREST_COVER_SAFE:
            debt_service_quality = "comfortable"
        else:
            debt_service_quality = "constrained"

        return {
            "quality_profitability":  profitability_quality,
            "quality_leverage":       leverage_quality,
            "quality_liquidity":      liquidity_quality,
            "quality_debt_service":   debt_service_quality,
        }

    def _trend_features(self) -> dict[str, Any]:
        """Year-on-year growth rates and qualitative trend labels."""
        rev_growth    = self._t.get("revenue_growth", 0)
        profit_growth = self._t.get("profit_growth", 0)
        debt_growth   = self._t.get("debt_growth", 0)

        has_trends = bool(self._t) and "trend_analysis" not in self._t

        if not has_trends:
            return {
                "trend_revenue_growth":  None,
                "trend_profit_growth":   None,
                "trend_debt_growth":     None,
                "trend_revenue_quality": "unknown",
            }

        if rev_growth > _GROWTH_STRONG:
            revenue_trend_quality = "high_growth"
        elif rev_growth > 0:
            revenue_trend_quality = "growing"
        else:
            revenue_trend_quality = "declining"

        return {
            "trend_revenue_growth":  rev_growth,
            "trend_profit_growth":   profit_growth,
            "trend_debt_growth":     debt_growth,
            "trend_revenue_quality": revenue_trend_quality,
        }

    def _risk_features(self) -> dict[str, Any]:
        """Risk flags and raw score from the rule-based scoring engine."""
        risk_score  = self._ro.get("risk_score", 0)
        risk_flags  = self._ro.get("risk_flags", [])

        return {
            "risk_base_score":        risk_score,
            "risk_flag_count":        len(risk_flags),
            "risk_flags":             risk_flags,
            "risk_has_flags":         len(risk_flags) > 0,
            "risk_adjusted_score":    self._ao.get("final_score", risk_score),
        }

    def _news_features(self) -> dict[str, Any]:
        """External / sentiment signals from the news research agent."""
        sentiment   = self._no.get("sentiment", "neutral")
        news_score  = self._no.get("news_risk_score", 0)
        headlines   = self._no.get("headlines", [])

        return {
            "news_sentiment":        sentiment,
            "news_risk_score":       news_score,
            "news_headline_count":   len(headlines),
            "news_is_negative":      sentiment == "negative",
            "news_is_positive":      sentiment == "positive",
        }

    def _composite_features(self, partial: dict[str, Any]) -> dict[str, Any]:
        """
        Aggregate / blended features derived from the groups above.
        Called last so it can reference already-computed features.
        """
        # Overall financial health score (0–100)
        pm  = partial.get("ratio_profit_margin", 0) or 0
        dr  = partial.get("ratio_debt_to_revenue", 0) or 0
        rev = partial.get("revenue", 0) or 0

        profitability_score = (
            100 if pm  > _PROFIT_MARGIN_STRONG   else
             70 if pm  > _PROFIT_MARGIN_MODERATE else 40
        )
        leverage_score = (
            100 if dr  < _DEBT_RATIO_LOW     else
             70 if dr  < _DEBT_RATIO_MODERATE else 40
        )
        revenue_score = (
            100 if rev > _REVENUE_LARGE  else
             70 if rev > _REVENUE_MEDIUM else 40
        )

        composite_score = int(
            profitability_score * 0.35
            + leverage_score    * 0.35
            + revenue_score     * 0.30
        )

        # Overall risk tier
        adj_score = partial.get("risk_adjusted_score", composite_score)
        if adj_score >= 75:
            risk_tier = "low"
        elif adj_score >= 50:
            risk_tier = "medium"
        else:
            risk_tier = "high"

        return {
            "composite_score":           composite_score,
            "composite_profitability":   profitability_score,
            "composite_leverage":        leverage_score,
            "composite_revenue":         revenue_score,
            "composite_risk_tier":       risk_tier,
        }


# ──────────────────────────────────────────────────────────────────────────────
# Convenience function
# ──────────────────────────────────────────────────────────────────────────────

def build_credit_features(
    financial_data: dict,
    ratios: dict,
    trends: dict | None = None,
    risk_output: dict | None = None,
    news_output: dict | None = None,
    adjusted_output: dict | None = None,
) -> dict:
    """
    Functional wrapper around :class:`CreditFeatureBuilder`.

    Example::

        features = build_credit_features(financial_data, ratios, trends,
                                         risk_output, news_output, adjusted_output)
    """
    return CreditFeatureBuilder(
        financial_data=financial_data,
        ratios=ratios,
        trends=trends,
        risk_output=risk_output,
        news_output=news_output,
        adjusted_output=adjusted_output,
    ).build()
