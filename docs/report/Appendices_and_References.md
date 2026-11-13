
# Appendix A: Complete Source Code Listings

---

## A.1 Backend — main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.database import init_db
from backend.api import routes_resume, routes_jobs, routes_learning, routes_analytics, routes_auth

app = FastAPI(
    title="Smart Career & Resume AI Platform",
    description="Backend API powering the Resume NLP and Job ML Models.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(routes_auth.router, prefix="/api/v1")
app.include_router(routes_resume.router, prefix="/api/v1")
app.include_router(routes_jobs.router, prefix="/api/v1")
app.include_router(routes_learning.router, prefix="/api/v1")
app.include_router(routes_analytics.router, prefix="/api/v1")

@app.get("/")
def check_health():
    return {"status": "operational", "message": "ML Engine Online"}
```

## A.2 Backend — core/database.py

*See Chapter 4, Section 4.2.1 for complete code listing with annotations.*

## A.3 Backend — core/models.py

*See Chapter 4, Sections 4.4–4.10 for complete code listings with annotations.*

## A.4 Backend — api/routes_auth.py

*See Chapter 5 for complete code listing with annotations.*

## A.5 Backend — api/routes_resume.py

*See Chapter 6, Section 6.9 for complete code listing with annotations.*

## A.6 Backend — api/routes_jobs.py

*See Chapter 8, Section 8.5 for complete code listing with annotations.*

## A.7 Backend — api/routes_learning.py

*See Chapter 8, Sections 8.6–8.7 for complete code listing with annotations.*

## A.8 Backend — api/routes_analytics.py

*See Chapter 8, Section 8.8 for complete code listing with annotations.*

## A.9 Backend — nlp_engine/parser.py

*See Chapter 6, Section 6.2 for complete code listing with annotations.*

## A.10 Backend — nlp_engine/skill_extractor.py

*See Chapter 6, Sections 6.3–6.7 for complete code listings with annotations.*

## A.11 Backend — nlp_engine/gap_analyzer.py

*See Chapter 6, Section 6.8 for complete code listing with annotations.*

## A.12 Backend — ML_models/matcher.py

*See Chapter 7, Sections 7.2–7.3 for complete code listings with annotations.*

## A.13 Backend — ML_models/clustering.py

*See Chapter 7, Section 7.4 for complete code listing with annotations.*

## A.14 Backend — ML_models/predictor.py

*See Chapter 7, Section 7.5 for complete code listing with annotations.*

## A.15 Backend — ML_models/content_recs.py

*See Chapter 7, Section 7.6 for complete code listing with annotations.*

## A.16 Frontend — src/lib/api.ts

*See Chapter 9, Section 9.8 for complete code listing with annotations.*

---

\newpage

# Appendix B: API Documentation

---

## B.1 Swagger UI

FastAPI automatically generates interactive API documentation accessible at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

> **\[SCREENSHOT PLACEHOLDER: Swagger UI showing the complete API documentation with all endpoints\]**

## B.2 API Endpoint Details

### B.2.1 POST /api/v1/auth/signup

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "current_role": "Software Developer",
  "target_role": "Data Scientist"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "token_type": "bearer",
  "user_id": 1,
  "name": "John Doe"
}
```

### B.2.2 POST /api/v1/auth/login

**Request (form-data):**
```
username=john@example.com&password=securepass123
```

**Response (200):** Same as signup.

### B.2.3 POST /api/v1/upload-resume/

**Request:** `multipart/form-data` with file field

**Response (200):**
```json
{
  "message": "Resume parsed successfully",
  "detected_skills": ["python", "sql", "machine learning", "pandas"],
  "skill_scores": {"python": 93, "sql": 86, "machine learning": 91},
  "vector_count": 4
}
```

### B.2.4 POST /api/v1/roadmap/analyze-career-paths

**Request:**
```json
{
  "extracted_skills": ["python", "sql", "machine learning", "pandas"]
}
```

**Response (200):**
```json
{
  "recommended_paths": [
    {
      "career": "Data Scientist",
      "match_percentage": 85.7,
      "matched_skills": ["python", "sql", "machine learning", "pandas"],
      "missing_skills": ["scikit-learn", "statistics"],
      "learning_roadmap": [
        {"skill": "scikit-learn", "title": "Core Concepts: Understanding Scikit-Learn", "difficulty": "Beginner"},
        {"skill": "scikit-learn", "title": "Applied Scikit-Learn: Best Practices", "difficulty": "Intermediate"}
      ],
      "platform_links": {
        "indeed": "https://www.indeed.com/jobs?q=Data+Scientist",
        "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Data+Scientist"
      }
    }
  ]
}
```

### B.2.5 GET /api/v1/skill-demand/{skill_name}

**Response (200):**
```json
{
  "skill": "python",
  "trend_data": [
    {"year": 2025, "projected_demand": 320},
    {"year": 2026, "projected_demand": 384},
    {"year": 2027, "projected_demand": 461}
  ],
  "growing": true
}
```

---

\newpage

# Appendix C: Database Schema Diagrams

---

## C.1 Physical Database Schema

> **\[SCREENSHOT PLACEHOLDER: SQLite database opened in DB Browser for SQLite showing all 7 tables\]**

> **\[SCREENSHOT PLACEHOLDER: Users table structure showing column types and constraints\]**

> **\[SCREENSHOT PLACEHOLDER: User_skills table with sample data rows\]**

> **\[SCREENSHOT PLACEHOLDER: Jobs table with sample data including JSON required_skills column\]**

---

\newpage

# Appendix D: User Manual

---

## D.1 System Requirements

### D.1.1 Backend Requirements
- Python 3.10 or higher
- pip package manager
- 4 GB RAM minimum (for BERT model)
- 2 GB disk space (for NLP models)

### D.1.2 Frontend Requirements
- Node.js 18 or higher
- npm or yarn package manager

### D.1.3 Browser Requirements
- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- WebGL 2.0 support (for 3D visualization)

---

## D.2 Installation Guide

### D.2.1 Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-repo/smart-career-platform.git
cd smart-career-platform

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r backend/requirements.txt

# Download SpaCy model
python -m spacy download en_core_web_md

# Start the backend server
uvicorn backend.main:app --reload --port 8000
```

### D.2.2 Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### D.2.3 Verification

After starting both servers:
- Backend: `http://localhost:8000` → Should display `{"status": "operational"}`
- Frontend: `http://localhost:3000` → Should display the landing page
- API Docs: `http://localhost:8000/docs` → Should display Swagger UI

---

## D.3 User Guide

### D.3.1 Registration
1. Navigate to `http://localhost:3000`
2. Click "Sign In" on the landing page
3. Click "Register" to toggle to registration mode
4. Enter your name, email, and password
5. Click "Create Account"
6. You will be redirected to the upload page

### D.3.2 Resume Upload
1. Drag and drop your resume file (PDF or TXT) onto the upload area
2. Alternatively, click the upload area to browse files
3. Click "Initiate Neural Scan"
4. Wait for the scanning animation to complete
5. You will be redirected to the dashboard

### D.3.3 Dashboard Navigation
1. **Detected Skills**: View your extracted skills with proficiency scores
2. **Career Alignment Radar**: See how your skills align with different roles
3. **Recommended Career**: View your best-matching career path
4. **Alternative Matches**: Explore other career options
5. **Market Trends**: See growing vs declining technology fields
6. **Skill Gap Details**: Click on any career card to expand and see:
   - Matched skills (green)
   - Missing skills (red)
   - Learning roadmap with phases
7. **Platform Links**: Click to search for jobs on Indeed, LinkedIn, Google Jobs, Naukri, or Glassdoor

> **\[SCREENSHOT PLACEHOLDER: Step-by-step annotated screenshots of the complete user flow\]**

---

\newpage

# References

---

1. Al-Otaibi, S.T. and Ykhlef, M. (2012). "A Survey of Job Recommender Systems." *International Journal of Physical Sciences*, 7(29), pp. 5127-5142.

2. Apache Foundation (2023). "Apache Tika — Content Detection and Analysis Framework." *https://tika.apache.org/.*

3. Breiman, L. (2001). "Random Forests." *Machine Learning*, 45(1), pp. 5-32.

4. Burke, R. (2002). "Hybrid Recommender Systems: Survey and Experiments." *User Modeling and User-Adapted Interaction*, 12(4), pp. 331-370.

5. Dave, V.S., Zhang, B., Al Hasan, M., AlJadda, K. and Korayem, M. (2018). "A Combined Representation Learning Approach for Better Job and Skill Recommendation." *Proceedings of the 27th ACM International Conference on Information and Knowledge Management*, pp. 1997-2000.

6. Devlin, J., Chang, M.W., Lee, K. and Toutanova, K. (2019). "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding." *Proceedings of NAACL-HLT 2019*, pp. 4171-4186.

7. Fenniak, M. (2023). "PyPDF: A Python library to read and write PDF files." *https://pypdf.readthedocs.io/.*

8. Gugnani, A. and Misra, H. (2020). "Implicit Skills Extraction Using Document Embedding and Its Use in Job Recommendation." *Proceedings of the AAAI Conference on Artificial Intelligence*, 34(08), pp. 13286-13293.

9. Honnibal, M. and Montani, I. (2017). "spaCy 2: Natural Language Understanding with Bloom Embeddings, Convolutional Neural Networks and Incremental Parsing." *To appear.*

10. Huang, A. (2008). "Similarity Measures for Text Document Clustering." *Proceedings of the New Zealand Computer Science Research Student Conference*, pp. 49-56.

11. Jiang, Z., Xu, J., Cai, Y., Shi, Z. and Chen, J. (2020). "Personalized Career Path Recommendation Based on Knowledge Graph." *IEEE Access*, 8, pp. 160770-160783.

12. Kopparapu, S.K. (2010). "Automatic Extraction of Usable Information from Unstructured Resumes to Aid Search." *Proceedings of IEEE ICPADS*, pp. 99-103.

13. Koren, Y., Bell, R. and Volinsky, C. (2009). "Matrix Factorization Techniques for Recommender Systems." *Computer*, 42(8), pp. 30-37.

14. Luo, Y., Zhang, H., Wen, Y. and Zhang, X. (2019). "ResumeGAN: An Optimized Deep Representation Learning Framework for Talent-Job Fit via Adversarial Learning." *Proceedings of the 28th ACM International Conference on Information and Knowledge Management*, pp. 1101-1110.

15. MacQueen, J.B. (1967). "Some Methods for Classification and Analysis of Multivariate Observations." *Proceedings of the 5th Berkeley Symposium on Mathematical Statistics and Probability*, pp. 281-297.

16. Pazzani, M.J. and Billsus, D. (2007). "Content-Based Recommendation Systems." *The Adaptive Web*, pp. 325-341.

17. Pedregosa, F. et al. (2011). "Scikit-learn: Machine Learning in Python." *Journal of Machine Learning Research*, 12, pp. 2825-2830.

18. Qin, C., Zhu, H., Xu, T., Zhu, C., Jiang, L., Chen, E. and Xiong, H. (2018). "Enhancing Person-Job Fit for Talent Recruitment: An Ability-Aware Neural Network Approach." *The 41st International ACM SIGIR Conference*, pp. 25-34.

19. Ramírez, S. (2018). "FastAPI — Modern, Fast Web Framework for Building APIs with Python." *https://fastapi.tiangolo.com/.*

20. Reimers, N. and Gurevych, I. (2019). "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks." *Proceedings of EMNLP-IJCNLP 2019*, pp. 3982-3992.

21. Salton, G. and Buckley, C. (1988). "Term-Weighting Approaches in Automatic Text Retrieval." *Information Processing & Management*, 24(5), pp. 513-523.

22. Singer-Vine, J. (2020). "pdfplumber: Plumb a PDF for detailed information about each text character, rectangle, and line." *https://github.com/jsvine/pdfplumber.*

23. Sparck Jones, K. (1972). "A Statistical Interpretation of Term Specificity and Its Application in Retrieval." *Journal of Documentation*, 28(1), pp. 11-21.

24. Vercel Inc. (2016). "Next.js: The React Framework for Production." *https://nextjs.org/.*

25. World Economic Forum (2020). "The Future of Jobs Report 2020." *https://www.weforum.org/reports/the-future-of-jobs-report-2020.*

26. Zhu, C., Zhu, H., Xiong, H., Ma, C., Xie, F., Ding, P. and Li, P. (2018). "Person-Job Fit: Adapting the Right Talent for the Right Job with Joint Representation Learning." *ACM Transactions on Management Information Systems*, 9(3), pp. 1-17.

---

\newpage

