import os
import sys
import types

os.environ.setdefault("SECRET_KEY", "test-secret-for-tests-only")

from fastapi.testclient import TestClient

skill_extractor = types.ModuleType("backend.nlp_engine.skill_extractor")
skill_extractor.process_resume_text = lambda text: {
    "raw_extracted_skills": [],
    "cleaned_skills": [],
    "skill_scores": {},
    "skill_vectors": {},
}
sys.modules["backend.nlp_engine.skill_extractor"] = skill_extractor

from backend.core.database import get_db
from backend.core.models import User
from fastapi import FastAPI
from backend.api import routes_resume
from backend.api.routes_auth import get_current_user

app = FastAPI()
app.include_router(routes_resume.router, prefix="/api/v1")


def override_user():
    return User(id=7, name="Test User", email="test@example.com", hashed_password="unused")


def override_db():
    yield object()


app.dependency_overrides[get_current_user] = override_user
app.dependency_overrides[get_db] = override_db
client = TestClient(app)


def test_upload_rejects_unsupported_extension():
    response = client.post(
        "/api/v1/upload-resume/",
        files={"file": ("resume.docx", b"content", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert response.status_code == 400
    assert "PDF or TXT" in response.json()["detail"]


def test_upload_rejects_empty_resume():
    response = client.post(
        "/api/v1/upload-resume/",
        files={"file": ("resume.txt", b"", "text/plain")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"]


def teardown_module():
    app.dependency_overrides.clear()
