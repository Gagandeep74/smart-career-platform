import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.core.models import Base

# Cloud Database: Uses DATABASE_URL env var for PostgreSQL (Neon/Render)
# Falls back to SQLite for local development
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./career_platform.db")

# Fix for Render/Neon: they provide postgres:// but SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create the SQLAlchemy Engine
# check_same_thread is only needed for SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Create SessionLocal class, instance of which will be a DB session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """ Creates all tables defined in models.py (if they don't exist) """
    Base.metadata.create_all(bind=engine)

def get_db():
    """ Dependency for FastAPI to get a DB session per request """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
