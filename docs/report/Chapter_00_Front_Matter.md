
# SMART CAREER & RESUME AI PLATFORM

## An Intelligent Career Recommendation System Using Natural Language Processing and Machine Learning

---

### A Project Report

Submitted in partial fulfillment of the requirements for the degree of

**Bachelor of Technology**

in

**Computer Science and Engineering**

---

**Submitted by:**

\[Student Name\]

\[Roll Number\]

---

**Under the Guidance of:**

\[Supervisor Name\]

\[Designation\]

---

**Department of Computer Science and Engineering**

\[University / Institution Name\]

\[Month, Year\]

---

\[Space for Institution Logo\]

---

\newpage

## Certificate

This is to certify that the project report entitled **"Smart Career & Resume AI Platform: An Intelligent Career Recommendation System Using Natural Language Processing and Machine Learning"** submitted by **\[Student Name\]**, Roll No. **\[Roll Number\]**, in partial fulfillment of the requirements for the award of the degree of **Bachelor of Technology** in **Computer Science and Engineering** from **\[University Name\]**, is a record of bonafide work carried out under my supervision and guidance.

The results embodied in this project report have not been submitted to any other university or institution for the award of any degree or diploma.

&nbsp;

**Date:**

&nbsp;

**Signature of Supervisor** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **Signature of Head of Department**

\[Supervisor Name\] &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; \[HOD Name\]

\[Designation\] &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; \[Designation\]

---

\newpage

## Declaration

I hereby declare that the project report entitled **"Smart Career & Resume AI Platform: An Intelligent Career Recommendation System Using Natural Language Processing and Machine Learning"** submitted to **\[University Name\]**, in partial fulfillment of the requirements for the award of the degree of **Bachelor of Technology** in **Computer Science and Engineering**, is a record of original work done by me under the supervision of **\[Supervisor Name\]**, and has not formed the basis for the award of any other degree or diploma, in this or any other institution or university.

I understand that if at any time it is shown that I have significantly misrepresented material presented in this report, any degree based upon such misrepresentation shall be immediately revoked.

&nbsp;

**Date:**

**Place:**

&nbsp;

**Signature of Candidate**

\[Student Name\]

\[Roll Number\]

---

\newpage

## Abstract

The rapid evolution of the global job market, driven by technological disruption, automation, and the emergence of new industries, has created significant challenges for job seekers in identifying optimal career paths aligned with their existing skill sets. Traditional career counseling approaches are often subjective, time-consuming, and limited in their ability to process the vast and constantly changing landscape of job requirements and skill demands. This project presents the **Smart Career & Resume AI Platform**, a comprehensive, full-stack web application that leverages advanced **Natural Language Processing (NLP)** and **Machine Learning (ML)** techniques to automate and intelligently optimize the career planning process.

The platform implements a multi-stage intelligent pipeline. First, resumes in PDF or plain text format are uploaded and parsed using robust text extraction libraries including **pdfplumber** and **PyPDF**. The extracted text is then processed through a dual NLP engine comprising **SpaCy** (for Named Entity Recognition and linguistic tokenization) and **HuggingFace BERT** (specifically, the `sentence-transformers/all-MiniLM-L6-v2` model for generating contextual skill embeddings). A curated whitelist of over 80 technical and non-technical skills is used alongside regex-based pattern matching to ensure high-precision skill extraction with computed confidence scores.

The extracted skills are subsequently matched against job requirements using **TF-IDF vectorization** and **cosine similarity** metrics for content-based job recommendation. The system integrates live job data from external APIs including the **Remotive API** (free, real-time remote job listings) and the optional **Adzuna API**, with an intelligent dynamic fallback mechanism. A **K-Means clustering** module groups similar job roles to identify alternative career paths, while a **Random Forest Regressor** is employed for time-series skill demand forecasting.

The **skill gap analysis** module mathematically computes the intersection and difference between user competencies and target role requirements, yielding match percentages and prioritized missing skill lists. These results feed into a **personalized learning roadmap generator** that creates multi-phase learning paths (Beginner → Intermediate → Advanced → Capstone) with direct links to curated educational resources.

