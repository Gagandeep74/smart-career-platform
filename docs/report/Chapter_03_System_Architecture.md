
# Chapter 3: System Architecture and Design

---

## 3.1 Introduction

This chapter presents the comprehensive system architecture and design of the Smart Career & Resume AI Platform. A well-thought-out architecture is the foundation of any robust software system, ensuring modularity, scalability, maintainability, and performance. The chapter covers the high-level system architecture, technology stack selection rationale, backend and frontend architectures, database design, API design conventions, authentication architecture, NLP and ML pipeline architectures, data flow diagrams, and deployment architecture.

The system is designed following the **three-tier architecture pattern**, which separates the application into three distinct logical layers: Presentation (Frontend), Business Logic (Backend), and Data (Database + External APIs). This separation ensures that each layer can be developed, tested, deployed, and scaled independently.

---

## 3.2 High-Level System Architecture

The Smart Career Platform architecture comprises three primary tiers connected through RESTful API communication:

```mermaid
graph TB
    subgraph Client_Tier ["Presentation Tier"]
        direction LR
        BROWSER["Web Browser"]
        NEXT["Next.js 16<br/>React 19<br/>TypeScript"]
        THREE["Three.js<br/>3D Rendering"]
        CHARTS["Chart.js<br/>Visualizations"]
        FRAMER["Framer Motion<br/>Animations"]
        TW["TailwindCSS 4<br/>Styling"]
    end

    subgraph Server_Tier ["Business Logic Tier"]
        direction TB
        FASTAPI["FastAPI Server<br/>Uvicorn ASGI"]

        subgraph Routes ["API Routes Layer"]
            R_AUTH["routes_auth.py"]
            R_RES["routes_resume.py"]
            R_JOBS["routes_jobs.py"]
            R_LEARN["routes_learning.py"]
            R_ANA["routes_analytics.py"]
        end

        subgraph NLP ["NLP Engine Layer"]
            PARSER["parser.py"]
            SKILL_EXT["skill_extractor.py"]
            GAP_ANA["gap_analyzer.py"]
        end

        subgraph ML ["ML Models Layer"]
            MATCHER["matcher.py"]
            CLUSTER["clustering.py"]
            PRED["predictor.py"]
            CONTENT["content_recs.py"]
        end

        subgraph Core ["Core Infrastructure"]
            DB_CFG["database.py"]
            MODELS["models.py"]
        end
    end

    subgraph Data_Tier ["Data Tier"]
        SQLITE[("SQLite DB<br/>career_platform.db")]
        REMOTIVE["Remotive API"]
        ADZUNA["Adzuna API"]
    end

    BROWSER --> NEXT
    NEXT -.->|"HTTP/REST"| FASTAPI

    FASTAPI --> Routes
    Routes --> NLP
    Routes --> ML
    Routes --> Core

    Core --> SQLITE
    ML --> REMOTIVE
    ML --> ADZUNA
```

**Figure 3.1: High-Level System Architecture Diagram**

### 3.2.1 Architecture Principles

The following design principles guided the architecture:

1. **Separation of Concerns**: Each module has a single, well-defined responsibility. The NLP engine handles text processing, the ML layer handles predictions, the API layer handles HTTP communication, and the frontend handles user interaction.

2. **Loose Coupling**: Modules interact through well-defined interfaces (function calls and API endpoints), minimizing dependencies between components.

3. **High Cohesion**: Related functionality is grouped together within the same module (e.g., all authentication logic in `routes_auth.py`).

4. **Statelessness**: The backend API is stateless — each request contains all information needed for processing (via JWT tokens). This simplifies scaling and deployment.

5. **Progressive Enhancement**: The system degrades gracefully when external services are unavailable (e.g., the job API fallback mechanism).

---

## 3.3 Technology Stack Selection

### 3.3.1 Backend Technology Stack

