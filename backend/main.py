import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.database import init_db
from backend.api import routes_resume, routes_jobs, routes_learning, routes_analytics, routes_auth

app = FastAPI(
    title="Smart Career & Resume AI Platform",
    description="Backend API powering the Resume NLP and Job ML Models.",
    version="1.0.0"
)

# Dynamic CORS: Supports both local dev and deployed frontend
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def on_startup():
    init_db()

# Register Modulized API Endpoints
app.include_router(routes_auth.router, prefix="/api/v1")
app.include_router(routes_resume.router, prefix="/api/v1")
app.include_router(routes_jobs.router, prefix="/api/v1")
app.include_router(routes_learning.router, prefix="/api/v1")
app.include_router(routes_analytics.router, prefix="/api/v1")

@app.get("/")
def check_health():
    return {"status": "operational", "message": "ML Engine Online"}
