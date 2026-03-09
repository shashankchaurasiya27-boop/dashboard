import re
from utils.logger import logger

# All numeric fields the extractor is responsible for.
_EMPTY: dict = {
    "revenue":              0.0,
    "net_profit":           0.0,
    "total_debt":           0.0,
    "total_assets":         0.0,
    "total_liabilities":    0.0,
    "current_assets":       0.0,
    "current_liabilities":  0.0,
    "ebit":                 0.0,
    "interest_expense":     0.0,
    "cash":                 0.0,
}

# Pattern suffix: optionally captures trailing unit (Crore / Lakh / Lakhs / L / Cr)
# so the scale word is always part of m.group(0) even when it comes AFTER the number.
_UNIT_SUFFIX = r"(?:\s*(?:crore|lakh|lakhs?|cr|l)\b)?"


def extract_financial_data(text: str) -> dict:
    """
    Extract financial fields from PDF text via regex patterns.
    Always returns a complete dict — missing fields default to 0.0.

    IMPORTANT: normalize_number() MUST receive m.group(0) (the full matched
    line) as the second argument so it can detect Lakh / Crore suffixes that
    appear anywhere in the line (not just immediately after the number).
    """
    data = dict(_EMPTY)  # start with all-zero defaults

    try:
        # Revenue
        m = re.search(r"(Revenue|Total Income)[^\d]*([\d,\.]+)" + _UNIT_SUFFIX, text, re.IGNORECASE)
        if m:
            data["revenue"] = normalize_number(m.group(2), m.group(0)) or 0.0

        # Net Profit
        m = re.search(r"(Net Profit|Profit After Tax)[^\d]*([\d,\.]+)" + _UNIT_SUFFIX, text, re.IGNORECASE)
        if m:
            data["net_profit"] = normalize_number(m.group(2), m.group(0)) or 0.0

        # Total Debt
        m = re.search(r"(Total Debt|Borrowings)[^\d]*([\d,\.]+)" + _UNIT_SUFFIX, text, re.IGNORECASE)
        if m:
            data["total_debt"] = normalize_number(m.group(2), m.group(0)) or 0.0

        # Total Assets
        m = re.search(r"(Total Assets)[^\d]*([\d,\.]+)" + _UNIT_SUFFIX, text, re.IGNORECASE)
        if m:
            data["total_assets"] = normalize_number(m.group(2), m.group(0)) or 0.0

        # Total Liabilities
        m = re.search(r"(Total Liabilities)[^\d]*([\d,\.]+)" + _UNIT_SUFFIX, text, re.IGNORECASE)
        if m:
            data["total_liabilities"] = normalize_number(m.group(2), m.group(0)) or 0.0

        # Current Assets
        m = re.search(r"(Current Assets)[^\d]*([\d,\.]+)" + _UNIT_SUFFIX, text, re.IGNORECASE)
        if m:
            data["current_assets"] = normalize_number(m.group(2), m.group(0)) or 0.0

        # Current Liabilities
        m = re.search(r"(Current Liabilities)[^\d]*([\d,\.]+)" + _UNIT_SUFFIX, text, re.IGNORECASE)
        if m:
            data["current_liabilities"] = normalize_number(m.group(2), m.group(0)) or 0.0

        # EBIT
        m = re.search(r"(EBIT|Earnings Before Interest)[^\d]*([\d,\.]+)" + _UNIT_SUFFIX, text, re.IGNORECASE)
        if m:
            data["ebit"] = normalize_number(m.group(2), m.group(0)) or 0.0

        # Interest Expense
        m = re.search(r"(Interest Expense|Finance Costs)[^\d]*([\d,\.]+)" + _UNIT_SUFFIX, text, re.IGNORECASE)
        if m:
            data["interest_expense"] = normalize_number(m.group(2), m.group(0)) or 0.0

        # Cash
        m = re.search(r"(Cash and Cash Equivalents|Cash & Equivalents|Cash)[^\d]*([\d,\.]+)" + _UNIT_SUFFIX, text, re.IGNORECASE)
        if m:
            data["cash"] = normalize_number(m.group(2), m.group(0)) or 0.0

    except Exception as e:
        logger.error(f"Error during regex financial extraction: {e}")

    extracted = {k: v for k, v in data.items() if v != 0.0}
    logger.info(f"Regex extractor found: {list(extracted.keys())}")
    return data


def normalize_number(value: str, text: str = "") -> float:
    """
    Convert a number string to float; handle Indian formats (Lakh / Crore).
    Returns 0.0 on failure.
    """
    try:
        number = float(value.replace(",", "").strip())
        if "crore" in text.lower():
            return number * 10_000_000
        if "lakh" in text.lower():
            return number * 100_000
        return number
    except Exception:
        return 0.0