The system architecture follows a clean separation of concerns: a **FastAPI** backend with modular API routes, **SQLAlchemy ORM** for database management with **SQLite**, and a modern **Next.js 16** frontend with **React 19**, **TypeScript**, **TailwindCSS 4**, **Three.js** for 3D visualizations, **Chart.js** for data analytics dashboards, and **Framer Motion** for smooth animations. Authentication is implemented via **JWT tokens** with **bcrypt** password hashing. The platform demonstrates effective integration of multiple AI/ML paradigms within a production-ready web application framework, providing actionable career intelligence to users in real-time.

**Keywords:** Natural Language Processing, Machine Learning, Resume Parsing, Career Recommendation, Skill Gap Analysis, TF-IDF, Cosine Similarity, K-Means Clustering, Random Forest Regression, BERT Embeddings, FastAPI, Next.js, Full-Stack Development.

---

\newpage

## Acknowledgements

I would like to express my deep and sincere gratitude to my project supervisor, **\[Supervisor Name\]**, **\[Designation\]**, Department of Computer Science and Engineering, **\[University Name\]**, for providing invaluable guidance, continuous encouragement, and constructive feedback throughout the duration of this project. Their profound knowledge and expertise in the fields of machine learning and software engineering significantly shaped the direction and quality of this work.

I am deeply grateful to **\[Head of Department Name\]**, Head of the Department of Computer Science and Engineering, for providing the necessary infrastructure and resources that facilitated the successful completion of this project.

I extend my heartfelt thanks to all the faculty members of the Department of Computer Science and Engineering for their teaching and mentorship during the course of my studies, which laid the strong foundation necessary for undertaking this project.

I would also like to acknowledge the contributions of the open-source community, particularly the developers and maintainers of FastAPI, Next.js, SpaCy, HuggingFace Transformers, Scikit-Learn, and the numerous other libraries and frameworks that made this project possible.

My sincere thanks also go to my classmates and friends for their constant support, helpful discussions, and encouragement during the challenging phases of this project.

Finally, I am eternally grateful to my parents and family members for their unconditional love, patience, and support throughout my academic journey. Their unwavering belief in my abilities has been my greatest source of motivation.

&nbsp;

&nbsp;

**\[Student Name\]**

**\[Date\]**

---

\newpage

## Contents

- Abstract ........................................................................................................................ i
- Acknowledgements ...................................................................................................... ii
- Contents ...................................................................................................................... iii
- List of Abbreviations .................................................................................................. vi
- List of Figures ........................................................................................................... viii
- List of Tables ............................................................................................................... x

### Chapter 1: Introduction and Problem Statement ......................................................... 1
- 1.1 Introduction ............................................................................................................ 1
- 1.2 Motivation .............................................................................................................. 3
- 1.3 Problem Statement ................................................................................................. 5
- 1.4 Objectives of the Project ........................................................................................ 7
- 1.5 Scope of the Project ............................................................................................... 8
- 1.6 Proposed System Framework ................................................................................. 9
- 1.7 Organization of the Project Report ....................................................................... 12

### Chapter 2: Literature Review ..................................................................................... 14
- 2.1 Introduction .......................................................................................................... 14
- 2.2 Resume Parsing and Information Extraction ........................................................ 15
- 2.3 Natural Language Processing for Skill Extraction ................................................ 18
- 2.4 Machine Learning for Job Recommendation ........................................................ 22
- 2.5 Content-Based Filtering and TF-IDF .................................................................... 26
- 2.6 Clustering Techniques for Career Grouping ......................................................... 29
- 2.7 Skill Gap Analysis and Learning Path Generation ............................................... 31
- 2.8 Time-Series Forecasting for Skill Demand .......................................................... 33
- 2.9 Modern Web Application Architectures ............................................................... 35
- 2.10 Comparative Analysis of Existing Systems ........................................................ 37
- 2.11 Research Gaps Identified .................................................................................... 40
- 2.12 Summary ............................................................................................................. 42

