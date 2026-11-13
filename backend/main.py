from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import time
from collections import defaultdict, deque
from starlette.requests import Request
from starlette.responses import JSONResponse
from backend.core.database import init_db
from backend.api import routes_resume, routes_jobs, routes_learning, routes_analytics, routes_auth, routes_profile

app = FastAPI(
    title="Smart Career & Resume AI Platform",
    description="Backend API powering the Resume NLP and Job ML Models.",
    version="1.0.0"
)

_rate_limit_events: dict[str, deque[float]] = defaultdict(deque)
_RATE_LIMITS = {
    "/api/v1/auth/login": (10, 60),
    "/api/v1/auth/signup": (5, 3600),
    "/api/v1/upload-resume/": (10, 3600),
}


@app.middleware("http")
async def rate_limit_sensitive_routes(request: Request, call_next):
    limit_config = _RATE_LIMITS.get(request.url.path)
    if limit_config:
        limit, window = limit_config
        key = f"{request.client.host if request.client else 'unknown'}:{request.url.path}"
        now = time.monotonic()
        events = _rate_limit_events[key]
        while events and now - events[0] >= window:
            events.popleft()
        if len(events) >= limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers={"Retry-After": str(window)},
            )
        events.append(now)
    return await call_next(request)

# Allow Next.js frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Initialize SQLite database mapping the SQLAlchemy schemas
@app.on_event("startup")
def on_startup():
    init_db()

# Register Modulized API Endpoints
app.include_router(routes_auth.router, prefix="/api/v1")
app.include_router(routes_resume.router, prefix="/api/v1")
app.include_router(routes_jobs.router, prefix="/api/v1")
app.include_router(routes_learning.router, prefix="/api/v1")
app.include_router(routes_analytics.router, prefix="/api/v1")
app.include_router(routes_profile.router, prefix="/api/v1")

@app.get("/")
def check_health():
    return {"status": "operational", "message": "ML Engine Online"}
