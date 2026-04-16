from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core import models
import pandas as pd
from backend.nlp_engine.gap_analyzer import calculate_skill_gap
from backend.ML_models.content_recs import suggest_courses
from backend.ML_models.matcher import fetch_live_job_data, generate_platform_links
from backend.nlp_engine.skill_extractor import clean_extracted_skills
from backend.api.routes_auth import get_current_user
from pydantic import BaseModel

router = APIRouter(tags=["Learning Roadmap (Module 5 & 9)"])

@router.get("/roadmap/{user_id}/{job_id}")
def generate_roadmap(user_id: int, job_id: int, db: Session = Depends(get_db)):
    """ Analyzes Skill Gap between User & Job, then returns curated course map """
    
    # 1. Base User Skills extraction
    user_skills_db = db.query(models.UserSkill).filter_by(user_id=user_id).all()
    user_skills = [s.skill_name for s in user_skills_db]
    
    # 2. Get Target Job Skills
    target_job = db.query(models.Job).filter_by(id=job_id).first()
    job_skills_list = target_job.required_skills if target_job else ["python", "machine learning", "docker", "sql"]
    
    # 3. Gap Analyzer (Module 3 logic)
    gap_report = calculate_skill_gap(user_skills, job_skills_list)
    missing_skills = gap_report["missing_skills"]
    
    # 4. Content Recommendations (Module 9 logic)
    course_catalog = db.query(models.Course).all()
    df_courses = pd.DataFrame([{
        "title": c.title, "skill_tag": c.skill_tag, "difficulty": c.difficulty, "url": c.url, "content_type": c.content_type
    } for c in course_catalog]) if course_catalog else pd.DataFrame(columns=['title', 'skill_tag'])
    
    recommended_path = suggest_courses(missing_skills, df_courses)
    
    return {
        "gap_analysis": gap_report["analysis_summary"],
        "roadmap_phases": recommended_path
    }

class PivotRequest(BaseModel):
    target_role: str