### Chapter 3: System Architecture and Design .............................................................. 43
- 3.1 Introduction .......................................................................................................... 43
- 3.2 High-Level System Architecture .......................................................................... 44
- 3.3 Technology Stack Selection ................................................................................. 47
- 3.4 Backend Architecture (FastAPI) ........................................................................... 50
- 3.5 Frontend Architecture (Next.js) ........................................................................... 53
- 3.6 Database Design ................................................................................................... 56
- 3.7 API Design and RESTful Conventions ................................................................. 60
- 3.8 Authentication Architecture ................................................................................. 63
- 3.9 NLP Pipeline Architecture ................................................................................... 65
- 3.10 ML Pipeline Architecture ................................................................................... 68
- 3.11 Data Flow Diagrams .......................................................................................... 70
- 3.12 Deployment Architecture ................................................................................... 73
- 3.13 Summary ............................................................................................................. 75

### Chapter 4: Core Infrastructure — Database and Models .......................................... 76
- 4.1 Introduction .......................................................................................................... 76
- 4.2 Database Configuration (database.py) .................................................................. 77
- 4.3 SQLAlchemy ORM Setup ..................................................................................... 79
- 4.4 User Model ........................................................................................................... 82
- 4.5 UserSkill Model ................................................................................................... 85
- 4.6 Job Model ............................................................................................................. 87
- 4.7 Course Model ....................................................................................................... 89
- 4.8 Roadmap Model ................................................................................................... 91
- 4.9 UserProgress Model ............................................................................................. 93
- 4.10 APICache Model ................................................................................................ 95
- 4.11 Entity-Relationship Diagram .............................................................................. 96
- 4.12 Database Session Management ........................................................................... 98
- 4.13 Summary ........................................................................................................... 100

### Chapter 5: Authentication and Security Module ..................................................... 101
- 5.1 Introduction ........................................................................................................ 101
- 5.2 Security Configuration ....................................................................................... 103
- 5.3 Password Hashing with Bcrypt .......................................................................... 105
- 5.4 JWT Token Generation and Validation ............................................................... 107
- 5.5 User Registration Endpoint ................................................................................ 110
- 5.6 User Login Endpoint .......................................................................................... 113
- 5.7 Protected Route — User Profile ......................................................................... 116
- 5.8 OAuth2 Password Bearer Flow ........................................................................... 118
- 5.9 Pydantic Schemas for Validation ........................................................................ 120
- 5.10 Security Best Practices and Recommendations ................................................ 122
- 5.11 Summary ........................................................................................................... 124

### Chapter 6: NLP Engine — Resume Processing Pipeline ......................................... 125
- 6.1 Introduction ........................................................................................................ 125
- 6.2 PDF Text Extraction (parser.py) ......................................................................... 127
- 6.3 Plain Text Extraction .......................................................................................... 130
- 6.4 SpaCy NER-Based Entity Extraction ................................................................. 132
- 6.5 Master Skill Whitelist Database .......................................................................... 136
- 6.6 Regex-Based Whitelist Matching ........................................................................ 139
- 6.7 Confidence Score Calculation ............................................................................. 142
- 6.8 BERT Contextual Embeddings ........................................................................... 145
- 6.9 Mean Pooling Strategy ....................................................................................... 148
- 6.10 Master Orchestrator — process_resume_text() ................................................. 151
- 6.11 Skill Gap Analysis Module ............................................................................... 154
- 6.12 Resume Upload API Integration ....................................................................... 157
- 6.13 NLP Pipeline Flow Diagram ............................................................................. 160
- 6.14 Summary ........................................................................................................... 162

### Chapter 7: Machine Learning Models ..................................................................... 163
- 7.1 Introduction ........................................................................................................ 163
- 7.2 TF-IDF Vectorization for Job Matching ............................................................. 165
- 7.3 Cosine Similarity Computation .......................................................................... 168
- 7.4 Live Job Data Fetching Pipeline ......................................................................... 171
- 7.5 Remotive API Integration ................................................................................... 174
- 7.6 Adzuna API Integration ...................................................................................... 177
- 7.7 Dynamic Fallback Mechanism ........................................................................... 179
- 7.8 Platform Link Generation ................................................................................... 182
- 7.9 K-Means Clustering for Job Grouping ............................................................... 184
- 7.10 Random Forest Demand Forecasting ................................................................ 188
- 7.11 Personalized Course Recommendation Engine ................................................. 192
- 7.12 Multi-Phase Learning Path Generation ............................................................. 195
- 7.13 Summary ........................................................................................................... 198

