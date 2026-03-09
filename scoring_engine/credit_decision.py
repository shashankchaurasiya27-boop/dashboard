def generate_credit_decision(risk_score: int, revenue: float):

    decision = "APPROVE"
    interest_rate = 10  # Base interest
    suggested_limit = revenue * 0.5  # Default 50% of revenue

    if risk_score >= 85:
        decision = "APPROVE"
        interest_rate = 10
        suggested_limit = revenue * 0.6

    elif 70 <= risk_score < 85:
        decision = "APPROVE_WITH_CONDITIONS"
        interest_rate = 12
        suggested_limit = revenue * 0.5

    elif 50 <= risk_score < 70:
        decision = "HIGH_RISK_APPROVAL"
        interest_rate = 15
        suggested_limit = revenue * 0.3

    else:
        decision = "REJECT"
        interest_rate = None
        suggested_limit = 0

    return {
        "decision": decision,
        "interest_rate_percent": interest_rate,
        "suggested_loan_limit": suggested_limit
    }