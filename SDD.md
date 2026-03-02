# Software Design Document (SDD)

# SkillSync AI – MNNIT Academic Talent Intelligence Platform

**Version:** 1.0
**Document Type:** Software Design Document
**Status:** Draft
**Prepared By:** SkillSync Engineering Team
**Date:** March 2024

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Layer Architecture](#4-layer-architecture)
5. [Component Design](#5-component-design)
6. [Database Design](#6-database-design)
7. [API Design](#7-api-design)
8. [Security Design](#8-security-design)
9. [AI & ML Pipeline Design](#9-ai--ml-pipeline-design)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Error Handling & Logging](#11-error-handling--logging)
12. [Performance & Scalability](#12-performance--scalability)

---

## 1. Introduction

### 1.1 Purpose

This Software Design Document describes the detailed technical design of the SkillSync AI platform. It translates the requirements defined in the PRD/SRS into concrete architectural decisions, component designs, database schemas, API contracts, and deployment strategies.

### 1.2 Scope

This document covers:

- System architecture and layering
- Backend service component design
- Database schema and vector storage design
- REST API endpoints and contracts
- Authentication and authorization design
- AI/ML pipeline architecture
- Deployment and infrastructure design
- Error handling strategies

### 1.3 Definitions

| Term | Definition |
|------|-----------|
| ANN | Approximate Nearest Neighbor – fast vector similarity search |
| JWT | JSON Web Token – stateless authentication token |
| RAG | Retrieval-Augmented Generation – AI pattern combining vector search + LLM |
| Vector Embedding | High-dimensional float array representing semantic meaning of text |
| Cosine Similarity | Similarity metric between two vectors (range: -1 to 1) |
| Soft Delete | Marking a record inactive (`isActive: false`) without physical deletion |
| OTP | One-Time Password used for professor email verification |

---

## 2. System Overview

SkillSync AI is a **closed-ecosystem** platform operating exclusively within the MNNIT network. It follows a **microservice-inspired monolith** architecture during MVP, designed to be split into true microservices at scale.

### 2.1 Design Principles

- **Security-First:** All routes require verified JWT. No public endpoints exist.
- **AI-Augmented, Not AI-Dependent:** Core platform functions even if LLM explanation is slow.
- **Cost-Conscious Embeddings:** Batch processing minimizes OpenAI/embedding API calls.
- **Soft-Delete by Default:** Data is never hard-deleted in v1 to preserve audit trails.
- **Explainability:** Every AI ranking result includes a human-readable explanation.

---

## 3. High-Level Architecture

### 3.1 System Context Diagram

```mermaid
C4Context
    title System Context – SkillSync AI

    Person(student, "Student", "MNNIT student uploads resume and searches peers")
    Person(alumni, "Alumni", "MNNIT alumni posts jobs and searches candidates")
    Person(professor, "Professor", "MNNIT professor searches students for research")

    System(skillsync, "SkillSync AI Platform", "Closed academic talent intelligence system")

    System_Ext(emailProvider, "Email Service (SMTP)", "Sends OTP and verification emails")
    System_Ext(embedAPI, "Embedding API", "Generates vector embeddings from text")
    System_Ext(llmAPI, "LLM API", "Generates natural language match explanations")
    System_Ext(storage, "Cloud Object Storage", "Stores uploaded PDF resumes securely")

    Rel(student, skillsync, "Registers, uploads resume, searches students")
    Rel(alumni, skillsync, "Posts jobs, searches and ranks students")
    Rel(professor, skillsync, "Searches students for research opportunities")
    Rel(skillsync, emailProvider, "Sends verification OTP")
    Rel(skillsync, embedAPI, "Calls to embed resume text and queries")
    Rel(skillsync, llmAPI, "Calls to generate ranking explanations")
    Rel(skillsync, storage, "Stores and retrieves resume PDFs")
```

### 3.2 Container Diagram

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        FE["React Frontend\n(Role-based SPA)"]
    end

    subgraph Backend["Backend Layer (Node.js + Express)"]
        API["API Gateway\n(Express Router + Middleware)"]
        Auth["Auth Module"]
        Profile["Profile Module"]
        Search["Search & Ranking Module"]
        Jobs["Job Posting Module"]
        Notify["Notification Module"]
        Analytics["Skill Analytics Module"]
        Moderation["AI Moderation Module"]
        Embeddings["Embedding Module"]
        ResumeProc["Resume Processor Module"]
    end

    subgraph Data["Data Layer"]
        Mongo[("MongoDB\nStructured Data")]
        VectorDB[("Vector Database\nPinecone / Weaviate")]
        S3["Object Storage\nResume PDFs"]
    end

    subgraph External["External AI Services"]
        EmbedAPI["Embedding API\n(OpenAI / HuggingFace)"]
        LLMAPI["LLM API\n(GPT-4 / Gemini)"]
        SMTP["Email Service\n(SendGrid / SES)"]
    end

    FE <--> API
    API --> Auth
    API --> Profile
    API --> Search
    API --> Jobs
    API --> Notify
    API --> Analytics
    API --> Moderation
    API --> Embeddings
    API --> ResumeProc

    Auth --> Mongo
    Profile --> Mongo
    Profile --> S3
    Jobs --> Mongo
    Notify --> Mongo
    Analytics --> Mongo
    Moderation --> Mongo
    Moderation --> LLMAPI
    ResumeProc --> S3
    ResumeProc --> EmbedAPI
    Embeddings --> VectorDB
    Embeddings --> EmbedAPI
    Search --> VectorDB
    Search --> LLMAPI
    Auth --> SMTP
```

---

## 4. Layer Architecture

### 4.1 Backend Layer Design

```mermaid
flowchart TD
    subgraph Presentation["Presentation Layer"]
        R[Express Router]
        MW[Middleware Stack]
        V[Request Validators]
    end

    subgraph Service["Service Layer"]
        AS[Auth Service]
        PS[Profile Service]
        RS[Ranking Service]
        JS[Job Service]
        NS[Notification Service]
        SS[Skill Analytics Service]
        MS[Moderation Service]
        ES[Embedding Service]
        RPS[Resume Processing Service]
    end

    subgraph Repository["Repository / Data Access Layer"]
        UR[User Repository]
        JR[Job Repository]
        NR[Notification Repository]
        DLR[Download Log Repository]
        VR[Vector Repository]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        DB[(MongoDB)]
        VDB[(Vector Database)]
        Cache[In-Memory Cache]
        Queue[Job Queue - Bull/BullMQ]
        ObjStore[Object Storage]
    end

    R --> MW --> V
    V --> AS & PS & RS & JS & NS & SS & MS & ES & RPS
    AS & PS & RS & JS & NS & SS --> UR & JR & NR & DLR
    RS & ES --> VR
    UR & JR & NR & DLR --> DB
    VR --> VDB
    RPS --> ObjStore
    ES --> Cache
    RPS --> Queue
```

### 4.2 Request Middleware Pipeline

```mermaid
flowchart LR
    REQ([Incoming Request]) --> CORS[CORS Guard]
    CORS --> RL[Rate Limiter]
    RL --> JWT[JWT Verifier]
    JWT --> RoleChk{Role\nCheck}
    RoleChk -- Pass --> BanChk{Ban\nCheck}
    BanChk -- Not Banned --> ValChk[Request Validator\nZod / Joi]
    ValChk -- Valid --> CTRL[Controller Handler]
    CTRL --> RES([Response])

    RoleChk -- Fail --> E403A([403 – Forbidden])
    BanChk -- Banned --> E403B([403 – Account Banned])
    ValChk -- Invalid --> E400([400 – Validation Error])
    JWT -- Invalid --> E401([401 – Unauthorized])
```

---

## 5. Component Design

### 5.1 Authentication Module

```mermaid
classDiagram
    class AuthController {
        +register(req, res)
        +verifyEmail(req, res)
        +login(req, res)
        +logout(req, res)
        +refreshToken(req, res)
    }

    class AuthService {
        +registerUser(email, password, role) UserDTO
        +verifyOTP(email, otp) boolean
        +authenticateUser(email, password) TokenPair
        +generateJWT(userId, role) string
        +verifyJWT(token) JWTPayload
        +checkBanStatus(userId) BanStatus
    }

    class OTPService {
        +generateOTP(email) string
        +sendOTP(email, otp) void
        +validateOTP(email, otp) boolean
        +invalidateOTP(email) void
    }

    class UserRepository {
        +create(userDto) User
        +findByEmail(email) User
        +findById(id) User
        +updateVerification(id) void
        +updateBanStatus(id, banUntil) void
    }

    AuthController --> AuthService
    AuthService --> OTPService
    AuthService --> UserRepository
```

### 5.2 Resume Processing Module

```mermaid
classDiagram
    class ResumeController {
        +uploadResume(req, res)
        +getResume(req, res)
        +downloadResume(req, res)
    }

    class ResumeService {
        +uploadAndProcess(file, userId) ProcessResult
        +extractTextFromPDF(fileBuffer) string
        +chunkText(rawText) string[]
        +triggerEmbeddingJob(userId, chunks) void
        +logDownload(downloaderId, ownerId) void
    }

    class StorageService {
        +upload(file, key) string
        +getSignedUrl(key) string
        +delete(key) void
    }

    class EmbeddingService {
        +generateEmbeddings(chunks) float[][]
        +combineEmbeddings(vectors) float[]
        +upsertToVectorDB(userId, vector) void
        +deleteFromVectorDB(userId) void
    }

    class SkillExtractor {
        +extractSkills(text) string[]
        +normalizeSkills(skills) string[]
    }

    ResumeController --> ResumeService
    ResumeService --> StorageService
    ResumeService --> EmbeddingService
    ResumeService --> SkillExtractor
```

### 5.3 Ranking & Search Module

```mermaid
classDiagram
    class SearchController {
        +searchStudents(req, res)
        +getDetailedProfile(req, res)
    }

    class RankingService {
        +search(query, filters) RankedResult[]
        +embedQuery(queryText) float[]
        +retrieveCandidates(queryVector, topK) Candidate[]
        +applyFilters(candidates, filters) Candidate[]
        +computeSimilarity(v1, v2) float
        +generateExplanation(candidate, query) string
    }

    class VectorRepository {
        +annSearch(vector, topK, metadata) VectorMatch[]
        +upsert(id, vector, metadata) void
        +delete(id) void
        +fetchById(id) VectorRecord
    }

    class ExplanationEngine {
        +buildPrompt(candidateProfile, query) string
        +callLLM(prompt) string
        +formatExplanation(response) string
    }

    class RankedResult {
        +userId string
        +matchScore float
        +explanation string
        +matchedSkills string[]
        +profile StudentProfile
    }

    SearchController --> RankingService
    RankingService --> VectorRepository
    RankingService --> ExplanationEngine
    RankingService --> RankedResult
```

### 5.4 Job Posting & Moderation Module

```mermaid
classDiagram
    class JobController {
        +createJob(req, res)
        +listJobs(req, res)
        +getJob(req, res)
        +withdrawJob(req, res)
    }

    class JobService {
        +createAndModerate(jobDto, alumni) Job
        +listActiveJobs() Job[]
        +expireStaleJobs() void
        +withdrawJob(jobId, userId) void
    }

    class ModerationService {
        +scanJobPost(content) ModerationResult
        +checkOffensiveLanguage(text) boolean
        +checkSpam(text) boolean
        +checkMaliciousLinks(text) boolean
        +applyViolationPolicy(userId) BanResult
    }

    class BanManager {
        +incrementViolation(userId) void
        +applyBan(userId, duration) void
        +applyLifetimeBan(userId) void
        +checkActiveBan(userId) BanStatus
    }

    class ModerationResult {
        +passed boolean
        +violationType string
        +confidence float
    }

    JobController --> JobService
    JobService --> ModerationService
    ModerationService --> BanManager
    ModerationService --> ModerationResult
```

---

## 6. Database Design

### 6.1 MongoDB Collections Schema

#### Users Collection

```json
{
  "_id": "ObjectId",
  "email": "String (unique, indexed)",
  "passwordHash": "String",
  "role": "enum: ['student', 'professor', 'alumni']",
  "isVerified": "Boolean (default: false)",
  "isActive": "Boolean (default: true)",
  "isBanned": "Boolean (default: false)",
  "banUntil": "Date (nullable)",
  "violationCount": "Number (default: 0)",
  "skillPreferences": ["String"],
  "otpHash": "String (nullable, TTL: 10 min)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Student Profiles Collection

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: Users, unique)",
  "branch": "String (enum: CSE, ECE, ME, CE, ...)",
  "year": "Number (1–5)",
  "skills": ["String"],
  "resumeStorageKey": "String (S3 key)",
  "embeddingStatus": "enum: ['pending', 'processing', 'indexed', 'failed']",
  "lastEmbeddingAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Job Postings Collection

```json
{
  "_id": "ObjectId",
  "postedBy": "ObjectId (ref: Users, Alumni/Professor only)",
  "title": "String",
  "description": "String",
  "requiredSkills": ["String"],
  "deadline": "Date",
  "status": "enum: ['pending_moderation', 'active', 'expired', 'rejected', 'withdrawn']",
  "moderationResult": {
    "passed": "Boolean",
    "violationType": "String (nullable)",
    "checkedAt": "Date"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Notifications Collection

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: Users)",
  "jobId": "ObjectId (ref: JobPostings)",
  "message": "String",
  "isRead": "Boolean (default: false)",
  "createdAt": "Date"
}
```

#### Download Logs Collection

```json
{
  "_id": "ObjectId",
  "downloaderId": "ObjectId (ref: Users)",
  "resumeOwnerId": "ObjectId (ref: Users)",
  "timestamp": "Date"
}
```

### 6.2 MongoDB Indexes

```mermaid
flowchart LR
    subgraph Users["Users Collection Indexes"]
        UI1[email – unique]
        UI2[isBanned + isActive – compound]
        UI3[role – single]
    end

    subgraph Jobs["Job Postings Indexes"]
        JI1[status – single]
        JI2[deadline – TTL-trigger]
        JI3[postedBy – ref]
        JI4[requiredSkills – multikey]
    end

    subgraph Notifs["Notifications Indexes"]
        NI1[userId + isRead – compound]
        NI2[createdAt – TTL optional]
    end

    subgraph Logs["Download Logs Indexes"]
        LI1[downloaderId – single]
        LI2[resumeOwnerId – single]
    end
```

### 6.3 Vector Database Design

The vector database (Pinecone / Weaviate) stores one embedding per active student.

**Namespace:** `mnnit-student-embeddings`

**Vector Record Structure:**

```json
{
  "id": "userId (string)",
  "values": [0.12, -0.45, 0.78, "... 1536 dims"],
  "metadata": {
    "branch": "CSE",
    "year": 3,
    "isActive": true,
    "skills": ["Node.js", "Python", "React"],
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
```

**Query Mode:** ANN (Approximate Nearest Neighbor) with metadata pre-filtering on `isActive: true`.

---

## 7. API Design

### 7.1 API Structure Overview

```mermaid
mindmap
  root((SkillSync API))
    Auth
      POST /auth/register
      POST /auth/verify-otp
      POST /auth/login
      POST /auth/logout
    Profile
      GET /profile/:userId
      PUT /profile
      POST /profile/resume
      GET /profile/resume/:userId
      DELETE /profile
    Search
      POST /search
      GET /search/:userId/detail
    Jobs
      POST /jobs
      GET /jobs
      GET /jobs/:jobId
      DELETE /jobs/:jobId
    Notifications
      GET /notifications
      PATCH /notifications/:id/read
    Settings
      PUT /settings/preferences
    Analytics
      GET /analytics/trending-skills
    Admin
      GET /admin/ban-history (V2)
```

### 7.2 Key API Endpoint Contracts

#### POST /auth/register

```
Request:
{
  "email": "student@mnnit.ac.in",
  "password": "SecurePass123!",
  "role": "student"
}

Response 201:
{
  "message": "Verification OTP sent to your email",
  "userId": "64abc123..."
}

Response 400:
{
  "error": "Email domain not allowed. Use @mnnit.ac.in"
}
```

#### POST /search

```
Request (requires JWT):
{
  "query": "Full-stack developer with React and Node.js experience",
  "filters": {
    "branch": "CSE",
    "year": 3
  },
  "topK": 10
}

Response 200:
{
  "results": [
    {
      "userId": "64abc...",
      "name": "Rahul Sharma",
      "matchScore": 89.4,
      "explanation": "Strong full-stack experience with React and Express.",
      "matchedSkills": ["React", "Node.js", "MongoDB"],
      "branch": "CSE",
      "year": 3
    }
  ],
  "queryTime": 1.2
}
```

#### POST /jobs

```
Request (Alumni JWT required):
{
  "title": "Backend Engineer Intern",
  "description": "Looking for MNNIT students with Node.js experience...",
  "requiredSkills": ["Node.js", "MongoDB", "REST APIs"],
  "deadline": "2024-04-30T23:59:59Z"
}

Response 201:
{
  "jobId": "64def...",
  "status": "pending_moderation",
  "message": "Job submitted for AI moderation"
}

Response 403 (banned user):
{
  "error": "Account banned until 2024-03-10"
}
```

### 7.3 API Authentication Flow

```mermaid
flowchart TD
    REQ([API Request]) --> H{Has\nAuthorization\nHeader?}
    H -- No --> E401([401 Unauthorized])
    H -- Yes --> T[Extract Bearer Token]
    T --> V{Valid JWT\nSignature?}
    V -- No --> E401
    V -- Yes --> EXP{Token\nExpired?}
    EXP -- Yes --> E401
    EXP -- No --> PAY[Decode Payload\nuserid, role, iat]
    PAY --> DB[Fetch User from DB]
    DB --> ACT{isActive\n& isVerified?}
    ACT -- No --> E403A([403 Account Inactive])
    ACT -- Yes --> BAN{isBanned or\nbanUntil in future?}
    BAN -- Yes --> E403B([403 Account Banned])
    BAN -- No --> ROLE{Role\nAuthorized\nfor Route?}
    ROLE -- No --> E403C([403 Forbidden])
    ROLE -- Yes --> CONT([Proceed to Controller])
```

---

## 8. Security Design

### 8.1 Security Architecture Layers

```mermaid
flowchart TD
    subgraph L1["Layer 1 – Network"]
        NL1[HTTPS Only - TLS 1.3]
        NL2[No Public Endpoints]
        NL3[IP Rate Limiting]
    end

    subgraph L2["Layer 2 – Authentication"]
        AL1[JWT HS256 - 15 min expiry]
        AL2[Refresh Token - 7 days, HttpOnly Cookie]
        AL3[Email OTP Verification]
        AL4[Password Hashing - bcrypt cost 12]
    end

    subgraph L3["Layer 3 – Authorization"]
        RL1[Role-Based Access Control - RBAC]
        RL2[Resource Ownership Checks]
        RL3[Ban Status Enforcement]
    end

    subgraph L4["Layer 4 – Data"]
        DL1[Resume Signed URLs - 15 min TTL]
        DL2[PII Fields Encrypted at Rest]
        DL3[Download Activity Logging]
        DL4[Soft Delete - No Hard Deletion]
    end

    subgraph L5["Layer 5 – AI Moderation"]
        ML1[Job Post Content Scanning]
        ML2[URL Safety Check]
        ML3[Graduated Ban System]
    end

    L1 --> L2 --> L3 --> L4 --> L5
```

### 8.2 Token Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant API as API Server
    participant DB as MongoDB

    C->>API: POST /auth/login
    API->>DB: Validate credentials
    DB-->>API: User record
    API->>API: Generate Access Token (15 min JWT)
    API->>API: Generate Refresh Token (7 days, stored in DB)
    API-->>C: Access Token (JSON) + Refresh Token (HttpOnly Cookie)

    Note over C, API: 15 minutes later...

    C->>API: Request with expired Access Token
    API-->>C: 401 - Token Expired

    C->>API: POST /auth/refresh (sends Refresh Cookie)
    API->>DB: Validate Refresh Token
    DB-->>API: Valid - refresh token found
    API->>API: Issue new Access Token
    API-->>C: New Access Token

    Note over C, API: On Logout...

    C->>API: POST /auth/logout
    API->>DB: Invalidate Refresh Token
    API-->>C: 200 - Logged out
```

---

## 9. AI & ML Pipeline Design

### 9.1 Embedding Generation Strategy

```mermaid
flowchart TD
    subgraph Immediate["Immediate Path (on resume upload)"]
        UP[Resume PDF Upload] --> EXT[PDF Text Extraction]
        EXT --> CHK[Chunk into 512-token segments]
        CHK --> EMB[Call Embedding API per chunk]
        EMB --> AGG["Aggregate: mean pooling of chunk vectors"]
        AGG --> VDB[(Upsert to Vector DB)]
    end

    subgraph Batch["Batch Path (midnight cron)"]
        CRON[Midnight Cron Job] --> FETCH[Fetch users with\nembeddingStatus = pending]
        FETCH --> BCHK[Batch chunk all profiles]
        BCHK --> BEMB[Batch call Embedding API]
        BEMB --> BUPSERT[(Batch Upsert to Vector DB)]
        BUPSERT --> MARK[Mark embeddingStatus = indexed]
    end

    subgraph Exclusion["Exclusion Rules"]
        EXCL{isActive = false?} -- Yes --> SKIP[Skip - do not index]
        EXCL -- No --> VDB
    end
```

### 9.2 Similarity Search & Ranking Pipeline

```mermaid
flowchart LR
    Q([User Query Text]) --> EMB[Embed Query\nvia Embedding API]
    EMB --> ANN[ANN Lookup\nTop-50 from Vector DB]
    ANN --> FILT[Apply Metadata Filters\nbranch, year, isActive=true]
    FILT --> RANK[Sort by Cosine\nSimilarity Score DESC]
    RANK --> TOP[Take Top-10 Results]
    TOP --> EXP[Generate Explanations\nvia LLM - parallel batch]
    EXP --> RESP([Return Ranked Results\nwith score% + explanation])

    subgraph Notes
        N1["Filters applied AFTER ANN\n(do not affect similarity score)"]
        N2["LLM calls parallelized\nwith Promise.all()"]
        N3["Target: total < 2s end-to-end"]
    end
```

### 9.3 AI Moderation Pipeline

```mermaid
flowchart TD
    JOB([Job Post Content]) --> PREP[Prepare Prompt\nfor Moderation LLM]

    subgraph Checks["Parallel Moderation Checks"]
        C1[Check: Offensive Language\nvia LLM classifier]
        C2[Check: Spam Signals\nrepetition, gibberish]
        C3[Check: Malicious URLs\nvia URL safety API]
    end

    PREP --> C1 & C2 & C3

    C1 & C2 & C3 --> AGG{Any Check\nFailed?}

    AGG -- All Passed --> APPROVE([Set status = active\nNotify alumni])
    AGG -- Failed --> REJECT[Set status = rejected]
    REJECT --> VIO[Fetch violationCount from User]
    VIO --> BAN{violationCount?}
    BAN -- 0 --> BAN3[Apply 3-day ban\nviolationCount++]
    BAN -- 1+ --> BANL[Apply Lifetime ban\nisBanned = true]
    BAN3 & BANL --> NOTIFY([Notify Alumni via Email])
```

---

## 10. Deployment Architecture

### 10.1 Infrastructure Overview

```mermaid
flowchart TB
    subgraph CDN["CDN (CloudFront / Vercel)"]
        STATIC[Static React Build\nHTML, JS, CSS]
    end

    subgraph Cloud["Cloud Infrastructure (AWS / GCP)"]
        subgraph AppLayer["Application Tier"]
            LB[Load Balancer]
            API1[Node.js Instance 1]
            API2[Node.js Instance 2]
        end

        subgraph DataLayer["Data Tier"]
            MONGO[(MongoDB Atlas\nReplica Set)]
            VECT[(Vector DB\nPinecone)]
            S3[Object Storage\nS3 / GCS]
            REDIS[(Redis\nCache + Queue)]
        end

        subgraph WorkerLayer["Worker Tier"]
            WORKER[Embedding Worker\nBull Job Queue]
            CRON[Cron Runner\nMidnight Batch]
        end
    end

    subgraph External["External Services"]
        SMTP[SendGrid / SES]
        OPENAI[OpenAI API]
    end

    STATIC --> LB
    LB --> API1 & API2
    API1 & API2 --> MONGO & VECT & S3 & REDIS
    REDIS --> WORKER
    CRON --> API1
    API1 & API2 --> SMTP & OPENAI
```

### 10.2 CI/CD Pipeline

```mermaid
flowchart LR
    CODE([Developer Push to\nfeature branch]) --> PR[Pull Request\nopened]
    PR --> CI{CI Checks}
    CI --> LINT[ESLint]
    CI --> TEST[Jest Unit Tests]
    CI --> BUILD[Build Check]

    LINT & TEST & BUILD -- All Pass --> REVIEW[Code Review\nRequired]
    REVIEW -- Approved --> MERGE[Merge to main]
    MERGE --> STAGING[Auto-deploy to\nStaging Environment]
    STAGING --> SMOKETEST[Smoke Tests\nAPI health checks]
    SMOKETEST -- Pass --> PROD[Manual Approval\nfor Production Deploy]
    PROD --> LIVE([Production Live])

    LINT -- Fail --> FIX([Fix Required])
    TEST -- Fail --> FIX
    BUILD -- Fail --> FIX
```

---

## 11. Error Handling & Logging

### 11.1 Error Response Standard

All API errors follow a consistent envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email field is required",
    "details": [
      { "field": "email", "issue": "required" }
    ]
  },
  "requestId": "req_abc123",
  "timestamp": "2024-03-01T10:00:00Z"
}
```

### 11.2 Error Code Reference

| HTTP Code | Error Code | Scenario |
|-----------|-----------|---------|
| 400 | `VALIDATION_ERROR` | Invalid request body or params |
| 401 | `UNAUTHENTICATED` | Missing or expired JWT |
| 403 | `FORBIDDEN` | Role not authorized for action |
| 403 | `ACCOUNT_BANNED` | User account is banned |
| 403 | `ACCOUNT_INACTIVE` | Soft-deleted or unverified account |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate email on register |
| 422 | `UNPROCESSABLE` | PDF parsing failed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unhandled server error |
| 503 | `SERVICE_UNAVAILABLE` | External API (LLM/Embed) down |

### 11.3 Logging Strategy

```mermaid
flowchart LR
    APP[Application Log Events] --> STRUCT[Structured JSON Logging\nWinston / Pino]
    STRUCT --> LEVELS{Log Level}
    LEVELS --> DEBUG[DEBUG: Dev Only\nQuery details, payloads]
    LEVELS --> INFO[INFO: Request logs\nEmbedding jobs, job posts]
    LEVELS --> WARN[WARN: Recoverable errors\nLLM timeout, retry]
    LEVELS --> ERROR[ERROR: Unhandled exceptions\nDB connection failures]
    LEVELS --> AUDIT[AUDIT: Security events\nLogin, download, ban]

    DEBUG & INFO & WARN & ERROR --> AGGR[Log Aggregator\nDatadog / CloudWatch]
    AUDIT --> SECURE[(Secure Audit Log\nImmutable store)]
```

---

## 12. Performance & Scalability

### 12.1 Performance Targets

| Operation | Target Latency | Strategy |
|-----------|---------------|---------|
| AI Search (end-to-end) | < 2 seconds | Parallel ANN + LLM batch |
| Resume Upload | < 5 seconds | Async embedding queue |
| Job Posting | < 1 second | Async moderation queue |
| Profile Fetch | < 300ms | MongoDB index + Redis cache |
| Notification Fetch | < 300ms | Compound index on userId + isRead |

### 12.2 Scalability Design

```mermaid
flowchart TD
    subgraph HorizontalScale["Horizontal Scaling Triggers"]
        HS1[API Instances: Scale with CPU > 70%]
        HS2[Worker Instances: Scale with Queue Depth]
    end

    subgraph CostOptimization["Embedding Cost Optimization"]
        CO1[Batch minor edits to midnight cron]
        CO2[Cache query embeddings in Redis - TTL 5min]
        CO3[Deduplicate identical query embeddings]
        CO4[Skip embedding for inactive users]
    end

    subgraph DBScaling["Database Scaling"]
        DS1[MongoDB Atlas auto-scaling]
        DS2[Vector DB: Index sharding by year]
        DS3[Redis: LRU eviction for query cache]
    end

    HorizontalScale --> HS1
    HorizontalScale --> HS2
    CostOptimization --> CO1 & CO2 & CO3 & CO4
    DBScaling --> DS1 & DS2 & DS3
```

### 12.3 Caching Strategy

| Cache Layer | What is Cached | TTL | Invalidation |
|-------------|---------------|-----|-------------|
| Redis | Query embedding vectors | 5 min | None (TTL-based) |
| Redis | Trending skills result | 1 hour | On new job post |
| Redis | User session metadata | JWT lifetime (15 min) | On logout/ban |
| MongoDB | Student profile (read-heavy) | CDN/App level | On profile update |

---

*End of Software Design Document*

*Next: Implementation follows the module order: Auth → Profile & Resume → Embedding → Search → Jobs → Moderation → Notifications → Analytics*
