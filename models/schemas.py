from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CreditEvaluationBase(BaseModel):
    company_name: str
    revenue: Optional[float] = None
    net_profit: Optional[float] = None
    total_debt: Optional[float] = None
    risk_score: int
    decision: str
    explanation: Optional[str] = None
    pdf_path: Optional[str] = None

class CreditEvaluationCreate(CreditEvaluationBase):
    pass

class CreditEvaluation(CreditEvaluationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class HistoryItem(BaseModel):
    id: int
    company_name: str
    revenue: Optional[float] = None
    risk_score: Optional[int] = None
    decision: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
