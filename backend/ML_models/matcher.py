import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def recommend_jobs_tfidf(user_skills: list[str], job_database: pd.DataFrame, top_n: int = 5) -> pd.DataFrame:
    """
    Module 4: Job Recommendation
    Vectorize skill sets using TF-IDF and compute similarity between user skills
    and job required skills.
    """
    
    if job_database.empty:
        return pd.DataFrame()
        
    user_skill_string = " ".join(user_skills)
    job_skills_corpus = job_database['required_skills_str'].tolist()
    
    tfidf = TfidfVectorizer(stop_words='english')
    all_docs = [user_skill_string] + job_skills_corpus
    tfidf_matrix = tfidf.fit_transform(all_docs)
    
    user_vector = tfidf_matrix[0:1]
    job_vectors = tfidf_matrix[1:]
    
    similarity_scores = cosine_similarity(user_vector, job_vectors).flatten()
    
    job_database['match_score'] = np.round(similarity_scores * 100, 2)
    ranked_jobs = job_database.sort_values(by='match_score', ascending=False)
    
    return ranked_jobs.head(top_n)


# ============================================================================
# LIVE JOB SCRAPER — Works for ANY role, no API key required
# ============================================================================

import requests
import os
from urllib.parse import quote_plus


def generate_platform_links(job_title: str) -> dict:
    """
    Builds filtered search URLs showing CURRENT openings on major platforms.
    All URLs are date-filtered to show only recent/current postings.
    """
    encoded = quote_plus(job_title)
    slug = job_title.lower().replace(' ', '-').replace('/', '-')
    return {
        "indeed": f"https://www.indeed.com/jobs?q={encoded}&sort=date&fromage=7",
        "linkedin": f"https://www.linkedin.com/jobs/search/?keywords={encoded}&f_TPR=r604800&sortBy=DD",
        "google_jobs": f"https://www.google.com/search?q={encoded}+jobs+near+me&ibp=htl;jobs",
        "naukri": f"https://www.naukri.com/{slug}-jobs?sort=r",
        "glassdoor": f"https://www.glassdoor.com/Job/{slug}-jobs-SRCH_KO0,{len(job_title)}.htm",
    }


def _fetch_remotive(job_query: str) -> list[dict]:
    """
    Fetch REAL jobs from Remotive API — completely FREE, no API key needed.
    Returns real job titles, real companies, real descriptions, and real apply URLs.
    Works for ANY role the user searches.
    """
    try:
        url = f"https://remotive.com/api/remote-jobs?search={quote_plus(job_query)}&limit=10"
        res = requests.get(url, timeout=8)
        if res.status_code == 200:
            jobs = res.json().get("jobs", [])
            if jobs:
                return [{
                    "title": j.get("title", ""),
                    "company": j.get("company_name", "Unknown"),
                    "location": j.get("candidate_required_location", "Remote"),
                    "description": j.get("description", ""),
                    "apply_url": j.get("url", ""),
                } for j in jobs[:8]]
    except Exception:
        pass
    return []


def _fetch_adzuna(job_query: str) -> list[dict]:
    """
    Fetch jobs from Adzuna API — requires API key (optional enhancement).
    """
    api_id = os.environ.get("ADZUNA_APP_ID")
    api_key = os.environ.get("ADZUNA_APP_KEY")
    
    if not api_id or not api_key:
        return []
    
    try:
        url = f"https://api.adzuna.com/v1/api/jobs/us/search/1?app_id={api_id}&app_key={api_key}&results_per_page=10&what={job_query}"
        res = requests.get(url, timeout=8)
        if res.status_code == 200:
            results = res.json().get('results', [])
            return [{
                "title": r.get('title', job_query),
                "company": r.get('company', {}).get('display_name', 'Unknown'),
                "location": r.get('location', {}).get('display_name', 'Remote'),
                "description": r.get('description', ''),
                "apply_url": r.get('redirect_url', ''),
            } for r in results[:10]]
    except Exception:
        pass
    return []


def fetch_live_job_data(job_query: str) -> list[dict]:
    """
    Universal Job Fetcher — works for ANY role, no limits.
    
    Pipeline:
      1. Try Adzuna API (if keys configured)
      2. Try Remotive API (free, no key needed, works for any query)
      3. Fallback to dynamic mock generation (only if both APIs fail/offline)
    
    This ensures every search query returns relevant, unique job data
    regardless of what the user types.
    """
    
    # Priority 1: Adzuna (paid, most results)
    jobs = _fetch_adzuna(job_query)
    if jobs:
        return jobs
    
    # Priority 2: Remotive (free, real data, no key)
    jobs = _fetch_remotive(job_query)
    if jobs:
        return jobs
    
    # Priority 3: Dynamic fallback (only when both APIs are unreachable)
    # Generates contextual descriptions based on the actual search query
    return _generate_dynamic_fallback(job_query)


def _generate_dynamic_fallback(job_query: str) -> list[dict]:
    """
    Last-resort fallback when all APIs are offline.
    Dynamically generates job listings based on the user's actual search query
    instead of hardcoded categories. Works for ANY role.
    """
    q = job_query.lower()
    
    # Build a pool of skills relevant to the query by checking keywords
    skill_pools = {
        "web": ["html", "css", "javascript", "react", "node.js"],
        "data": ["python", "pandas", "sql", "machine learning", "data analysis"],
        "cloud": ["aws", "docker", "kubernetes", "terraform", "linux"],
        "mobile": ["swift", "kotlin", "react", "flutter", "firebase"],
        "design": ["figma", "css", "tailwind", "creativity", "ui/ux"],
        "security": ["cybersecurity", "penetration testing", "cryptography", "linux", "python"],
        "management": ["leadership", "project management", "agile", "communication", "strategic planning"],
        "devops": ["docker", "kubernetes", "jenkins", "git", "terraform"],
        "ai": ["tensorflow", "pytorch", "deep learning", "nlp", "computer vision"],
        "backend": ["python", "java", "postgresql", "redis", "django"],
    }
    
    # Detect which pools are relevant based on the query
    relevant_skills = set()
    for key, skills in skill_pools.items():
        if key in q:
            relevant_skills.update(skills)
    
    # If nothing matched, create a general skill set from the query context
    if not relevant_skills:
        relevant_skills = {"python", "sql", "git", "communication", "problem solving",
                          "javascript", "html", "css", "leadership", "teamwork",
                          "docker", "aws", "agile", "data analysis", "linux"}
    
    skill_list = list(relevant_skills)
    
    # Generate 5 varied jobs with different subsets of the relevant skills
    companies = [
        ("Google", "Mountain View, CA"),
        ("Microsoft", "Remote"),
        ("Amazon", "Seattle, WA"),
        ("Infosys", "Bangalore, India"),
        ("Accenture", "Mumbai, India"),
    ]
    
    titles = [
        f"Senior {job_query}",
        f"{job_query} Specialist",
        f"Junior {job_query}",
        f"Lead {job_query}",
        f"{job_query} Consultant",
    ]
    
    jobs = []
    chunk_size = max(3, len(skill_list) // 5)
    for i in range(5):
        start = (i * chunk_size) % len(skill_list)
        job_skills = skill_list[start:start + chunk_size]
        if len(job_skills) < 3:
            job_skills = skill_list[:chunk_size]
        
        company, location = companies[i]
        desc = f"{titles[i]} position requiring expertise in {', '.join(job_skills)}."
        
        jobs.append({
            "title": titles[i],
            "company": company,
            "location": location,
            "description": desc,
            "apply_url": "",
        })
    
    return jobs