| Technology | Version | Purpose | Selection Rationale |
|---|---|---|---|
| **Python** | 3.10+ | Core language | Rich ML/NLP ecosystem, widely used in data science |
| **FastAPI** | 0.104.1 | Web framework | High performance, type safety, auto docs, async support |
| **Uvicorn** | 0.24.0 | ASGI server | Production-grade ASGI server for FastAPI |
| **SQLAlchemy** | 2.0.23 | ORM | Industry-standard Python ORM, database-agnostic |
| **Pydantic** | 2.4.2 | Data validation | Automatic request/response validation via type hints |
| **SpaCy** | Latest | NLP processing | Fast, industrial-strength NLP, pre-trained models |
| **Transformers** | Latest | BERT embeddings | HuggingFace ecosystem, extensive pre-trained models |
| **PyTorch** | Latest | ML framework | Required by HuggingFace Transformers |
| **Scikit-Learn** | Latest | ML algorithms | TF-IDF, K-Means, Random Forest implementations |
| **Pandas** | Latest | Data manipulation | DataFrame operations for ML pipelines |
| **NumPy** | Latest | Numerical computing | Array operations, mathematical functions |
| **pdfplumber** | Latest | PDF extraction | Superior table and layout handling |
| **PyPDF** | Latest | PDF extraction | Fallback PDF text extraction |
| **python-jose** | Latest | JWT tokens | JWT encoding/decoding with cryptographic support |
| **passlib+bcrypt** | Latest | Password hashing | Secure password hashing with salt |

**Table 3.1: Backend Technology Stack**

### 3.3.2 Frontend Technology Stack

| Technology | Version | Purpose | Selection Rationale |
|---|---|---|---|
| **Next.js** | 16.2.1 | React framework | SSR, file-based routing, optimized builds |
| **React** | 19.2.4 | UI library | Component-based architecture, virtual DOM |
| **TypeScript** | 5.x | Language | Type safety, better IDE support, fewer runtime errors |
| **TailwindCSS** | 4.x | Styling | Utility-first CSS, rapid prototyping, consistent design |
| **Three.js** | 0.183.2 | 3D rendering | WebGL-based 3D visualization |
| **React Three Fiber** | 9.6.0 | React + Three.js | Declarative Three.js with React component model |
| **Drei** | 10.7.7 | Three.js helpers | Pre-built 3D components (Stars, Float, Sphere) |
| **Chart.js** | 4.5.1 | Charts | Responsive, animated chart library |
| **react-chartjs-2** | 5.3.1 | React + Chart.js | React wrapper for Chart.js |
| **Framer Motion** | 12.38.0 | Animations | Declarative animation library for React |
| **Lucide React** | 1.7.0 | Icons | Modern, customizable icon library |
| **react-tilt** | 1.0.2 | Tilt effects | 3D parallax tilt effect for cards |

**Table 3.2: Frontend Technology Stack**

---

## 3.4 Backend Architecture (FastAPI)

### 3.4.1 Module Organization

The backend follows a modular architecture organized into four major directories:

```
backend/
├── main.py                  # Application entry point
├── requirements.txt         # Python dependencies
├── test_auth.py            # Authentication tests
├── api/                    # API Route Handlers
│   ├── routes_auth.py      # Authentication endpoints
│   ├── routes_resume.py    # Resume processing endpoint
│   ├── routes_jobs.py      # Job recommendation endpoint
│   ├── routes_learning.py  # Roadmap & career path endpoints
│   └── routes_analytics.py # Skill demand forecast endpoint
├── core/                   # Core Infrastructure
│   ├── database.py         # Database engine & session setup
│   └── models.py           # SQLAlchemy ORM models
├── nlp_engine/             # NLP Processing Modules
│   ├── parser.py           # PDF/TXT text extraction
│   ├── skill_extractor.py  # SpaCy + BERT skill extraction
│   └── gap_analyzer.py     # Skill gap computation
└── ML_models/              # Machine Learning Modules
    ├── matcher.py          # TF-IDF job matching + live API
    ├── clustering.py       # K-Means job clustering
    ├── predictor.py        # Random Forest demand prediction
    └── content_recs.py     # Learning path recommendation
```

**Figure 3.4: FastAPI Backend Module Organization**

### 3.4.2 Application Initialization

The FastAPI application is initialized in `main.py`, which serves as the entry point for the entire backend. The initialization process involves:

1. **Creating the FastAPI instance** with metadata (title, description, version)
2. **Configuring CORS middleware** to allow cross-origin requests from the frontend
3. **Registering startup events** for database initialization
4. **Including API routers** with URL prefixes

