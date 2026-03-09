"""
models/industry_benchmarks.py

Sector-specific thresholds for the scoring engine.
The rule-based scorer uses these to adjust penalty/bonus cutpoints
relative to typical performance in a given industry.
"""

from __future__ import annotations


# Default / fallback thresholds (used when industry is "general" or unknown)
DEFAULTS = {
    "profit_margin_strong":   0.20,
    "profit_margin_moderate": 0.10,
    "profit_margin_weak":     0.05,
    "debt_ratio_low":         0.50,
    "debt_ratio_moderate":    1.00,
    "debt_ratio_high":        3.00,
    "debt_ratio_excessive":   5.00,
    "revenue_large":         100_000,
    "revenue_medium":         50_000,
}

# Industry-specific threshold overrides
# Only fields that differ from DEFAULTS need to be listed.
INDUSTRY_BENCHMARKS: dict[str, dict] = {
    "technology": {
        # Tech companies have high margins
        "profit_margin_strong":   0.25,
        "profit_margin_moderate": 0.15,
        "profit_margin_weak":     0.07,
        # Revenue scale: larger base expected
        "revenue_large":         500_000,
        "revenue_medium":        100_000,
    },
    "retail": {
        # Retail operates on thin margins
        "profit_margin_strong":   0.08,
        "profit_margin_moderate": 0.04,
        "profit_margin_weak":     0.02,
        # Retail is more leveraged: relax debt threshold
        "debt_ratio_high":        4.00,
        "debt_ratio_excessive":   7.00,
    },
    "manufacturing": {
        "profit_margin_strong":   0.15,
        "profit_margin_moderate": 0.08,
        "profit_margin_weak":     0.03,
        # Manufacturing is capital-intensive
        "debt_ratio_high":        3.50,
        "debt_ratio_excessive":   6.00,
    },
    "hospitality": {
        # Hotels/restaurants have low and volatile margins
        "profit_margin_strong":   0.12,
        "profit_margin_moderate": 0.06,
        "profit_margin_weak":     0.02,
        "debt_ratio_high":        4.00,
        "debt_ratio_excessive":   8.00,
    },
    "real_estate": {
        # Real estate typically carries heavy debt
        "profit_margin_strong":   0.18,
        "profit_margin_moderate": 0.10,
        "profit_margin_weak":     0.04,
        "debt_ratio_high":        6.00,
        "debt_ratio_excessive":  12.00,
    },
    "fmcg": {
        "profit_margin_strong":   0.15,
        "profit_margin_moderate": 0.08,
        "profit_margin_weak":     0.03,
    },
    "pharma": {
        # R&D-heavy; higher margins expected
        "profit_margin_strong":   0.25,
        "profit_margin_moderate": 0.15,
        "profit_margin_weak":     0.06,
    },
}


def get_thresholds(industry: str) -> dict:
    """
    Return the merged threshold dict for the given industry.
    Falls back to DEFAULTS for any unspecified key.
    """
    industry = (industry or "general").lower().strip().replace(" ", "_")
    overrides = INDUSTRY_BENCHMARKS.get(industry, {})
    return {**DEFAULTS, **overrides}
