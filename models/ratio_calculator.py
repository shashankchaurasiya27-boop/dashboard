from utils.logger import logger


def calculate_ratios(financial_data: dict) -> dict:
    """
    Compute financial ratios from extracted data.

    All inputs are coerced to float; missing / zero values produce 0.0
    so that no downstream computation ever encounters None.
    """
    revenue   = float(financial_data.get("revenue")   or 0)
    cogs      = float(financial_data.get("cogs")      or 0)
    net_profit = float(financial_data.get("net_profit") or 0)
    total_debt = float(financial_data.get("total_debt") or 0)

    ratios: dict = {
        "gross_margin":     0.0,
        "profit_margin":    0.0,
        "debt_to_revenue":  0.0,
    }

    if revenue > 0:
        ratios["gross_margin"]    = (revenue - cogs) / revenue
        ratios["profit_margin"]   = net_profit / revenue
        ratios["debt_to_revenue"] = total_debt / revenue
    else:
        logger.warning("Revenue is zero or missing — ratios defaulted to 0.0")

    return ratios