### Chapter 8: API Layer — Routes and Endpoints ...................................................... 199
- 8.1 Introduction ........................................................................................................ 199
- 8.2 FastAPI Application Configuration (main.py) .................................................... 200
- 8.3 Endpoint Reference ............................................................................................ 205
- 8.4 Resume Upload Endpoint ................................................................................... 207
- 8.5 Job Recommendation Endpoint .......................................................................... 210
- 8.6 Live Career Pivot Endpoint ................................................................................ 213
- 8.7 Career Path Analysis Endpoint ........................................................................... 218
- 8.8 Skill Demand Forecast Endpoint ......................................................................... 222
- 8.9 Summary ............................................................................................................. 225

### Chapter 9: Frontend — User Interface Design ........................................................ 230
- 9.1 Introduction ........................................................................................................ 230
- 9.2 Technology Stack and Project Structure ............................................................. 232
- 9.3 Design System and Global Styling ..................................................................... 235
- 9.4 Landing Page — 3D WebGL Experience ............................................................ 238
- 9.5 Login/Registration Page ..................................................................................... 243
- 9.6 Resume Upload Page .......................................................................................... 247
- 9.7 Dashboard — Analytics Command Center ......................................................... 251
- 9.8 API Client Library (api.ts) .................................................................................. 260
- 9.9 Summary ............................................................................................................. 262

### Chapter 10: Integration and Data Flow .................................................................. 277
- 10.1 Introduction ...................................................................................................... 277
- 10.2 End-to-End User Workflow ............................................................................... 278
- 10.3 Resume Processing Data Flow ......................................................................... 280
- 10.4 Frontend-Backend Communication ................................................................... 283
- 10.5 Dashboard Data Assembly ................................................................................ 286
- 10.6 Error Handling Strategy .................................................................................... 289

### Chapter 11: Testing and Validation ........................................................................ 291
- 11.1 Introduction ...................................................................................................... 291
- 11.2 Unit Test Cases ................................................................................................. 292
- 11.3 Integration Test Flow ....................................................................................... 295
- 11.4 ML Model Evaluation ...................................................................................... 297
- 11.5 Validation Results ............................................................................................. 299

### Chapter 12: Deployment and DevOps ..................................................................... 313
- 12.1 Introduction ...................................................................................................... 313
- 12.2 Backend Deployment (Render) ......................................................................... 314
- 12.3 Frontend Deployment (Vercel) .......................................................................... 317
- 12.4 Environment Configuration .............................................................................. 319
- 12.5 CI/CD Pipeline ................................................................................................. 321
- 12.6 Summary ........................................................................................................... 323

### Chapter 13: Results and Discussion ........................................................................ 324
- 13.1 Introduction ...................................................................................................... 324
- 13.2 NLP Extraction Results .................................................................................... 325
- 13.3 Job Matching Accuracy .................................................................................... 328
- 13.4 Career Path Recommendation Results .............................................................. 331
- 13.5 User Interface Evaluation ................................................................................. 334
- 13.6 Performance Benchmarks ................................................................................. 337
- 13.7 Comparative Analysis with Existing Systems ................................................... 340
- 13.8 Summary ........................................................................................................... 343

### Chapter 14: Conclusion and Future Work ............................................................... 344
- 14.1 Conclusion ........................................................................................................ 344
- 14.2 Key Contributions ............................................................................................. 346
- 14.3 Limitations ........................................................................................................ 348
- 14.4 Suggestions for Future Work ............................................................................ 349
- 14.5 Final Remarks ................................................................................................... 352

### Appendix A: Complete Source Code Listings .......................................................... 353
### Appendix B: API Documentation ............................................................................ 370
### Appendix C: Database Schema Diagrams ............................................................... 378
### Appendix D: User Manual ...................................................................................... 382

### References ............................................................................................................... 390

---

\newpage

## List of Abbreviations