```python
# main.py - Application Entry Point
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.database import init_db
from backend.api import routes_resume, routes_jobs, routes_learning, 
                        routes_analytics, routes_auth

app = FastAPI(
    title="Smart Career & Resume AI Platform",
    description="Backend API powering the Resume NLP and Job ML Models.",
    version="1.0.0"
)

# CORS Configuration for Frontend Communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Initialization on Startup
@app.on_event("startup")
def on_startup():
    init_db()

# Router Registration with API Versioning
app.include_router(routes_auth.router, prefix="/api/v1")
app.include_router(routes_resume.router, prefix="/api/v1")
app.include_router(routes_jobs.router, prefix="/api/v1")
app.include_router(routes_learning.router, prefix="/api/v1")
app.include_router(routes_analytics.router, prefix="/api/v1")

# Health Check Endpoint
@app.get("/")
def check_health():
    return {"status": "operational", "message": "ML Engine Online"}
```

### 3.4.3 Request Processing Pipeline

Every incoming HTTP request passes through the following processing pipeline:

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant CORS as CORS Middleware
    participant Router as FastAPI Router
    participant Deps as Dependencies (DB, Auth)
    participant Handler as Route Handler
    participant Service as Service Layer (NLP/ML)
    participant DB as SQLite Database

    Client->>CORS: HTTP Request
    CORS->>Router: Validated CORS Request
    Router->>Deps: Resolve Dependencies
    Deps->>Handler: Injected Session + User
    Handler->>Service: Business Logic Call
    Service->>DB: Database Query/Write
    DB-->>Service: Query Results
    Service-->>Handler: Processed Results
    Handler-->>Client: JSON Response
```

**Figure 3.4.3: Request Processing Pipeline — Sequence Diagram**

---

## 3.5 Frontend Architecture (Next.js)

### 3.5.1 Next.js App Router Structure

The frontend uses Next.js 16's App Router, which employs a file-system based routing convention:

```
frontend/src/
├── app/                          # App Router Root
│   ├── layout.tsx               # Root layout (HTML, head, body)
│   ├── page.tsx                 # Landing page (/)
│   ├── globals.css              # Global styles + design tokens
│   ├── favicon.ico              # Site favicon
│   ├── login/
│   │   └── page.tsx             # Login/Register page (/login)
│   ├── upload/
│   │   └── page.tsx             # Resume upload page (/upload)
│   └── dashboard/
│       └── page.tsx             # Analytics dashboard (/dashboard)
├── components/                   # Reusable Components
│   ├── AnalyticsCharts.tsx      # Chart components
│   ├── AuthNavigation.tsx       # Auth-aware navigation
│   ├── JobCard.tsx              # Job listing card
│   ├── RoadmapTimeline.tsx      # Learning timeline
│   ├── Sidebar.tsx              # Navigation sidebar
│   └── UploadDropzone.tsx       # File upload zone
└── lib/
    └── api.ts                   # API client wrapper
```

**Figure 3.5: Next.js Frontend Application Structure**

### 3.5.2 Component Architecture

The frontend follows a component-based architecture where each page is composed of reusable, self-contained components:

```mermaid
graph TB
    subgraph Root_Layout ["RootLayout (layout.tsx)"]
        direction TB

        subgraph Landing_Page ["Landing Page (page.tsx)"]
            BRAIN_3D["InteractiveBrain<br/>Three.js Component"]
            HERO["Hero Section<br/>Framer Motion"]
            NAV["Navigation Bar<br/>Auth-aware"]
        end

        subgraph Login_Page ["Login Page (login/page.tsx)"]
            AUTH_FORM["AuthForm<br/>Login / Register Toggle"]
            VALIDATION["Form Validation"]
        end

        subgraph Upload_Page ["Upload Page (upload/page.tsx)"]
            DROPZONE["UploadDropzone<br/>Drag & Drop"]
            SCANNER["NeuralScanner<br/>Animation"]
        end

        subgraph Dashboard_Page ["Dashboard (dashboard/page.tsx)"]
            CHARTS_SEC["Charts Section<br/>Radar, Bar, Line, Doughnut"]
            PATHS_SEC["Career Paths<br/>Expandable Cards"]
            ROADMAP_SEC["Learning Roadmaps<br/>Phase-based"]
            GAPS_SEC["Skill Gaps<br/>Missing Skills Display"]
        end
    end
