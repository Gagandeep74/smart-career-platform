from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.core.models import Base

# Using SQLite for fast local prototyping (Module 11)
DATABASE_URL = "sqlite:///./career_platform.db"

# Create the SQLAlchemy Engine
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

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
