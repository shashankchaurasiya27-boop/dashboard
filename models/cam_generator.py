def generate_cam(company_name: str,
                 financial_data: dict,
                 ratios: dict,
                 risk_output: dict,
                 decision_output: dict,
                 explanation: dict):

    cam = {}

    # Executive Summary
    cam["Executive Summary"] = (
        f"The credit appraisal for {company_name} indicates a "
        f"risk score of {risk_output['risk_score']}. "
        f"The recommended decision is {decision_output['decision']}."
    )

    # Financial Overview
    cam["Financial Overview"] = {
        "Revenue": financial_data.get("revenue"),
        "Net Profit": financial_data.get("net_profit"),
        "Total Debt": financial_data.get("total_debt"),
        "Profit Margin": ratios.get("profit_margin"),
        "Debt to Revenue": ratios.get("debt_to_revenue")
    }

    # Risk Assessment
    cam["Risk Assessment"] = {
        "Base Risk Score": risk_output.get("risk_score"),
        "Risk Flags": risk_output.get("risk_flags")
    }

       # Credit Decision
    cam["Credit Decision"] = decision_output

    # Explanation
    cam["Narrative Explanation"] = explanation.get("summary", "")

    # Five Cs of Credit
    risk_flags = risk_output.get("risk_flags", [])
    cam["Five Cs of Credit"] = {
        "Character": "No adverse flags identified." if not risk_flags else "Risk flags present.",
        "Capacity": f"Profit Margin: {ratios.get('profit_margin')}",
        "Capital": f"Revenue Base: {financial_data.get('revenue')}",
        "Collateral": "Not assessed in current model.",
        "Conditions": "Based on internal financial metrics."
    }

    return cam