```

**Figure 3.5.2: Frontend Component Hierarchy**

### 3.5.3 State Management

The frontend uses React's built-in state management through:

- **`useState`**: Local component state for UI interactions (form inputs, toggles, loading states)
- **`useEffect`**: Side effects for data fetching and localStorage access
- **`localStorage`**: Client-side persistence for authentication tokens, user data, and extracted skills

No external state management library (Redux, Zustand) is used, as the application's state complexity is manageable with React's built-in hooks.

---

## 3.6 Database Design

### 3.6.1 Entity-Relationship Diagram

```mermaid
erDiagram
    USERS {
        int id PK
        string name
        string email UK
        string hashed_password
        string current_role
        string target_role
        datetime created_at
    }

    USER_SKILLS {
        int id PK
        int user_id FK
        string skill_name
        float proficiency
    }

    JOBS {
        int id PK
        string title
        string company
        text description
        json required_skills
        int cluster_id
        string external_url
        datetime posted_date
        datetime created_at
    }

    COURSES {
        int id PK
        string title
        string skill_tag
        string difficulty
        string url
        string content_type
    }

    ROADMAP {
        int id PK
        int user_id FK
        string target_role
        int phase
        datetime created_at
    }

    PROGRESS {
        int id PK
        int user_id FK
        int course_id FK
        string status
        datetime completion_date
    }

    API_CACHE {
        int id PK
        string endpoint
        string query_params
        json response_data
        datetime expires_at
    }

    USERS ||--o{ USER_SKILLS : "has many"
    USERS ||--o{ ROADMAP : "has many"
    USERS ||--o{ PROGRESS : "tracks"
    COURSES ||--o{ PROGRESS : "tracked in"
```

**Figure 3.6: Entity-Relationship Diagram — Complete Database Schema**

### 3.6.2 Database Design Decisions

1. **SQLite Selection**: Chosen for development simplicity, zero-configuration deployment, and serverless operation. The single-file database format simplifies local development and testing. For production scaling, migration to PostgreSQL is straightforward via SQLAlchemy's database-agnostic ORM.

2. **JSON Columns**: The `required_skills` field in the `jobs` table uses a JSON column type to store variable-length skill lists without requiring a separate junction table.

3. **Soft Relationships**: While `courses` has no direct foreign key relationship with `roadmap`, they are connected semantically through `skill_tag` matching during roadmap generation.

4. **Caching Layer**: The `api_cache` table provides a simple time-based caching mechanism for external API responses, reducing API call frequency and improving response times.

---

## 3.7 API Design and RESTful Conventions

### 3.7.1 Endpoint Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | No | Health check |
| `POST` | `/api/v1/auth/signup` | No | User registration |
| `POST` | `/api/v1/auth/login` | No | User authentication |
| `GET` | `/api/v1/auth/me` | JWT | Get current user profile |
| `POST` | `/api/v1/upload-resume/` | No* | Upload and parse resume |
| `GET` | `/api/v1/recommend-jobs/{user_id}` | No* | Get job recommendations |
| `GET` | `/api/v1/roadmap/{user_id}/{job_id}` | No* | Generate learning roadmap |
| `POST` | `/api/v1/roadmap/live-pivot` | JWT | Live career pivot analysis |
| `POST` | `/api/v1/roadmap/analyze-career-paths` | No* | Multi-path career analysis |
| `GET` | `/api/v1/skill-demand/{skill_name}` | No | Skill demand forecast |

**Table 3.3: RESTful API Endpoints Summary**

*\*These endpoints accept auth headers but do not strictly require them for backward compatibility.*

### 3.7.2 API Versioning

All API endpoints are prefixed with `/api/v1/` to support future versioning. When breaking changes are introduced, a new version (`/api/v2/`) can be deployed alongside the existing version, allowing gradual migration.

### 3.7.3 Response Format

All API responses follow a consistent JSON format:

```json
// Success Response
{
    "message": "Operation completed successfully",
    "data": { ... },
    "count": 10
}

// Error Response (handled by FastAPI HTTPException)
{
    "detail": "Error description message"
}
```

---

## 3.8 Authentication Architecture

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant Frontend as Next.js Frontend
    participant Backend as FastAPI Backend
    participant DB as SQLite Database

    Note over User, DB: Registration Flow
    User->>Frontend: Fill signup form
    Frontend->>Backend: POST /api/v1/auth/signup
    Backend->>DB: Check email uniqueness
    DB-->>Backend: No existing user
    Backend->>Backend: Hash password (bcrypt)
    Backend->>DB: INSERT new user
    Backend->>Backend: Generate JWT token
    Backend-->>Frontend: {access_token, user_id, name}
    Frontend->>Frontend: Store token in localStorage

    Note over User, DB: Login Flow
    User->>Frontend: Enter credentials
    Frontend->>Backend: POST /api/v1/auth/login (OAuth2 form)
    Backend->>DB: Find user by email
    Backend->>Backend: Verify password (bcrypt)
    Backend->>Backend: Generate JWT token
    Backend-->>Frontend: {access_token, user_id, name}
    Frontend->>Frontend: Store token in localStorage

    Note over User, DB: Protected Request
    User->>Frontend: Access dashboard
    Frontend->>Backend: GET /api/v1/auth/me (Bearer token)
    Backend->>Backend: Decode JWT token
    Backend->>DB: Find user by ID
    Backend-->>Frontend: User profile data
```

**Figure 3.8: JWT Authentication Flow — Complete Sequence Diagram**

---

## 3.9 NLP Pipeline Architecture

```mermaid
graph TB
    subgraph Input ["Input Stage"]
        PDF["PDF File"] --> PLUMBER["pdfplumber<br/>Primary Extractor"]
        PDF --> PYPDF["PyPDF<br/>Fallback Extractor"]
        TXT["TXT File"] --> DECODE["UTF-8 / Latin-1<br/>Decoder"]
    end

    subgraph Processing ["NLP Processing Stage"]
        RAW["Raw Text"] --> SPACY["SpaCy en_core_web_md"]
        SPACY --> NOUN["Noun Chunks<br/>Extraction"]
        SPACY --> NER["Named Entity<br/>Recognition"]

        RAW --> WHITELIST["Master Whitelist<br/>Regex Matching<br/>(80+ Skills)"]

        NOUN --> RAW_SKILLS["Raw Extracted Skills"]
        NER --> RAW_SKILLS

        WHITELIST --> CLEAN_SKILLS["Cleaned Skills<br/>+ Confidence Scores"]
    end

    subgraph Embedding ["Embedding Stage"]
        CLEAN_SKILLS --> BERT["BERT<br/>all-MiniLM-L6-v2"]
        BERT --> TOKENIZE["Tokenization"]
        TOKENIZE --> ENCODE["Transformer Encoding"]
        ENCODE --> POOL["Mean Pooling"]
        POOL --> VECTORS["384-dim Skill Vectors"]
    end

    subgraph Output ["Output Stage"]
        RAW_SKILLS --> RESULT["Result Dictionary"]
        CLEAN_SKILLS --> RESULT
        VECTORS --> RESULT
        RESULT --> DB_STORE["Store in SQLite"]
        RESULT --> API_RESP["Return to Frontend"]
    end

    PLUMBER --> RAW
    PYPDF -.->|"Fallback"| RAW
    DECODE --> RAW
```

**Figure 3.9: NLP Processing Pipeline Architecture**

---

## 3.10 ML Pipeline Architecture

```mermaid
graph LR
    subgraph Input ["User Inputs"]
        SKILLS["Extracted Skills"]
        TARGET["Target Role"]
    end

    subgraph Matching ["Job Matching Module"]
        TFIDF["TF-IDF Vectorizer"]
        COS["Cosine Similarity"]
        RANK["Ranking Engine"]
    end

    subgraph Jobs ["Job Data Sources"]
        DB_JOBS["SQLite Jobs"]
        REMOTIVE["Remotive API"]
        ADZUNA["Adzuna API"]
        FALLBACK["Dynamic Fallback"]
    end

    subgraph Analysis ["Analysis Modules"]
        GAP["Skill Gap<br/>Calculator"]
        KMEANS["K-Means<br/>Clustering"]
        RF["Random Forest<br/>Predictor"]
    end

    subgraph Output ["Recommendations"]
        REC_JOBS["Matched Jobs"]
        ROAD["Learning Roadmap"]
        PATHS["Career Paths"]
        FORECAST["Demand Forecast"]
    end

    SKILLS --> TFIDF
    TFIDF --> COS
    COS --> RANK

    DB_JOBS --> TFIDF
    REMOTIVE --> TFIDF
    ADZUNA --> TFIDF
    FALLBACK -.-> TFIDF

    SKILLS --> GAP
    TARGET --> GAP

    GAP --> ROAD
    RANK --> REC_JOBS
    KMEANS --> PATHS
    RF --> FORECAST
```

**Figure 3.10: ML Model Integration Architecture**

---

## 3.11 Data Flow Diagrams

### 3.11.1 Level 0 — Context Diagram

```mermaid
graph LR
    USER(("User"))
    SYSTEM["Smart Career<br/>Platform"]
    REMOTIVE_EXT["Remotive API"]
    ADZUNA_EXT["Adzuna API"]

    USER -->|"Resume, Credentials,<br/>Target Role"| SYSTEM
    SYSTEM -->|"Extracted Skills,<br/>Job Matches,<br/>Roadmaps,<br/>Career Paths"| USER
    REMOTIVE_EXT -->|"Live Job Data"| SYSTEM
    ADZUNA_EXT -->|"Live Job Data"| SYSTEM
```

**Figure 3.11: Data Flow Diagram — Level 0 (Context Diagram)**

### 3.11.2 Level 1 — Detailed Data Flow

```mermaid
graph TB
    USER(("User")) --> P1["1.0<br/>Authentication"]
    USER --> P2["2.0<br/>Resume Upload"]
    USER --> P3["3.0<br/>Career Analysis"]

    P1 --> DS1[("Users DB")]
    DS1 --> P1

    P2 --> P2_1["2.1 Parse PDF/TXT"]
    P2_1 --> P2_2["2.2 Extract Skills (NLP)"]
    P2_2 --> P2_3["2.3 Generate Embeddings"]
    P2_3 --> DS2[("Skills DB")]

    P3 --> P3_1["3.1 Gap Analysis"]
    P3 --> P3_2["3.2 Job Matching"]
    P3 --> P3_3["3.3 Roadmap Gen"]

    DS2 --> P3_1
    DS3[("Jobs DB")] --> P3_2
    EXT["External APIs"] --> P3_2
    P3_1 --> P3_3
    DS4[("Courses DB")] --> P3_3

    P3_2 --> USER
    P3_3 --> USER
```

**Figure 3.12: Data Flow Diagram — Level 1**

---

## 3.12 Deployment Architecture

```mermaid
graph TB
    subgraph Client ["Client Browser"]
        BROWSER["Web Browser<br/>(Chrome, Firefox, Safari)"]
    end

    subgraph Vercel ["Vercel (Frontend Hosting)"]
        CDN["Global CDN<br/>Edge Network"]
        NEXT_APP["Next.js Application<br/>SSR + Static"]
    end

    subgraph Render ["Render (Backend Hosting)"]
        UVICORN["Uvicorn Server<br/>ASGI Runtime"]
        FASTAPI_APP["FastAPI Application"]
        SQLITE_DB[("SQLite Database")]
    end

    subgraph External ["External Services"]
        REMOTIVE_SVC["Remotive API"]
        ADZUNA_SVC["Adzuna API"]
    end

    BROWSER -->|"HTTPS"| CDN
    CDN --> NEXT_APP
    NEXT_APP -->|"REST API Calls"| UVICORN
    UVICORN --> FASTAPI_APP
    FASTAPI_APP --> SQLITE_DB
    FASTAPI_APP --> REMOTIVE_SVC
    FASTAPI_APP --> ADZUNA_SVC
```

**Figure 3.13: Deployment Architecture Diagram**

---

## 3.13 Summary

This chapter presented the comprehensive system architecture and design of the Smart Career & Resume AI Platform. The three-tier architecture separates concerns into a Next.js 16 frontend, a FastAPI backend, and a SQLite data layer. The backend is organized into four modular directories (api, core, nlp_engine, ML_models) with 12 Python files implementing 8 API endpoints. The frontend consists of 4 pages and 6 reusable components. The database schema comprises 7 entity models with well-defined relationships. The NLP pipeline combines SpaCy NER, whitelist matching, and BERT embeddings for robust skill extraction. The ML pipeline integrates TF-IDF matching, K-Means clustering, and Random Forest prediction. Authentication uses JWT tokens with bcrypt hashing. The subsequent chapters provide detailed implementations of each module.

---

\newpage

