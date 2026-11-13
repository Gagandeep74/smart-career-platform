from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core import models
from backend.ML_models.matcher import (
    recommend_personalized_jobs_tfidf,
    _fetch_remotive,
    _fetch_adzuna,
    generate_platform_links
)
from backend.nlp_engine.skill_extractor import clean_extracted_skills
from pydantic import BaseModel
import re

router = APIRouter(tags=["AI Personalized Job Recommendations (Module 4 & 7)"])

class RecommendJobsRequest(BaseModel):
    user_skills: list[str] = []
    limit: int = 50


def _seed_db_jobs_if_empty(db: Session):
    """ Ensure database has standard verified job postings if table is empty """
    count = db.query(models.Job).count()
    if count == 0:
        seed_jobs = [
            models.Job(
                title="Senior Backend Python Engineer",
                company="Nexus Cloud Systems",
                description="Lead development of distributed microservices, REST APIs, and event pipelines. Required skills: Python, FastAPI, PostgreSQL, Docker, Redis, Git, AWS.",
                required_skills=["python", "fastapi", "postgresql", "docker", "redis", "git", "aws"],
                cluster_id=1,
                external_url="https://www.linkedin.com/jobs"
            ),
            models.Job(
                title="Machine Learning & AI Engineer",
                company="Cortex Cognitive Lab",
                description="Develop deep learning models, LLM pipelines, and NLP systems. Required skills: Python, PyTorch, TensorFlow, Machine Learning, NLP, Docker, SQL.",
                required_skills=["python", "pytorch", "tensorflow", "machine learning", "nlp", "docker", "sql"],
                cluster_id=2,
                external_url="https://www.indeed.com/jobs"
            ),
            models.Job(
                title="Cloud DevOps & Platform Architect",
                company="Skyline Infrastructure",
                description="Build scalable Kubernetes clusters, CI/CD automation, and cloud security. Required skills: AWS, Kubernetes, Docker, Terraform, Linux, CI/CD, Python.",
                required_skills=["aws", "kubernetes", "docker", "terraform", "linux", "git", "python"],
                cluster_id=3,
                external_url="https://www.google.com/search?q=devops+jobs"
            ),
            models.Job(
                title="Full Stack Software Engineer",
                company="Apex Digital Labs",
                description="Build interactive Next.js interfaces and robust backend APIs. Required skills: React, TypeScript, Node.js, Python, PostgreSQL, CSS, Docker.",
                required_skills=["react", "typescript", "python", "postgresql", "css", "docker", "javascript"],
                cluster_id=4,
                external_url="https://www.linkedin.com/jobs"
            ),
            models.Job(
                title="Data Platform Engineer",
                company="StreamScale Analytics",
                description="Design real-time ETL pipelines and high-throughput data lakes. Required skills: Python, SQL, Spark, Pandas, Airflow, AWS, Docker.",
                required_skills=["python", "sql", "pandas", "aws", "docker", "git"],
                cluster_id=5,
                external_url="https://www.indeed.com/jobs"
            ),
            models.Job(
                title="Cybersecurity Systems Analyst",
                company="CyberShield Defense",
                description="Perform threat modeling, penetration testing, and security posture monitoring. Required skills: Cybersecurity, Linux, Python, Cryptography, Networking.",
                required_skills=["cybersecurity", "linux", "python", "cryptography", "git"],
                cluster_id=6,
                external_url="https://www.google.com/search?q=cybersecurity+jobs"
            ),
            models.Job(
                title="Frontend React & UI Engineer",
                company="Lumina Creative Tech",
                description="Craft fluid, accessible web applications and design system components. Required skills: React, Next.js, JavaScript, TypeScript, Tailwind, CSS, HTML.",
                required_skills=["react", "javascript", "typescript", "css", "html", "git"],
                cluster_id=7,
                external_url="https://www.linkedin.com/jobs"
            ),
            models.Job(
                title="Technical Product Manager",
                company="Velocity AI Products",
                description="Drive product roadmap, agile sprints, and data-informed feature development. Required skills: Project Management, Agile, SQL, Communication, Leadership.",
                required_skills=["project management", "agile", "sql", "communication", "leadership"],
                cluster_id=8,
                external_url="https://www.indeed.com/jobs"
            )
        ]
        db.add_all(seed_jobs)
        db.commit()


