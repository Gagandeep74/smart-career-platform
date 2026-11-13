from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Text
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
    
    # Relationships
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("ResumeDocument", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")

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