| Abbreviation | Full Form |
|---|---|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| BERT | Bidirectional Encoder Representations from Transformers |
| CORS | Cross-Origin Resource Sharing |
| CRUD | Create, Read, Update, Delete |
| CSS | Cascading Style Sheets |
| CSV | Comma Separated Values |
| DB | Database |
| DOM | Document Object Model |
| DL | Deep Learning |
| E2E | End-to-End |
| ER | Entity-Relationship |
| FastAPI | Fast Application Programming Interface (Python Framework) |
| HTML | Hypertext Markup Language |
| HTTP | Hypertext Transfer Protocol |
| HTTPS | Hypertext Transfer Protocol Secure |
| IDE | Integrated Development Environment |
| JSON | JavaScript Object Notation |
| JWT | JSON Web Token |
| K-Means | K-Means Clustering Algorithm |
| LOC | Lines of Code |
| ML | Machine Learning |
| MLP | Multi-Layer Perceptron |
| NER | Named Entity Recognition |
| NLP | Natural Language Processing |
| ORM | Object-Relational Mapping |
| PDF | Portable Document Format |
| REST | Representational State Transfer |
| RF | Random Forest |
| R3F | React Three Fiber |
| SDK | Software Development Kit |
| SEO | Search Engine Optimization |
| SPA | Single Page Application |
| SpaCy | Industrial-Strength NLP Library |
| SQL | Structured Query Language |
| SQLite | Lightweight SQL Database Engine |
| SSR | Server-Side Rendering |
| TF-IDF | Term Frequency — Inverse Document Frequency |
| TSX | TypeScript with JSX |
| UI | User Interface |
| URL | Uniform Resource Locator |
| UX | User Experience |
| WebGL | Web Graphics Library |
| 3D | Three-Dimensional |

---

\newpage

## List of Figures

| Figure No. | Title | Page |
|---|---|---|
| 1.1 | Overview of the Smart Career Platform Ecosystem | 2 |
| 1.2 | Problem Landscape in Modern Career Planning | 6 |
| 1.3 | Proposed System Framework — High-Level Block Diagram | 10 |
| 2.1 | Traditional Resume Parsing Pipeline | 16 |
| 2.2 | NLP Processing Pipeline for Text Analysis | 19 |
| 2.3 | Content-Based vs Collaborative Filtering Approaches | 23 |
| 2.4 | TF-IDF Vector Space Model Representation | 27 |
| 2.5 | K-Means Clustering Visualization | 30 |
| 2.6 | Random Forest Ensemble Architecture | 34 |
| 2.7 | Comparison of Existing Career Recommendation Systems | 38 |
| 3.1 | High-Level System Architecture Diagram | 45 |
| 3.2 | Three-Tier Architecture — Frontend, Backend, Database | 46 |
| 3.3 | Technology Stack Overview | 48 |
| 3.4 | FastAPI Backend Module Organization | 51 |
| 3.5 | Next.js Frontend Application Structure | 54 |
| 3.6 | Entity-Relationship Diagram — Complete Database Schema | 57 |
| 3.7 | RESTful API Endpoint Map | 61 |
| 3.8 | JWT Authentication Flow Diagram | 64 |
| 3.9 | NLP Processing Pipeline Architecture | 66 |
| 3.10 | ML Model Integration Architecture | 69 |
| 3.11 | Data Flow Diagram — Level 0 (Context Diagram) | 71 |
| 3.12 | Data Flow Diagram — Level 1 | 72 |
| 3.13 | Deployment Architecture Diagram | 74 |
| 4.1 | SQLAlchemy Engine and Session Factory Pattern | 80 |
| 4.2 | User Model — Field Mapping Diagram | 83 |
| 4.3 | Database Relationship Diagram — Foreign Keys | 97 |
| 4.4 | Session Lifecycle — Request/Response Pattern | 99 |
| 5.1 | JWT Authentication Sequence Diagram | 102 |
| 5.2 | Bcrypt Password Hashing Process | 106 |
| 5.3 | User Registration Flow Diagram | 111 |
| 5.4 | User Login Flow Diagram | 114 |
| 5.5 | OAuth2 Password Bearer Token Flow | 119 |
| 6.1 | Complete NLP Pipeline Flow Diagram | 126 |
| 6.2 | PDF Extraction Strategy — Dual Engine Approach | 128 |
| 6.3 | SpaCy NER Processing Pipeline | 133 |
| 6.4 | Master Skill Whitelist Category Distribution | 137 |
| 6.5 | Regex Pattern Matching for Skill Detection | 140 |
| 6.6 | Confidence Score Calculation Formula | 143 |
| 6.7 | BERT Transformer Architecture for Embeddings | 146 |
| 6.8 | Mean Pooling with Attention Mask | 149 |
| 6.9 | Resume Processing Master Orchestrator Flow | 152 |
| 6.10 | Skill Gap Analysis — Set Theory Visualization | 155 |
| 6.11 | Resume Upload API Sequence Diagram | 158 |
| 7.1 | TF-IDF Vectorization Process | 166 |
| 7.2 | Cosine Similarity — Vector Space Illustration | 169 |
| 7.3 | Live Job Data Fetching Pipeline | 172 |
| 7.4 | API Fallback Decision Tree | 180 |
| 7.5 | K-Means Clustering Process Flow | 185 |
| 7.6 | Random Forest Ensemble Decision Process | 189 |
| 7.7 | Multi-Phase Learning Path Structure | 193 |
| 9.1 | Landing Page — 3D WebGL Brain Visualization | 239 |
| 9.2 | Login Page — Glassmorphic Card Design | 244 |
| 9.3 | Registration Form Variant | 245 |
| 9.4 | Resume Upload Page — Drag and Drop Interface | 248 |
| 9.5 | Resume Scanning Animation | 249 |
| 9.6 | Dashboard — Radar Chart and Skill Bars | 254 |
| 9.7 | Career Path Cards — Match Percentages | 256 |
| 9.8 | Expanded Career Card — Roadmap View | 257 |
| 9.9 | Market Trends — Line and Doughnut Charts | 258 |
| 13.1 | Dashboard — Complete View with Charts | 326 |
| 13.2 | Career Path Cards with Expanded Roadmaps | 328 |

