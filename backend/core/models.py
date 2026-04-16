from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    current_role = Column(String(100))
    target_role = Column(String(100))  # Career Shift Supported
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan")

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
    cluster_id = Column(Integer)   
    external_url = Column(String(255))
    posted_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.utcnow)

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
