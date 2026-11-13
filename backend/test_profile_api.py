import os

os.environ.setdefault("SECRET_KEY", "test-secret-for-tests-only")

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.api.routes_auth import get_current_user
from backend.api.routes_profile import router as profile_router
from backend.core.database import get_db
from backend.core.models import Base, Certificate, Job, User, UserSkill


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(profile_router, prefix="/api/v1")
active_user = User(id=1, name="Test User", email="test@example.com", hashed_password="unused")


def override_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def override_user(db=Depends(override_db)):
    return db.query(User).filter(User.id == active_user.id).first()


app.dependency_overrides[get_db] = override_db
app.dependency_overrides[get_current_user] = override_user
client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    db.add_all(
        [
            User(id=1, name="Test User", email="test@example.com", hashed_password="unused"),
            User(id=2, name="Other User", email="other@example.com", hashed_password="unused"),
            Job(
                id=1,
                title="Python Engineer",
                company="Example Co",
                required_skills=["python", "sql"],
                preferred_certifications=["AWS Certified Developer"],
            ),
        ]
    )
    db.commit()
    db.close()
    active_user.id = 1
    yield


def test_certificate_crud_and_expiry_is_scoped_to_user():
    response = client.post(
        "/api/v1/profile/certificates",
        json={
            "name": "AWS Certified Developer",
            "issuer": "Amazon",
            "issue_date": "2025-01-01",
            "expiry_date": "2026-11-20",
            "skills": ["aws"],
        },
    )
    assert response.status_code == 201
    certificate_id = response.json()["id"]

    assert client.get("/api/v1/profile/certificates").json()[0]["id"] == certificate_id
    assert client.get("/api/v1/profile/certificates/expiring?days=30").json()[0]["id"] == certificate_id

    active_user.id = 2
    assert client.get("/api/v1/profile/certificates").json() == []
    assert client.put(
        f"/api/v1/profile/certificates/{certificate_id}",
        json={"name": "Changed", "issuer": "Issuer", "skills": []},
    ).status_code == 404


def test_profile_routes_require_authentication():
    app.dependency_overrides.pop(get_current_user)
    try:
        response = client.get("/api/v1/profile/certificates")
    finally:
        app.dependency_overrides[get_current_user] = override_user
    assert response.status_code == 401


def test_resume_version_restore_and_cross_user_protection():
    active_user.id = 1
    created = client.post(
        "/api/v1/resume-documents",
        json={"title": "Resume", "template": "modern", "content": {"headline": "Engineer"}},
    )
    assert created.status_code == 201
    resume_id = created.json()["id"]

    version = client.post(
        f"/api/v1/resume-documents/{resume_id}/versions",
        json={"label": "First draft"},
    )
    assert version.status_code == 201
    version_id = version.json()["id"]
    assert version.json()["version_number"] == 1

    client.put(
        f"/api/v1/resume-documents/{resume_id}",
        json={"title": "Resume", "template": "classic", "content": {"headline": "Changed"}},
    )
    active_user.id = 2
    assert client.get(f"/api/v1/resume-documents/{resume_id}/versions").status_code == 404
    assert client.post(
        f"/api/v1/resume-documents/{resume_id}/versions/{version_id}/restore"
    ).status_code == 404

    active_user.id = 1
    restored = client.post(
        f"/api/v1/resume-documents/{resume_id}/versions/{version_id}/restore"
    )
    assert restored.status_code == 200
    assert restored.json()["content"] == {"headline": "Engineer"}
    assert restored.json()["template"] == "modern"


def test_ats_score_uses_skills_and_certifications():
    db = TestingSessionLocal()
    db.add_all(
        [
            UserSkill(user_id=1, skill_name="Python"),
            UserSkill(user_id=1, skill_name="SQL"),
            Certificate(user_id=1, name="AWS Certified Developer", issuer="Amazon"),
        ]
    )
    db.commit()
    db.close()

    response = client.get("/api/v1/profile/ats-score/1")
    assert response.status_code == 200
    body = response.json()
    assert body["score"] == 100.0
    assert body["missing_skills"] == []
    assert body["missing_certifications"] == []

    active_user.id = 2
    assert client.get("/api/v1/profile/ats-score/999").status_code == 404


def test_application_upsert_update_and_delete_are_scoped():
    payload = {
        "external_job_id": "job-1",
        "title": "Python Engineer",
        "company": "Example Co",
        "status": "saved",
    }
    created = client.post("/api/v1/applications", json=payload)
    assert created.status_code == 201
    application_id = created.json()["id"]

    updated = client.patch(
        f"/api/v1/applications/{application_id}",
        json={**payload, "status": "interview", "notes": "Prepare system design"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "interview"

    duplicate = client.post(
        "/api/v1/applications",
        json={**payload, "status": "offer"},
    )
    assert duplicate.status_code == 201
    assert duplicate.json()["id"] == application_id

    active_user.id = 2
    assert client.patch(
        f"/api/v1/applications/{application_id}",
        json=payload,
    ).status_code == 404
    assert client.delete(f"/api/v1/applications/{application_id}").status_code == 404

    active_user.id = 1
    assert client.delete(f"/api/v1/applications/{application_id}").status_code == 204
    assert client.get("/api/v1/applications").json() == []
