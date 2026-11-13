import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from backend.core.models import Base

# Using SQLite for fast local prototyping (Module 11)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./career_platform.db")

# Create the SQLAlchemy Engine
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

# Create SessionLocal class, instance of which will be a DB session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize local development schema without masking missing production migrations."""
    if os.getenv("APP_ENV", "development").lower() == "production":
        if not inspect(engine).has_table("alembic_version"):
            raise RuntimeError("Database is not migrated. Run `alembic upgrade head` before starting production.")
        return
    Base.metadata.create_all(bind=engine)
    _add_missing_job_columns()


def _add_missing_job_columns():
    """Keep local SQLite prototypes compatible when new job fields are added."""
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("jobs")}
    migrations = {
        "salary_min": "INTEGER",
        "salary_max": "INTEGER",
        "salary_currency": "VARCHAR(10)",
        "salary_period": "VARCHAR(20)",
        "preferred_certifications": "JSON",
    }
    with engine.begin() as connection:
        for column, column_type in migrations.items():
            if column not in columns:
                connection.execute(text(f"ALTER TABLE jobs ADD COLUMN {column} {column_type}"))

def get_db():
    """ Dependency for FastAPI to get a DB session per request """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
