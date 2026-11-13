from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core import models
from backend.nlp_engine.parser import extract_structured_resume, extract_text_from_pdf, extract_text_from_txt
from backend.nlp_engine.skill_extractor import process_resume_text
from backend.api.routes_auth import get_current_user
from backend.core.models import User

router = APIRouter(tags=["Resume Processing (Module 2)"])
MAX_RESUME_BYTES = 5 * 1024 * 1024
ALLOWED_RESUME_TYPES = {
    ".pdf": {"application/pdf", "application/octet-stream"},
    ".txt": {"text/plain", "application/octet-stream"},
}

@router.post("/upload-resume/")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """ Accepts PDF or text file, extracts skills using NLP, saves to SQLite """
    try:
        filename = (file.filename or "").lower()
        extension = "." + filename.rsplit(".", 1)[-1] if "." in filename else ""
        if extension not in ALLOWED_RESUME_TYPES:
            raise HTTPException(status_code=400, detail="Only PDF or TXT resumes are supported")
        if file.content_type and file.content_type not in ALLOWED_RESUME_TYPES[extension]:
            raise HTTPException(status_code=400, detail="The uploaded file type does not match its extension")

        contents = await file.read(MAX_RESUME_BYTES + 1)
        if not contents:
            raise HTTPException(status_code=400, detail="The uploaded resume is empty")
        if len(contents) > MAX_RESUME_BYTES:
            raise HTTPException(status_code=413, detail="Resume must be 5 MB or smaller")
        
        # 1. Parsing logic
        if extension == ".pdf":
            raw_text = extract_text_from_pdf(contents)
        elif extension == ".txt":
            raw_text = extract_text_from_txt(contents)
        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="No readable text was found in the resume")
            
        # 2. Extract NLP Skills (SpaCy/BERT)
        extraction_result = process_resume_text(raw_text)
        # Use ONLY the whitelisted clean skills, discarding the noisy raw output
        skills = extraction_result["cleaned_skills"]
        skill_scores = extraction_result.get("skill_scores", {})
        structured = extract_structured_resume(raw_text)
        
        # 3. Save to database
        user_id = current_user.id
        existing_resume = db.query(models.ResumeDocument).filter_by(user_id=user_id).order_by(models.ResumeDocument.updated_at.desc()).first()
        imported_content = {
            "name": current_user.name,
            "email": current_user.email,
            "location": structured["location"],
            "headline": current_user.target_role or current_user.current_role or "",
            "summary": raw_text[:600],
            "skills": ", ".join(skills),
            "experience": structured["experience"],
            "education": structured["education"],
            "projects": structured["projects"],
            "languages": structured["languages"],
            "achievements": structured["achievements"],
            "links": structured["links"],
            "certificates": [],
        }
        if existing_resume:
            existing_resume.content = {
                **imported_content,
                **(existing_resume.content or {}),
                "experience": structured["experience"] or (existing_resume.content or {}).get("experience", []),
                "education": structured["education"] or (existing_resume.content or {}).get("education", []),
            }
        else:
            db.add(models.ResumeDocument(user_id=user_id, title="Imported Resume", content=imported_content))
            
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
            "structured_content": structured,
            "vector_count": len(extraction_result["skill_vectors"])
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
