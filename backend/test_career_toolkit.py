import os

os.environ.setdefault("SECRET_KEY", "test-secret-for-tests-only")

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.api.routes_auth import get_current_user
from backend.api.routes_career_toolkit import router
from backend.core.database import get_db
from backend.core.models import Base, User

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)
app = FastAPI()
app.include_router(router, prefix="/api/v1")


def override_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()


def override_user(db=Depends(override_db)):
    return db.query(User).filter_by(id=1).first()


app.dependency_overrides[get_db] = override_db
app.dependency_overrides[get_current_user] = override_user
client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = Session()
    db.add(User(id=1, name="Test User", email="test@example.com", hashed_password="unused", target_role="Data Analyst"))
    db.commit()
    db.close()


def test_resume_improvement_and_job_matching():
    improvement = client.post("/api/v1/resume/improve", json={"job_description": "Python SQL analytics"}).json()
    assert improvement["ats_after"] >= improvement["ats_before"]
    match = client.post("/api/v1/jobs/match", json={"job_description": "Python SQL analytics"})
    assert match.status_code == 200
    assert "missing_keywords" in match.json()


def test_toolkit_resources_are_persisted():
    assert client.post("/api/v1/interviews", json={"role": "Data Analyst"}).status_code == 200
    assert client.post("/api/v1/reminders", json={"title": "Follow up", "due_at": "2026-12-01T10:00:00"}).status_code == 200
    assert client.put("/api/v1/portfolio", json={"slug": "test-user", "headline": "Analyst", "bio": "Builder"}).status_code == 200
    assert client.post("/api/v1/linkedin/optimize").status_code == 200
    assert client.post("/api/v1/job-alerts", json={"name": "Analyst roles", "role": "Data Analyst"}).status_code == 200
    analytics = client.get("/api/v1/analytics/career")
    assert analytics.status_code == 200
    assert analytics.json()["events"] >= 1
