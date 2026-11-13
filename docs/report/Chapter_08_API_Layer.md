
# Chapter 8: API Layer — Routes and Endpoints

---

## 8.1 Introduction

The API layer serves as the communication bridge between the Next.js frontend and the backend intelligence modules. Built with FastAPI, it provides ten RESTful endpoints organized across five modular routers. This chapter covers the application setup, CORS configuration, and walkthroughs of each endpoint's purpose and processing logic.

---

## 8.2 FastAPI Application Configuration (main.py)

### 8.2.1 Application Initialization

The FastAPI application is instantiated with metadata that powers the auto-generated Swagger UI documentation. The `title`, `description`, and `version` fields appear in the interactive API explorer accessible at `/docs`.

### 8.2.2 CORS Middleware

**Cross-Origin Resource Sharing (CORS)** middleware is essential because the Next.js frontend (typically `localhost:3000`) makes requests to the FastAPI backend (`localhost:8000`). Without CORS headers, browsers would block these cross-domain requests. The current configuration uses wildcards (`*`) for origins, methods, and headers — suitable for development but requiring restriction to specific frontend domains in production.

### 8.2.3 Startup Event and Database Initialization

The `@app.on_event("startup")` decorator triggers `init_db()` when the server starts, executing `CREATE TABLE IF NOT EXISTS` statements for all ORM models. This ensures the SQLite database is ready before handling requests.

### 8.2.4 Router Registration

All five routers are registered under the `/api/v1` prefix, establishing a versioned API namespace. The routers cover authentication (`routes_auth`), resume processing (`routes_resume`), job recommendations (`routes_jobs`), learning roadmaps (`routes_learning`), and skill analytics (`routes_analytics`).

---

## 8.3 Endpoint Reference

The platform exposes 10 endpoints across 5 routers:

1. **GET /** — Health check returning server status
2. **POST /api/v1/auth/signup** — Register new user, returns JWT
3. **POST /api/v1/auth/login** — Login with OAuth2 form data, returns JWT
4. **GET /api/v1/auth/me** — Protected; returns authenticated user profile
5. **POST /api/v1/upload-resume/** — Upload PDF/TXT, runs NLP pipeline, stores skills
6. **GET /api/v1/recommend-jobs/{id}** — TF-IDF cosine similarity job matching
7. **GET /api/v1/roadmap/{uid}/{jid}** — Skill gap analysis + learning roadmap
8. **POST /api/v1/roadmap/live-pivot** — Protected; live job scraping + per-job gap analysis
9. **POST /api/v1/roadmap/analyze-career-paths** — Evaluate skills against 8 career paths
10. **GET /api/v1/skill-demand/{name}** — Random Forest demand forecasting

---

## 8.4 Resume Upload Endpoint (routes_resume.py)

The `POST /upload-resume/` endpoint accepts a multipart file upload (PDF or TXT), extracts text using the appropriate parser, runs the full NLP pipeline (`process_resume_text()`), and stores extracted skills as `UserSkill` records in the database.

The endpoint uses an **upsert pattern**: for each detected skill, it checks whether a record already exists for that user-skill combination. Existing records have their proficiency score updated; new skills are inserted. The response includes the cleaned skill list, confidence scores, and the count of generated BERT vectors.

---

## 8.5 Job Recommendation Endpoint (routes_jobs.py)

The `GET /recommend-jobs/{user_id}` endpoint retrieves the user's stored skills from the database, loads available job listings, and runs TF-IDF cosine similarity matching. If no jobs exist in the database, it fetches live job data from external APIs. The response includes the user's extracted skills and a ranked list of job recommendations with match scores (0-100%).

---

## 8.6 Live Career Pivot Endpoint (routes_learning.py)

The `POST /roadmap/live-pivot` endpoint is the platform's most complex API call, orchestrating six backend modules in a single request. It requires JWT authentication and accepts a `target_role` in the request body.

For each scraped job, the system performs four operations sequentially: (1) NLP skill extraction from the job description using `clean_extracted_skills()`, (2) skill gap analysis comparing user skills against job requirements, (3) learning roadmap generation for missing skills via `suggest_courses()`, and (4) platform link generation for Indeed, LinkedIn, Google Jobs, Naukri, and Glassdoor. Results are sorted by match percentage in descending order.

---

## 8.7 Career Path Analysis Endpoint

The `POST /roadmap/analyze-career-paths` endpoint evaluates the user's extracted skills against **eight predefined career paths**: Frontend Developer, Backend Developer, Data Scientist, DevOps Engineer, Cybersecurity Analyst, ML Engineer, Fullstack Developer, and Mobile Developer. Each path has a curated list of 5-8 core skills.

For each path, the endpoint runs skill gap analysis and generates a learning roadmap, returning all eight paths with match percentages, matched/missing skill lists, and recommended courses.

---

## 8.8 Skill Demand Forecast Endpoint (routes_analytics.py)

The `GET /skill-demand/{skill_name}` endpoint accepts a skill name and optional `years` parameter (default: 3). It trains a Random Forest Regressor on historical demand data and projects future demand trends. The response includes the skill name, training data used, and per-year forecasted demand counts.

> **\[SCREENSHOT PLACEHOLDER: Swagger UI showing all API endpoints with interactive documentation\]**

---

## 8.9 Summary

This chapter documented the FastAPI application setup, CORS configuration, and all ten REST endpoints. The API layer orchestrates the NLP pipeline, ML models, and recommendation engines through a clean, versioned endpoint structure with JWT authentication on protected routes.

---

\newpage

