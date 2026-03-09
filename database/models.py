from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from database.db import Base


class CreditEvaluation(Base):
    __tablename__ = "credit_evaluations"

    id           = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    revenue      = Column(Float)
    cogs         = Column(Float, nullable=True)
    net_profit   = Column(Float)
    total_debt   = Column(Float)
    risk_score   = Column(Integer)
    decision     = Column(String)
    explanation  = Column(Text)
    pdf_path     = Column(String)
    created_at   = Column(DateTime, default=datetime.utcnow)


class DraftEvaluation(Base):
    """
    Stores a mid-pipeline 'draft' record that an analyst can correct before
    the final CAM is generated.

    Lifecycle:
        pending_review  → analyst sees extracted numbers
        verified        → analyst submitted corrections
        finalized       → CAM PDF generated, record promoted to CreditEvaluation
    """
    __tablename__ = "draft_evaluations"

    id                      = Column(Integer, primary_key=True, index=True)
    company_name            = Column(String, index=True)
    file_path               = Column(String)          # path on disk
    extracted_text_preview  = Column(Text)            # first 500 chars for UI
    raw_financial_json      = Column(Text)            # JSON-serialised dict
    corrected_financial_json = Column(Text, nullable=True)  # analyst edits
    industry                = Column(String, default="general")
    status                  = Column(String, default="pending_review")
    final_evaluation_id     = Column(Integer, nullable=True)  # set after finalize
    created_at              = Column(DateTime, default=datetime.utcnow)
    updated_at              = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base):
    """
    API user for JWT authentication and RBAC.
    Roles: 'analyst' (upload/verify) | 'manager' (full access).
    """
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role            = Column(String, default="analyst")  # "analyst" | "manager"
    is_active       = Column(Integer, default=1)          # 1=active, 0=disabled
    created_at      = Column(DateTime, default=datetime.utcnow)