@router.post("/roadmap/live-pivot")
def generate_live_pivot_roadmap(request: PivotRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Scrapes live job data, then for EACH job individually:
    - Extracts required skills via NLP
    - Runs gap analysis against the user's resume skills
    - Computes a per-job match percentage
    - Generates platform apply links
    - Suggests a learning roadmap for missing skills
    """
    
    # 1. Fetch User Base Skills
    user_skills_db = db.query(models.UserSkill).filter_by(user_id=current_user.id).all()
    user_skills = [s.skill_name for s in user_skills_db]
    
    # 2. Scrape Job API
    live_jobs = fetch_live_job_data(request.target_role)
    
    # 3. Course catalog (for roadmap suggestions)
    course_catalog = db.query(models.Course).all()
    df_courses = pd.DataFrame([{
        "title": c.title, "skill_tag": c.skill_tag, "difficulty": c.difficulty, "url": c.url, "content_type": c.content_type
    } for c in course_catalog]) if course_catalog else pd.DataFrame(columns=['title', 'skill_tag'])
    
    # 4. Process each job individually
    recommended_jobs = []
    for job in live_jobs:
        # NLP extraction on this specific job's description
        job_required_skills = clean_extracted_skills(job.get("description", ""))
        if not job_required_skills:
            job_required_skills = ["python", "sql"]
        
        # Per-job gap analysis
        gap = calculate_skill_gap(user_skills, job_required_skills)
        
        # Per-job learning roadmap
        roadmap = suggest_courses(gap["missing_skills"], df_courses)
        
        # Platform links
        links = generate_platform_links(job.get("title", request.target_role))
        
        recommended_jobs.append({
            "title": job.get("title", request.target_role),
            "company": job.get("company", "Unknown"),
            "location": job.get("location", "Remote"),
            "apply_url": job.get("apply_url", ""),
            "match_percentage": gap["analysis_summary"]["Match Percentage"],
            "matched_skills": gap["matched_skills"],
            "missing_skills": gap["missing_skills"],
            "required_skills": job_required_skills,
            "platform_links": links,
            "roadmap_phases": roadmap,
        })
    
    # Sort by best match first
    recommended_jobs.sort(key=lambda j: j["match_percentage"], reverse=True)
    
    return {
        "target_role": request.target_role,
        "user_skills": user_skills,
        "scraped_jobs_count": len(live_jobs),
        "recommended_jobs": recommended_jobs,
    }

class CareerPathsRequest(BaseModel):
    extracted_skills: list[str] = []

@router.post("/roadmap/analyze-career-paths")
def analyze_career_paths(request: CareerPathsRequest, db: Session = Depends(get_db)):
    """
    Evaluates user skills against predefined core industry domains to
    suggest the top career paths. Computes match %, gaps, and roadmaps.
    """
    # 1. Resolve User Skills
    user_skills = request.extracted_skills
    if not user_skills:
        user_skills_db = db.query(models.UserSkill).filter_by(user_id=1).all()
        user_skills = [s.skill_name for s in user_skills_db]
        
    # 2. Define standard tech career pathways and their core required skills
    CORE_CAREER_PATHS = [
        {
            "role": "Frontend Developer",
            "description": "Building modern, responsive user interfaces.",
            "core_skills": ["javascript", "react", "typescript", "html", "css", "tailwind", "next.js"],
        },
        {
            "role": "Backend Developer",
            "description": "Architecting server-side logic and databases.",
            "core_skills": ["python", "java", "node.js", "sql", "postgresql", "docker", "api", "django"],
        },
        {
            "role": "Data Scientist",
            "description": "Extracting insights using machine learning and statistics.",
            "core_skills": ["python", "pandas", "machine learning", "sql", "scikit-learn", "numpy", "statistics"],
        },
        {
            "role": "DevOps Engineer",
            "description": "Automating infrastructure and deployment pipelines.",
            "core_skills": ["linux", "docker", "kubernetes", "aws", "terraform", "bash", "jenkins"],
        },
        {
            "role": "Cybersecurity Analyst",
            "description": "Protecting systems against threats and vulnerabilities.",
            "core_skills": ["cybersecurity", "linux", "networking", "python", "penetration testing", "cryptography"],
        },
        {
            "role": "Machine Learning Engineer",
            "description": "Deploying scalable AI and deep learning models.",
            "core_skills": ["python", "tensorflow", "pytorch", "deep learning", "machine learning", "docker", "sql"],
        },
        {
            "role": "Fullstack Developer",
            "description": "End-to-end development from database to UI.",
            "core_skills": ["javascript", "react", "node.js", "python", "sql", "html", "css", "docker"],
        },
        {
            "role": "Mobile Developer",
            "description": "Creating native and cross-platform mobile apps.",
            "core_skills": ["swift", "kotlin", "java", "react native", "flutter", "mobile"],
        }
    ]

    # 3. Process each path
    course_catalog = db.query(models.Course).all()
    df_courses = pd.DataFrame([{
        "title": c.title, "skill_tag": c.skill_tag, "difficulty": c.difficulty, "url": c.url, "content_type": c.content_type
    } for c in course_catalog]) if course_catalog else pd.DataFrame(columns=['title', 'skill_tag'])

    analyzed_paths = []
    
    for path in CORE_CAREER_PATHS:
        # Calculate gap
        gap = calculate_skill_gap(user_skills, path["core_skills"])
        
        # Suggest roadmap with role and core skills for capstone generation
        roadmap = suggest_courses(gap["missing_skills"], df_courses, path["role"], path["core_skills"])
        
        # Platform links
        links = generate_platform_links(path["role"])
        
        analyzed_paths.append({
            "role": path["role"],
            "description": path["description"],
            "match_percentage": gap["analysis_summary"]["Match Percentage"],
            "matched_skills": gap["matched_skills"],
            "missing_skills": gap["missing_skills"],
            "required_skills": path["core_skills"],
            "platform_links": links,
            "roadmap_phases": roadmap,
        })
        
    # 4. Sort by highest match
    analyzed_paths.sort(key=lambda p: p["match_percentage"], reverse=True)
    
    return {
        "user_skills": user_skills,
        "analyzed_paths_count": len(CORE_CAREER_PATHS),
        "recommended_paths": analyzed_paths
    }