---

\newpage

## List of Tables

| Table No. | Title | Page |
|---|---|---|
| 2.1 | Comparison of NLP Libraries for Resume Parsing | 20 |
| 2.2 | Machine Learning Algorithms Used in Career Recommendation | 24 |
| 2.3 | Existing Career Recommendation Systems — Feature Comparison | 39 |
| 3.1 | Technology Stack — Backend Components | 49 |
| 3.2 | Technology Stack — Frontend Components | 49 |
| 3.3 | RESTful API Endpoints Summary | 62 |
| 4.1 | User Table — Column Definitions | 84 |
| 4.2 | UserSkill Table — Column Definitions | 86 |
| 4.3 | Job Table — Column Definitions | 88 |
| 4.4 | Course Table — Column Definitions | 90 |
| 4.5 | Roadmap Table — Column Definitions | 92 |
| 4.6 | UserProgress Table — Column Definitions | 94 |
| 4.7 | APICache Table — Column Definitions | 95 |
| 5.1 | JWT Token Payload Structure | 108 |
| 5.2 | Pydantic Schema Definitions — Auth Module | 121 |
| 6.1 | Master Skill Whitelist — Complete Listing | 138 |
| 6.2 | SpaCy Entity Labels Used for Extraction | 134 |
| 6.3 | Confidence Score Computation Parameters | 144 |
| 6.4 | BERT Model Specifications — all-MiniLM-L6-v2 | 147 |
| 7.1 | TF-IDF Parameters and Configuration | 167 |
| 7.2 | Remotive API Response Structure | 175 |
| 7.3 | Adzuna API Response Structure | 178 |
| 7.4 | K-Means Hyperparameters | 186 |
| 7.5 | Random Forest Regressor Configuration | 190 |
| 7.6 | Learning Path Phase Definitions | 196 |
| 7.7 | Core Career Paths — Skills Matrix | 197 |
| 14.1 | Future Work Roadmap Summary | 350 |

---

\newpage

