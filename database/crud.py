import json
from datetime import datetime
from sqlalchemy.orm import Session

from database.models import CreditEvaluation, DraftEvaluation
from database.db import SessionLocal


def save_evaluation(db_or_data, data: dict = None) -> int:
    """
    Persist a credit evaluation record.

    Supports two calling conventions:
      - save_evaluation(db, data)   – caller manages the session (FastAPI style)
      - save_evaluation(data)       – function opens/closes its own session (legacy)
    """
    if data is None:
        data = db_or_data
        db = SessionLocal()
        own_session = True
    else:
        db = db_or_data
        own_session = False

    try:
        new_record = CreditEvaluation(
            company_name=data["company_name"],
            revenue=data.get("revenue"),
            cogs=data.get("cogs"),           # BUG FIX: was missing, now persisted
            net_profit=data.get("net_profit"),
            total_debt=data.get("total_debt"),
            risk_score=data["risk_score"],
            decision=data["decision"],
            explanation=data["explanation"],
            pdf_path=data["pdf_path"],
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record.id

    except Exception as e:
        db.rollback()
        raise e

    finally:
        if own_session:
            db.close()


def get_evaluation_by_id(evaluation_id: int):
    db = SessionLocal()
    try:
        return (
            db.query(CreditEvaluation)
            .filter(CreditEvaluation.id == evaluation_id)
            .first()
        )
    finally:
        db.close()


def get_all_evaluations(db: Session = None):
    """Return all credit evaluation records, ordered by newest first."""
    own_session = db is None
    if own_session:
        db = SessionLocal()
    try:
        return (
            db.query(CreditEvaluation)
            .order_by(CreditEvaluation.id.desc())
            .all()
        )
    finally:
        if own_session:
            db.close()


# ── Draft CRUD ────────────────────────────────────────────────────────────────


def create_draft(db: Session, company_name: str, file_path: str,
                 extracted_text_preview: str, financial_data: dict,
                 industry: str = "general") -> DraftEvaluation:
    """Create a new draft evaluation in `pending_review` status."""
    draft = DraftEvaluation(
        company_name=company_name,
        file_path=file_path,
        extracted_text_preview=extracted_text_preview[:500],
        raw_financial_json=json.dumps(financial_data),
        industry=industry,
        status="pending_review",
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


def get_draft(db: Session, draft_id: int) -> DraftEvaluation | None:
    """Fetch a single draft by ID."""
    return db.query(DraftEvaluation).filter(DraftEvaluation.id == draft_id).first()


def get_all_drafts(db: Session):
    """Return all drafts, newest first."""
    return db.query(DraftEvaluation).order_by(DraftEvaluation.id.desc()).all()


def update_draft_corrections(db: Session, draft_id: int,
                              corrections: dict) -> DraftEvaluation | None:
    """
    Analyst submits corrected financial numbers.
    Merges the corrections into the raw data and marks as 'verified'.
    """
    draft = get_draft(db, draft_id)
    if not draft:
        return None

    # Merge analyst's overrides into the original extracted data
    raw_data = json.loads(draft.raw_financial_json or "{}")
    raw_data.update({k: float(v) for k, v in corrections.items() if v is not None})

    draft.corrected_financial_json = json.dumps(raw_data)
    draft.status = "verified"
    draft.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(draft)
    return draft


def finalize_draft(db: Session, draft_id: int,
                   final_evaluation_id: int) -> DraftEvaluation | None:
    """Mark draft as finalized and link it to the produced CreditEvaluation."""
    draft = get_draft(db, draft_id)
    if not draft:
        return None

    draft.status = "finalized"
    draft.final_evaluation_id = final_evaluation_id
    draft.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(draft)
    return draft


# ── User CRUD (Phase 4 — Auth) ────────────────────────────────────────────
from database.models import User


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, username: str, password: str, role: str = "analyst") -> User:
    from services.auth import hash_password
    user = User(
        username=username,
        hashed_password=hash_password(password),
        role=role,
        is_active=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_all_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.id).all()