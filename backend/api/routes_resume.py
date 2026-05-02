from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core import models
from backend.nlp_engine.parser import extract_text_from_pdf, extract_text_from_txt
from backend.nlp_engine.skill_extractor import process_resume_text

router = APIRouter(tags=["Resume Processing (Module 2)"])

@router.post("/upload-resume/")
async def upload_resume(file: UploadFile = File(...), user_id: int = 1, db: Session = Depends(get_db)):
    """ Accepts PDF or text file, extracts skills using NLP, saves to SQLite """
    try:
        contents = await file.read()
        
        # 1. Parsing logic
        if file.filename.endswith(".pdf"):
            raw_text = extract_text_from_pdf(contents)
        elif file.filename.endswith(".txt"):
            raw_text = extract_text_from_txt(contents)
        else:
            raise HTTPException(status_code=400, detail="Only .pdf or .txt supported")
            
        # 2. Extract NLP Skills (SpaCy/BERT)
        extraction_result = process_resume_text(raw_text)
        # Use ONLY the whitelisted clean skills, discarding the noisy raw output
        skills = extraction_result["cleaned_skills"]
        skill_scores = extraction_result.get("skill_scores", {})
        
        # 3. Save to database
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            # Create mock user if missing
            user = models.User(id=user_id, name="Test User", email="test@local.com", hashed_password="mock")
            db.add(user)
            db.commit()
            
        for s in skills:
            # Prevent duplicates
            existing = db.query(models.UserSkill).filter_by(user_id=user_id, skill_name=s).first()
            true_score = skill_scores.get(s, 80) / 100.0
            
            if not existing:
                db_skill = models.UserSkill(user_id=user_id, skill_name=s, proficiency=true_score)
                db.add(db_skill)
            else:
                existing.proficiency = true_score
                
        db.commit()
        
        return {
            "message": "Resume parsed successfully",
            "detected_skills": skills,
            "skill_scores": skill_scores,
            "vector_count": len(extraction_result["skill_vectors"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