def _gather_and_rank_jobs(user_skills: list[str], limit: int, db: Session) -> dict:
    # 1. Ensure DB has baseline jobs
    _seed_db_jobs_if_empty(db)

    # 2. Fetch Database Jobs
    db_jobs_raw = db.query(models.Job).all()
    db_jobs_list = []
    for j in db_jobs_raw:
        skills = j.required_skills
        if not skills or not isinstance(skills, list):
            skills = list(clean_extracted_skills(j.description or "").keys())
        db_jobs_list.append({
            "id": f"db_{j.id}",
            "title": j.title,
            "company": j.company or "Tech Enterprise",
            "company_logo": "",
            "location": "Remote / Onsite",
            "remote_status": "Remote",
            "employment_type": "Full-Time",
            "salary": "$115,000 - $155,000 / yr",
            "description": j.description or f"{j.title} role working with modern engineering stack.",
            "apply_url": j.external_url or "#",
            "source": "Database",
            "required_skills": skills or ["python", "sql", "git"]
        })

    # 3. Fetch Live Jobs from Remotive & Adzuna
    live_jobs_list = []
    search_keywords = []
    if user_skills:
        search_keywords.extend(user_skills[:3])
    search_keywords.extend(["software", "developer", "engineer", "data"])
    
    # Deduplicate search terms
    seen_terms = set()
    cleaned_terms = []
    for term in search_keywords:
        t_clean = term.lower().strip()
        if t_clean and t_clean not in seen_terms and len(t_clean) >= 2:
            seen_terms.add(t_clean)
            cleaned_terms.append(t_clean)

    for query in cleaned_terms[:4]:
        # Adzuna
        adz = _fetch_adzuna(query)
        for aj in adz:
            aj["source"] = "Adzuna"
            aj["id"] = f"adz_{len(live_jobs_list)}"
            live_jobs_list.append(aj)

        # Remotive
        rem = _fetch_remotive(query)
        for rj in rem:
            rj["source"] = "Remotive"
            rj["id"] = f"rem_{len(live_jobs_list)}"
            live_jobs_list.append(rj)

    # 4. Rank merged & deduplicated jobs using TF-IDF similarity
    ranked_jobs = recommend_personalized_jobs_tfidf(
        user_skills=user_skills,
        db_jobs=db_jobs_list,
        live_jobs=live_jobs_list,
        top_n=limit
    )

    # 5. Compute Aggregate Summary Statistics
    total_analyzed = len(db_jobs_list) + len(live_jobs_list)
    if ranked_jobs:
        highest_match = max(j["match_percentage"] for j in ranked_jobs)
        avg_match = round(sum(j["match_percentage"] for j in ranked_jobs) / len(ranked_jobs), 1)
        confidence = "High" if highest_match >= 65 else ("Medium" if highest_match >= 40 else "Moderate")
    else:
        highest_match = 0.0
        avg_match = 0.0
        confidence = "Low"

    closest_careers = [
        "AI & Machine Learning Engineer",
        "Cloud DevOps Solutions Architect",
        "Full Stack Web Developer",
        "Data Platform Engineer",
        "Cybersecurity Systems Analyst"
    ]

    resume_tips = [
        "Include quantifiable project achievements with metrics and impact.",
        "Add verified cloud credentials (AWS / GCP / Azure certifications).",
        "Highlight hands-on experience with containerization (Docker & Kubernetes).",
        "Showcase open-source contributions or deployed full-stack portfolio systems."
    ]

    return {
        "user_extracted_skills": user_skills,
        "total_jobs_analyzed": total_analyzed,
        "highest_match": highest_match,
        "average_match": avg_match,
        "recommendation_confidence": confidence,
        "recommendations": ranked_jobs,
        "closest_careers": closest_careers,
        "resume_improvement_suggestions": resume_tips
    }


@router.post("/recommend-jobs")
def post_job_recommendations(
    request: RecommendJobsRequest,
    db: Session = Depends(get_db)
):
    """
    Module 4 & 7: AI Personalized Job Recommendations
    Automatically vectorizes user resume skills via TF-IDF against merged Database + Live jobs
    """
    user_skills = request.user_skills
    if not user_skills:
        # Fallback to skills in DB
        db_skills = db.query(models.UserSkill).all()
        user_skills = [s.skill_name for s in db_skills] if db_skills else ["python", "sql", "git"]

    return _gather_and_rank_jobs(user_skills, request.limit, db)


@router.post("/recommend-jobs/{user_id}")
def post_job_recommendations_for_user(
    user_id: int,
    request: RecommendJobsRequest,
    db: Session = Depends(get_db)
):
    user_skills = request.user_skills
    if not user_skills:
        user_skills_db = db.query(models.UserSkill).filter_by(user_id=user_id).all()
        user_skills = [s.skill_name for s in user_skills_db] if user_skills_db else ["python", "sql", "git"]

    return _gather_and_rank_jobs(user_skills, request.limit, db)


@router.get("/recommend-jobs/{user_id}")
def get_job_recommendations_by_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    user_skills_db = db.query(models.UserSkill).filter_by(user_id=user_id).all()
    user_skills = [s.skill_name for s in user_skills_db] if user_skills_db else ["python", "sql", "git"]
    return _gather_and_rank_jobs(user_skills, 50, db)


@router.get("/recommend-jobs")
def get_job_recommendations_generic(
    db: Session = Depends(get_db)
):
    db_skills = db.query(models.UserSkill).all()
    user_skills = [s.skill_name for s in db_skills] if db_skills else ["python", "sql", "git"]
    return _gather_and_rank_jobs(user_skills, 50, db)
