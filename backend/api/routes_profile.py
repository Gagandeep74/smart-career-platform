from datetime import datetime, date, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from backend.api.routes_auth import get_current_user
from backend.core.database import get_db
from backend.core.models import Certificate, ResumeDocument, ResumeVersion, User, UserSkill, Job, JobApplication

router = APIRouter(tags=["Profile and Resume Builder"])


class CertificateInput(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    issuer: str = Field(min_length=1, max_length=150)
    issue_date: str = ""
    expiry_date: str | None = None
    credential_id: str | None = None
    credential_url: str | None = None
    skills: list[str] = []


class CertificateResult(CertificateInput):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ResumeInput(BaseModel):
    title: str = Field(default="My Resume", min_length=1, max_length=150)
    template: str = Field(default="modern", max_length=50)
    content: dict = Field(default_factory=dict)


class ResumeResult(ResumeInput):
    id: int
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class ApplicationInput(BaseModel):
    external_job_id: str = Field(min_length=1, max_length=150)
    title: str = Field(min_length=1, max_length=150)
    company: str = ""
    apply_url: str = ""
    status: str = Field(default="saved", pattern="^(saved|applied|interview|offer|rejected)$")
    notes: str = ""
    follow_up_date: str | None = None


class ApplicationResult(ApplicationInput):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeVersionInput(BaseModel):
    label: str = Field(default="Saved version", min_length=1, max_length=100)


class ResumeVersionResult(BaseModel):
    id: int
    version_number: int
    label: str
    template: str
    content: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.get("/profile/certificates", response_model=list[CertificateResult])
def list_certificates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Certificate).filter_by(user_id=current_user.id).order_by(Certificate.created_at.desc()).all()


@router.get("/profile/certificates/expiring")
def expiring_certificates(
    days: int = 60,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cutoff = date.today() + timedelta(days=max(1, min(days, 365)))
    records = db.query(Certificate).filter_by(user_id=current_user.id).all()
    result = []
    for record in records:
        if not record.expiry_date:
            continue
        try:
            expiry = date.fromisoformat(record.expiry_date)
        except ValueError:
            continue
        if expiry <= cutoff:
            result.append({
                "id": record.id,
                "name": record.name,
                "issuer": record.issuer,
                "expiry_date": record.expiry_date,
                "expired": expiry < date.today(),
                "days_remaining": (expiry - date.today()).days,
            })
    return result


@router.get("/profile/resume-import")
def resume_import(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skills = db.query(UserSkill).filter_by(user_id=current_user.id).all()
    certificates = db.query(Certificate).filter_by(user_id=current_user.id).all()
    return {
        "name": current_user.name,
        "email": current_user.email,
        "headline": current_user.target_role or current_user.current_role or "",
        "skills": ", ".join(skill.skill_name for skill in skills),
        "certificates": [
            {"name": item.name, "issuer": item.issuer, "date": item.issue_date or "", "url": item.credential_url or ""}
            for item in certificates
        ],
    }


@router.get("/profile/ats-score/{job_id}")
def resume_ats_score(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter_by(id=job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    skills = {item.skill_name.lower() for item in current_user.skills}
    required = {item.lower() for item in (job.required_skills or [])}
    certificates = {item.name.lower() for item in current_user.certificates}
    preferred = {item.lower() for item in (job.preferred_certifications or [])}
    matched_skills = sorted(skills & required)
    missing_skills = sorted(required - skills)
    matched_certificates = sorted(
        preferred & certificates | {
            preferred_name for preferred_name in preferred
            if any(preferred_name in certificate_name for certificate_name in certificates)
        }
    )
    score = round(((len(matched_skills) / len(required)) * 80 if required else 0) +
                  ((len(matched_certificates) / len(preferred)) * 20 if preferred else 0), 1)
    return {
        "job_id": job.id,
        "job_title": job.title,
        "score": score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matched_certificates": matched_certificates,
        "missing_certifications": sorted(preferred - set(matched_certificates)),
    }


@router.post("/profile/certificates", response_model=CertificateResult, status_code=status.HTTP_201_CREATED)
def create_certificate(
    certificate: CertificateInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = Certificate(user_id=current_user.id, **certificate.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/profile/certificates/{certificate_id}", response_model=CertificateResult)
def update_certificate(
    certificate_id: int,
    certificate: CertificateInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(Certificate).filter_by(id=certificate_id, user_id=current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    for key, value in certificate.model_dump().items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/profile/certificates/{certificate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certificate(
    certificate_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(Certificate).filter_by(id=certificate_id, user_id=current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    db.delete(record)
    db.commit()


@router.get("/resume-documents", response_model=list[ResumeResult])
def list_resume_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(ResumeDocument).filter_by(user_id=current_user.id).order_by(ResumeDocument.updated_at.desc()).all()


@router.post("/resume-documents", response_model=ResumeResult, status_code=status.HTTP_201_CREATED)
def create_resume_document(
    resume: ResumeInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = ResumeDocument(user_id=current_user.id, **resume.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/resume-documents/{resume_id}", response_model=ResumeResult)
def update_resume_document(
    resume_id: int,
    resume: ResumeInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(ResumeDocument).filter_by(id=resume_id, user_id=current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    record.title = resume.title
    record.template = resume.template
    record.content = resume.content
    record.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(record)
    return record


@router.get("/resume-documents/{resume_id}/versions", response_model=list[ResumeVersionResult])
def list_resume_versions(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(ResumeDocument).filter_by(id=resume_id, user_id=current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return db.query(ResumeVersion).filter_by(resume_id=resume.id).order_by(ResumeVersion.version_number.desc()).all()


@router.post("/resume-documents/{resume_id}/versions", response_model=ResumeVersionResult, status_code=status.HTTP_201_CREATED)
def create_resume_version(
    resume_id: int,
    version: ResumeVersionInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(ResumeDocument).filter_by(id=resume_id, user_id=current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    latest = db.query(ResumeVersion).filter_by(resume_id=resume.id).order_by(ResumeVersion.version_number.desc()).first()
    record = ResumeVersion(
        resume_id=resume.id,
        version_number=(latest.version_number + 1 if latest else 1),
        label=version.label,
        template=resume.template,
        content=resume.content,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/resume-documents/{resume_id}/versions/{version_id}/restore", response_model=ResumeResult)
def restore_resume_version(
    resume_id: int,
    version_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(ResumeDocument).filter_by(id=resume_id, user_id=current_user.id).first()
    version = db.query(ResumeVersion).filter_by(id=version_id, resume_id=resume_id).first() if resume else None
    if not resume or not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume version not found")
    resume.template = version.template
    resume.content = version.content
    resume.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("/applications", response_model=list[ApplicationResult])
def list_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(JobApplication).filter_by(user_id=current_user.id).order_by(JobApplication.updated_at.desc()).all()


@router.post("/applications", response_model=ApplicationResult, status_code=status.HTTP_201_CREATED)
def save_application(
    application: ApplicationInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(JobApplication).filter_by(
        user_id=current_user.id,
        external_job_id=application.external_job_id,
    ).first()
    if record:
        for key, value in application.model_dump().items():
            setattr(record, key, value)
    else:
        record = JobApplication(user_id=current_user.id, **application.model_dump())
        db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.patch("/applications/{application_id}", response_model=ApplicationResult)
def update_application(
    application_id: int,
    application: ApplicationInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(JobApplication).filter_by(id=application_id, user_id=current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    for key, value in application.model_dump().items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(JobApplication).filter_by(id=application_id, user_id=current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    db.delete(record)
    db.commit()
