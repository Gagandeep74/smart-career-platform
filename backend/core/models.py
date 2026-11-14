from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Text, Boolean
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, timezone

Base = declarative_base()


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    current_role = Column(String(100))
    target_role = Column(String(100))  # Career Shift Supported
    created_at = Column(DateTime, default=utc_now)
    email_verified_at = Column(DateTime, nullable=True)
    
    # Relationships
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("ResumeDocument", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")


class ResumeImprovement(Base):
    __tablename__ = "resume_improvements"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resume_documents.id"), nullable=True)
    job_description = Column(Text, default="")
    original_content = Column(JSON, nullable=False, default=dict)
    improved_content = Column(JSON, nullable=False, default=dict)
    suggestions = Column(JSON, nullable=False, default=list)
    ats_before = Column(Float, default=0)
    ats_after = Column(Float, default=0)
    created_at = Column(DateTime, default=utc_now)


class CoverLetter(Base):
    __tablename__ = "cover_letters"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=True)
    title = Column(String(150), nullable=False, default="Cover Letter")
    tone = Column(String(40), nullable=False, default="professional")
    content = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(150), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    questions = Column(JSON, nullable=False, default=list)
    answers = Column(JSON, nullable=False, default=list)
    score = Column(Float, nullable=True)
    status = Column(String(30), default="practice")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class Reminder(Base):
    __tablename__ = "reminders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    reminder_type = Column(String(40), nullable=False, default="application")
    due_at = Column(DateTime, nullable=False)
    related_id = Column(Integer, nullable=True)
    completed = Column(Boolean, default=False)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)


class Portfolio(Base):
    __tablename__ = "portfolios"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    slug = Column(String(120), unique=True, nullable=False)
    headline = Column(String(200), default="")
    bio = Column(Text, default="")
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class PortfolioProject(Base):
    __tablename__ = "portfolio_projects"
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, default="")
    technologies = Column(JSON, default=list)
    project_url = Column(String(500), default="")
    github_url = Column(String(500), default="")
    display_order = Column(Integer, default=0)


class LinkedInProfile(Base):
    __tablename__ = "linkedin_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    headline = Column(String(220), default="")
    about = Column(Text, default="")
    experience = Column(JSON, default=list)
    skills = Column(JSON, default=list)
    profile_url = Column(String(500), default="")
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class AuthToken(Base):
    __tablename__ = "auth_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(128), unique=True, nullable=False, index=True)
    token_type = Column(String(30), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    event_type = Column(String(80), nullable=False, index=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now, index=True)


class JobAlert(Base):
    __tablename__ = "job_alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    role = Column(String(150), default="")
    location = Column(String(150), default="")
    skills = Column(JSON, default=list)
    min_salary = Column(Integer, nullable=True)
    frequency = Column(String(20), default="weekly")
    enabled = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

class UserSkill(Base):
    """ Captured from NLP Engine processing User Resume (Module 2) """
    __tablename__ = 'user_skills'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    skill_name = Column(String(100), nullable=False)
    proficiency = Column(Float, default=0.0) 
    
    user = relationship("User", back_populates="skills")

class Job(Base):
    """ Live jobs recommended via TF-IDF (Module 4) & Clustered (Module 7) """
    __tablename__ = 'jobs'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    company = Column(String(150))
    description = Column(Text)
    required_skills = Column(JSON) 
    preferred_certifications = Column(JSON, default=list)
    cluster_id = Column(Integer)   
    external_url = Column(String(255))
    posted_date = Column(DateTime)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_currency = Column(String(10), default="USD")
    salary_period = Column(String(20), default="year")
    created_at = Column(DateTime, default=utc_now)

class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(150), nullable=False)
    issuer = Column(String(150), nullable=False)
    issue_date = Column(String(20))
    expiry_date = Column(String(20), nullable=True)
    credential_id = Column(String(150), nullable=True)
    credential_url = Column(String(500), nullable=True)
    skills = Column(JSON, default=list)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="certificates")

class ResumeDocument(Base):
    __tablename__ = "resume_documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(150), nullable=False, default="My Resume")
    template = Column(String(50), nullable=False, default="modern")
    content = Column(JSON, nullable=False, default=dict)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="resumes")
    versions = relationship("ResumeVersion", back_populates="resume", cascade="all, delete-orphan")

class ResumeVersion(Base):
    __tablename__ = "resume_versions"
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resume_documents.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    label = Column(String(100), default="Saved version")
    template = Column(String(50), nullable=False, default="modern")
    content = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=utc_now)

    resume = relationship("ResumeDocument", back_populates="versions")

class JobApplication(Base):
    __tablename__ = "job_applications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    external_job_id = Column(String(150), nullable=False)
    title = Column(String(150), nullable=False)
    company = Column(String(150), nullable=True)
    apply_url = Column(String(500), nullable=True)
    status = Column(String(30), default="saved")
    notes = Column(Text, default="")
    follow_up_date = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="applications")

class Course(Base):
    """ Learning content repository for Gap Analysis (Module 9) """
    __tablename__ = 'courses'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    skill_tag = Column(String(100), nullable=False) 
    difficulty = Column(String(50))   # Foundation, Core, Advanced
    url = Column(String(255))         
    content_type = Column(String(50)) # Video, Article, Project

class Roadmap(Base):
    """ AI Generated Sequential Learning Map (Module 5) """
    __tablename__ = 'roadmap'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    target_role = Column(String(100), nullable=False) # The career chosen
    phase = Column(Integer, default=1) # 1, 2, 3 (Foundation, Core, etc.)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="roadmaps")

class UserProgress(Base):
    """ Tracking user course completion (Module 10) """
    __tablename__ = 'progress'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    status = Column(String(50), default="Enrolled") 
    completion_date = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="progress")
    course = relationship("Course")

class APICache(Base):
    """ External Live Job API request cache (Module 11) """
    __tablename__ = 'api_cache'
    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String(255), nullable=False, index=True)
    query_params = Column(String(255))
    response_data = Column(JSON, nullable=False)
    expires_at = Column(DateTime, nullable=False)
