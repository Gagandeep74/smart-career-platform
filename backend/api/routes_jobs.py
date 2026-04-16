from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core import models
import pandas as pd
from backend.ML_models.matcher import recommend_jobs_tfidf, fetch_live_job_data

router = APIRouter(tags=["Job Recommendations (Module 4 & 7)"])

@router.get("/recommend-jobs/{user_id}")
def get_job_recommendations(user_id: int, db: Session = Depends(get_db)):
    """ Computes Cosine Similarity between user capabilities and live jobs base """
    
    # 1. Fetch User Skills
    user_skills_db = db.query(models.UserSkill).filter(models.UserSkill.user_id == user_id).all()
    user_skills_list = [s.skill_name for s in user_skills_db]
    
    # 2. Fetch Jobs DB to a dataframe for matching
    jobs_db = db.query(models.Job).all()
    
    # Simple Mock DB check -> Fetch Live API alternatively if DB empty
    if not jobs_db:
        # Fallback to simulated Live Web scraping/API
        mock_api_data = fetch_live_job_data("Data Scientist")
        return {"source": "live_api", "recommendations": mock_api_data}
        
    df_jobs = pd.DataFrame([{
        "job_id": j.id,
        "title": j.title,
        "required_skills_str": " ".join(j.required_skills) if j.required_skills else ""
    } for j in jobs_db])
    
    # 3. TF-IDF & Cosine Similarities calculation
    best_matches = recommend_jobs_tfidf(user_skills_list, df_jobs)
    
    return {
        "user_extracted_skills": user_skills_list,
        "recommendations": best_matches.to_dict(orient="records")
    }
