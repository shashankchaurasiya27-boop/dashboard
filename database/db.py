from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import DATABASE_URL

# SQLite requires check_same_thread=False for FastAPI's multi-threaded nature.
# PostgreSQL (Supabase, Neon, etc.) does NOT use that flag — it handles connections
# via a connection pool instead. We also cap the pool for serverless environments.
_is_sqlite = DATABASE_URL.startswith("sqlite")

if _is_sqlite:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    # PostgreSQL — pool_pre_ping ensures stale connections (common in serverless
    # scale-to-zero scenarios) are detected and recycled automatically.
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()