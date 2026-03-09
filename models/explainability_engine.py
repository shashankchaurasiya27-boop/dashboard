def generate_explanation(financial_data: dict, ratios: dict, risk_output: dict):
    """
    Generate readable text explanations.
    Ratios default to 0.0 if data was missing.
    """
    explanations = []
    risk_flags = risk_output.get("risk_flags", [])

    profit_margin = ratios.get("profit_margin", 0.0)
    debt_ratio = ratios.get("debt_to_revenue", 0.0)
    revenue = financial_data.get("revenue", 0.0)

    # If we have revenue, we can trust the ratios.
    if revenue > 0:
        if profit_margin > 0.15:
            explanations.append("The company demonstrates strong profitability.")
        elif profit_margin < 0.05:
            explanations.append("The company has weak profitability levels.")

        if debt_ratio > 5:
            explanations.append("The company is highly leveraged compared to its revenue.")
        elif debt_ratio > 3:
            explanations.append("The company has moderate to high leverage.")
        else:
            explanations.append("The company's leverage appears manageable.")
    else:
        explanations.append("Unable to determine financial ratios due to missing revenue data.")

    if not explanations:
        explanations.append("Financial indicators appear stable.")

    return {
        "summary": " ".join(explanations),
        "detailed_flags": risk_flags
    }