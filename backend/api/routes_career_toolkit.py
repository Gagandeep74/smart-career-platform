from datetime import datetime, timedelta, timezone
import hashlib
import re
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.api.routes_auth import get_current_user, get_password_hash
from backend.core.database import get_db
from backend.core.models import (
    AnalyticsEvent, AuthToken, CoverLetter, InterviewSession, Job, JobAlert,
    LinkedInProfile, Portfolio, PortfolioProject, Reminder, ResumeDocument,
    ResumeImprovement, User,
)

router = APIRouter(tags=["Career Toolkit"])


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def latest_resume(db: Session, user_id: int) -> ResumeDocument | None:
    return db.query(ResumeDocument).filter_by(user_id=user_id).order_by(ResumeDocument.updated_at.desc()).first()


def keywords(text: str) -> set[str]:
    return {word.lower() for word in re.findall(r"[A-Za-z][A-Za-z+#.-]{2,}", text or "")}


class ImproveRequest(BaseModel):
    resume_id: int | None = None
    job_description: str = ""


@router.post("/resume/improve")
def improve_resume(
    payload: ImproveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(ResumeDocument).filter_by(id=payload.resume_id, user_id=current_user.id).first() if payload.resume_id else latest_resume(db, current_user.id)
    content = dict(resume.content or {}) if resume else {}
    job_words = keywords(payload.job_description)
    resume_words = keywords(" ".join(str(value) for value in content.values()))
    missing = sorted(job_words - resume_words)[:20]
    suggestions = [
        "Use measurable outcomes in each experience bullet.",
        "Put the most relevant skills near the top of the resume.",
        "Use a role-specific professional summary.",
    ]
    if missing:
        suggestions.append(f"Consider adding evidence for these job keywords: {', '.join(missing[:8])}.")
    improved = dict(content)
    summary = str(improved.get("summary") or improved.get("headline") or "")
    role = current_user.target_role or "your target role"
    improved["summary"] = summary or f"Results-focused professional targeting {role}, combining technical delivery with measurable business impact."
    if missing:
        improved["skills"] = sorted(set((improved.get("skills") or []) + missing[:12]))
    before = round(len(resume_words & job_words) / len(job_words) * 100, 1) if job_words else 0
    after_words = keywords(" ".join(str(value) for value in improved.values()))
    after = round(len(after_words & job_words) / len(job_words) * 100, 1) if job_words else min(100, before + 15)
    record = ResumeImprovement(
        user_id=current_user.id, resume_id=resume.id if resume else None,
        job_description=payload.job_description, original_content=content,
        improved_content=improved, suggestions=suggestions, ats_before=before, ats_after=after,
    )
    db.add(record)
    db.add(AnalyticsEvent(user_id=current_user.id, event_type="resume_improved", metadata_json={"score": after}))
    db.commit()
    db.refresh(record)
    return record


@router.get("/resume/improvements")
def list_improvements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(ResumeImprovement).filter_by(user_id=current_user.id).order_by(ResumeImprovement.created_at.desc()).limit(20).all()


class CoverLetterRequest(BaseModel):
    title: str = Field(default="Cover Letter", max_length=150)
    job_id: int | None = None
    application_id: int | None = None
    tone: str = Field(default="professional", max_length=40)
    job_description: str = ""


@router.post("/cover-letters")
def create_cover_letter(payload: CoverLetterRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(Job).filter_by(id=payload.job_id).first() if payload.job_id else None
    role = job.title if job else (current_user.target_role or "the position")
    company = job.company if job else "your organization"
    content = (
        f"Dear Hiring Manager,\n\nI am excited to apply for the {role} position at {company}. "
        f"My background in {current_user.current_role or 'technology'} and focus on {current_user.target_role or role} "
        "would allow me to contribute quickly to your team.\n\n"
        "I bring practical experience, a learning mindset, and a record of turning requirements into reliable outcomes. "
        "I would welcome the opportunity to discuss how my skills align with your needs.\n\n"
        "Thank you for your consideration.\n\nSincerely,\n" + current_user.name
    )
    record = CoverLetter(user_id=current_user.id, job_id=payload.job_id, application_id=payload.application_id,
                         title=payload.title, tone=payload.tone, content=content)
    db.add(record)
    db.add(AnalyticsEvent(user_id=current_user.id, event_type="cover_letter_created", metadata_json={}))
    db.commit()
    db.refresh(record)
    return record


@router.get("/cover-letters")
def list_cover_letters(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(CoverLetter).filter_by(user_id=current_user.id).order_by(CoverLetter.updated_at.desc()).all()


class JobMatchRequest(BaseModel):
    job_description: str = ""
    job_id: int | None = None


@router.post("/jobs/match")
def match_job(payload: JobMatchRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(Job).filter_by(id=payload.job_id).first() if payload.job_id else None
    description = payload.job_description or (job.description if job else "")
    required = keywords(description)
    user_skills = keywords(" ".join(skill.skill_name for skill in current_user.skills))
    matched, missing = sorted(required & user_skills), sorted(required - user_skills)
    score = round(len(matched) / len(required) * 100, 1) if required else 0
    db.add(AnalyticsEvent(user_id=current_user.id, event_type="job_matched", metadata_json={"score": score}))
    db.commit()
    return {"job_id": payload.job_id, "score": score, "matched_keywords": matched[:50], "missing_keywords": missing[:50],
            "recommendations": [f"Add evidence for {item}" for item in missing[:8]]}


class InterviewRequest(BaseModel):
    role: str = Field(min_length=2, max_length=150)
    job_id: int | None = None


@router.post("/interviews")
def create_interview(payload: InterviewRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    questions = [
        f"Tell me about your experience relevant to {payload.role}.",
        "Describe a challenging project and how you measured its success.",
        "How do you prioritize competing deadlines?",
        "What would you improve in your technical approach over the next year?",
        "Why are you interested in this role?",
    ]
    record = InterviewSession(user_id=current_user.id, role=payload.role, job_id=payload.job_id, questions=questions, answers=[])
    db.add(record)
    db.add(AnalyticsEvent(user_id=current_user.id, event_type="interview_started", metadata_json={"role": payload.role}))
    db.commit()
    db.refresh(record)
    return record


class AnswerRequest(BaseModel):
    question_index: int = Field(ge=0)
    answer: str = Field(min_length=1, max_length=5000)


@router.post("/interviews/{session_id}/answers")
def submit_answer(session_id: int, payload: AnswerRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    answers = list(session.answers or [])
    feedback = {"question_index": payload.question_index, "answer": payload.answer,
                "score": min(100, 35 + len(payload.answer.split()) * 2),
                "feedback": "Use a clear situation, action, and measurable result."}
    answers.append(feedback)
    session.answers = answers
    session.score = round(sum(item["score"] for item in answers) / len(answers), 1)
    db.commit()
    return feedback | {"session_score": session.score}


class ReminderRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    reminder_type: str = "application"
    due_at: datetime
    related_id: int | None = None
    notes: str = ""


@router.post("/reminders")
def create_reminder(payload: ReminderRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = Reminder(user_id=current_user.id, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/reminders")
def list_reminders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Reminder).filter_by(user_id=current_user.id, completed=False).order_by(Reminder.due_at.asc()).all()


@router.patch("/reminders/{reminder_id}/complete")
def complete_reminder(reminder_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(Reminder).filter_by(id=reminder_id, user_id=current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Reminder not found")
    record.completed = True
    db.commit()
    return {"status": "completed"}


class PortfolioRequest(BaseModel):
    slug: str = Field(min_length=3, max_length=120, pattern=r"^[a-z0-9-]+$")
    headline: str = ""
    bio: str = ""
    is_public: bool = False


@router.put("/portfolio")
def upsert_portfolio(payload: PortfolioRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(Portfolio).filter_by(user_id=current_user.id).first()
    if not record:
        record = Portfolio(user_id=current_user.id, **payload.model_dump())
        db.add(record)
    else:
        for key, value in payload.model_dump().items():
            setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record


@router.get("/portfolio")
def get_portfolio(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Portfolio).filter_by(user_id=current_user.id).first()


class ProjectRequest(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str = ""
    technologies: list[str] = []
    project_url: str = ""
    github_url: str = ""


@router.post("/portfolio/projects")
def add_project(payload: ProjectRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    portfolio = db.query(Portfolio).filter_by(user_id=current_user.id).first()
    if not portfolio:
        raise HTTPException(status_code=400, detail="Create a portfolio profile first")
    record = PortfolioProject(portfolio_id=portfolio.id, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/portfolio/public/{slug}")
def public_portfolio(slug: str, db: Session = Depends(get_db)):
    portfolio = db.query(Portfolio).filter_by(slug=slug, is_public=True).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    projects = db.query(PortfolioProject).filter_by(portfolio_id=portfolio.id).order_by(PortfolioProject.display_order).all()
    return {"portfolio": portfolio, "projects": projects}


class LinkedInRequest(BaseModel):
    headline: str = Field(default="", max_length=220)
    about: str = ""
    experience: list[dict] = []
    skills: list[str] = []
    profile_url: str = ""


@router.put("/linkedin")
def update_linkedin(payload: LinkedInRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(LinkedInProfile).filter_by(user_id=current_user.id).first()
    if not record:
        record = LinkedInProfile(user_id=current_user.id, **payload.model_dump())
        db.add(record)
    else:
        for key, value in payload.model_dump().items():
            setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record


@router.get("/linkedin")
def get_linkedin(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(LinkedInProfile).filter_by(user_id=current_user.id).first()


@router.post("/linkedin/optimize")
def optimize_linkedin(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(LinkedInProfile).filter_by(user_id=current_user.id).first()
    if not record:
        record = LinkedInProfile(user_id=current_user.id)
        db.add(record)
    record.headline = record.headline or f"{current_user.target_role or current_user.current_role or 'Career Professional'} | Building measurable impact"
    record.about = record.about or f"{current_user.name} is a motivated professional focused on {current_user.target_role or 'continuous growth'}."
    db.commit()
    db.refresh(record)
    return record


class AlertRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    role: str = ""
    location: str = ""
    skills: list[str] = []
    min_salary: int | None = Field(default=None, ge=0)
    frequency: str = Field(default="weekly", pattern="^(daily|weekly)$")


@router.post("/job-alerts")
def create_alert(payload: AlertRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = JobAlert(user_id=current_user.id, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/job-alerts")
def list_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(JobAlert).filter_by(user_id=current_user.id).order_by(JobAlert.created_at.desc()).all()


@router.delete("/job-alerts/{alert_id}", status_code=204)
def delete_alert(alert_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(JobAlert).filter_by(id=alert_id, user_id=current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Job alert not found")
    db.delete(record)
    db.commit()


@router.get("/analytics/career")
def career_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    events = db.query(AnalyticsEvent).filter_by(user_id=current_user.id).all()
    applications = len(current_user.applications)
    interviews = sum(1 for app in current_user.applications if app.status == "interview")
    offers = sum(1 for app in current_user.applications if app.status == "offer")
    return {"events": len(events), "applications": applications, "interviews": interviews, "offers": offers,
            "interview_rate": round(interviews / applications * 100, 1) if applications else 0,
            "offer_rate": round(offers / applications * 100, 1) if applications else 0,
            "event_breakdown": {event_type: sum(1 for event in events if event.event_type == event_type)
                                for event_type in sorted({event.event_type for event in events})}}


def create_token(db: Session, user_id: int, token_type: str, hours: int) -> str:
    raw = secrets.token_urlsafe(32)
    record = AuthToken(user_id=user_id, token_hash=hashlib.sha256(raw.encode()).hexdigest(),
                       token_type=token_type, expires_at=utc_now() + timedelta(hours=hours))
    db.add(record)
    db.commit()
    return raw


class EmailRequest(BaseModel):
    email: str


@router.post("/auth/request-verification")
def request_verification(payload: EmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=payload.email).first()
    if user and not user.email_verified_at:
        return {"message": "If the account exists, a verification link has been created.", "token": create_token(db, user.id, "email_verification", 24)}
    return {"message": "If the account exists, a verification link has been created."}


@router.post("/auth/verify-email/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    record = db.query(AuthToken).filter_by(token_hash=hashlib.sha256(token.encode()).hexdigest(), token_type="email_verification").first()
    if not record or record.used_at or record.expires_at < utc_now():
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    user = db.query(User).filter_by(id=record.user_id).first()
    user.email_verified_at = utc_now()
    record.used_at = utc_now()
    db.commit()
    return {"message": "Email verified"}


@router.post("/auth/request-password-reset")
def request_password_reset(payload: EmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=payload.email).first()
    response = {"message": "If the account exists, a reset link has been created."}
    if user:
        response["token"] = create_token(db, user.id, "password_reset", 1)
    return response


class PasswordResetRequest(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)


@router.post("/auth/reset-password")
def reset_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    record = db.query(AuthToken).filter_by(token_hash=hashlib.sha256(payload.token.encode()).hexdigest(), token_type="password_reset").first()
    if not record or record.used_at or record.expires_at < utc_now():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user = db.query(User).filter_by(id=record.user_id).first()
    user.hashed_password = get_password_hash(payload.password)
    record.used_at = utc_now()
    db.commit()
    return {"message": "Password reset successfully"}
