# SkillSync AI – Team Implementation Checklist

**Project:** SkillSync AI – MNNIT Academic Talent Intelligence Platform
**Team Size:** 4 Members
**Version:** 1.0
**Reference Docs:** SRS.md, SDD.md

---

## Team Assignment Overview

```
Dev 1 – Project Lead & Backend Core   Node.js + Express (Auth, Profile, DB, DevOps)
Dev 2 – AI/ML Engineer                Python + FastAPI + LangChain (Embeddings, Search, Ranking, Analytics)
Dev 3 – Backend Services              Node.js (Jobs, Moderation orchestration, Notifications)
Dev 4 – Frontend Engineer             React + Vite (all pages, API integration)
```

---

## Phase 0 – Project Setup (All Members Together)

> Complete this phase together in a single session before splitting into individual work.

- [ ] **0.1** Create GitHub repository with `main` and `develop` branches
- [ ] **0.2** Define branch naming convention: `feat/<name>`, `fix/<name>`, `chore/<name>`
- [ ] **0.3** Set up monorepo structure:
  ```
  /skillsync-ai
    /backend       ← Node.js + Express  (Dev 1, Dev 3)
    /ai-service    ← Python + FastAPI + LangChain  (Dev 2)
    /workers       ← Python cron batch jobs  (Dev 2)
    /frontend      ← React + Vite  (Dev 4)
    /docs          ← SRS.md, SDD.md, this file
  ```
- [x] **0.4** `.env.example` created with all free-tier variables (no real secrets committed)
- [ ] **0.5** Set up `ESLint` + `Prettier` for `/backend` and `/frontend`; `ruff` + `black` for `/ai-service`; Husky pre-commit hooks
- [x] **0.6** `docker-compose.yml` created — runs MongoDB locally + Python AI service; Redis via Upstash (cloud, free)
- [ ] **0.7** Create **MongoDB Atlas** free M0 cluster → invite all 4 members → copy connection string to `.env`
- [ ] **0.8** Create **Pinecone** free account → create index `mnnit-student-embeddings` (dim=768, metric=cosine) → share API key
- [ ] **0.9** Create **Google AI Studio** account → generate free Gemini API key → share with Dev 2
- [ ] **0.10** Create **Cloudinary** free account → share `cloud_name`, `api_key`, `api_secret` with Dev 1
- [ ] **0.11** Create **Upstash** free Redis → share REST URL + token with Dev 1 and Dev 3
- [ ] **0.12** Create **Gmail App Password** for OTP emails → share with Dev 1
- [ ] **0.13** Create shared Postman workspace and import API collection skeleton
- [ ] **0.14** Schedule daily 15-min standup + weekly integration session (every Sunday)

---

## Dev 1 – Backend Core: Auth, Profile, Infrastructure

> **Owns:** Authentication, User Profiles, DB schema setup, middleware, and DevOps basics

### Sprint 1 – Foundation (Week 1)

#### Backend Project Setup
- [ ] **1.1.1** Initialize Node.js + Express project in `/backend`
- [ ] **1.1.2** Install core dependencies: `express`, `mongoose`, `dotenv`, `cors`, `helmet`, `zod`
- [ ] **1.1.3** Set up folder structure:
  ```
  /src
    /controllers
    /services
    /repositories
    /middleware
    /routes
    /models
    /utils
    /config
  ```
- [ ] **1.1.4** Configure `app.js` with middleware stack: CORS, Helmet, JSON parser, rate limiter
- [ ] **1.1.5** Create `server.js` with graceful shutdown handling
- [ ] **1.1.6** Connect MongoDB with retry logic and connection pooling
- [ ] **1.1.7** Set up Upstash Redis client (`@upstash/redis`) for caching; use Bull with Upstash for job queue
- [ ] **1.1.8** Create global error handler middleware (standardized error envelope)
- [ ] **1.1.9** Set up Winston/Pino structured logging

#### MongoDB Schemas
- [ ] **1.1.10** Create `User` Mongoose model with all fields + indexes
- [ ] **1.1.11** Create `StudentProfile` Mongoose model + indexes
- [ ] **1.1.12** Create `DownloadLog` Mongoose model
- [ ] **1.1.13** Write and run seed script for test users (Student, Alumni, Professor)

### Sprint 2 – Authentication Module (Week 1–2)

- [ ] **1.2.1** `POST /auth/register` – register user with email domain validation (`@mnnit.ac.in` for students)
- [ ] **1.2.2** Implement OTP generation + bcrypt OTP storage with 10-min TTL
- [ ] **1.2.3** Integrate email service (SendGrid/Nodemailer) to send OTP
- [ ] **1.2.4** `POST /auth/verify-otp` – verify OTP, set `isVerified: true`
- [ ] **1.2.5** `POST /auth/login` – validate credentials, check ban status, return JWT pair
- [ ] **1.2.6** JWT Access Token generation (15 min expiry, HS256)
- [ ] **1.2.7** Refresh Token generation (7 days, stored in DB, HttpOnly cookie)
- [ ] **1.2.8** `POST /auth/refresh` – rotate refresh token, issue new access token
- [ ] **1.2.9** `POST /auth/logout` – invalidate refresh token in DB
- [ ] **1.2.10** JWT verification middleware (`verifyToken`)
- [ ] **1.2.11** Role-based access middleware (`requireRole('alumni')`, etc.)
- [ ] **1.2.12** Ban check middleware (`checkBanStatus`)
- [ ] **1.2.13** Write unit tests for AuthService (jest)

### Sprint 3 – Profile Module (Week 2)

- [ ] **1.3.1** `GET /profile/:userId` – fetch student profile (auth required)
- [ ] **1.3.2** `PUT /profile` – update branch, year, manual skill edits
- [ ] **1.3.3** `POST /profile/resume` – accept PDF upload (multer), validate file type + size (max 5MB)
- [ ] **1.3.4** Upload PDF to **Cloudinary** (free tier), store public URL + public_id in `StudentProfile.resumeStorageKey`
- [ ] **1.3.5** On upload: call Python AI service `POST /embed` with PDF, set `embeddingStatus: 'pending'`
- [ ] **1.3.6** `GET /profile/resume/:userId` – generate **Cloudinary signed URL** (15 min TTL), log download
- [ ] **1.3.7** `DELETE /profile` – soft delete: set `isActive: false`, call Python AI service `DELETE /embed/:userId`
- [ ] **1.3.8** Write unit tests for ProfileService

### Sprint 4 – DevOps & Integration Support (Week 3–4)

- [ ] **1.4.1** Write `Dockerfile` for backend
- [ ] **1.4.2** Write `docker-compose.yml` for full local stack (MongoDB, Redis, backend)
- [ ] **1.4.3** Set up GitHub Actions CI: lint → test → build on every PR
- [ ] **1.4.4** Deploy backend to staging (Railway / Render / EC2)
- [ ] **1.4.5** Set up environment variables in staging
- [ ] **1.4.6** API integration testing with Dev 4 (Frontend)
- [ ] **1.4.7** Write API documentation (Swagger/OpenAPI or Postman export)

---

## Dev 2 – AI/ML Engineer: Python FastAPI + LangChain

> **Owns:** `/ai-service` (Python), `/workers` (Python cron). Tech: FastAPI, LangChain, Gemini, Pinecone.

### Sprint 1 – Python Project Setup (Week 1)

- [ ] **2.0.1** Set up Python virtual environment in `/ai-service`: `python -m venv .venv && source .venv/bin/activate`
- [ ] **2.0.2** Install dependencies from `requirements.txt`: `pip install -r requirements.txt`
- [ ] **2.0.3** Verify `main.py` FastAPI app runs: `uvicorn main:app --reload` → `GET /health` returns 200
- [ ] **2.0.4** Create `/ai-service/services/` folder for business logic
- [ ] **2.0.5** Create `/ai-service/config.py` using `pydantic-settings` to load all env vars
- [ ] **2.0.6** Test Pinecone connection: init client, list indexes, confirm `mnnit-student-embeddings` exists
- [ ] **2.0.7** Test Gemini connection: call `text-embedding-004` with a sample string, print vector shape
- [ ] **2.0.8** Write `pytest` setup with a basic health check test

### Sprint 2 – Embedding Service (Week 1–2)

#### LangChain + Pinecone Setup
- [ ] **2.1.1** Create Pinecone index: dimension=768 (`text-embedding-004`), metric=cosine
- [ ] **2.1.2** Define vector metadata schema: `{ user_id, branch, year, is_active, skills[] }`
- [ ] **2.1.3** Implement `PineconeRepository` in `services/pinecone_repo.py`:
  - `upsert(user_id, vector, metadata)`
  - `ann_search(vector, top_k, filter)` → returns `[(id, score, metadata)]`
  - `delete(user_id)`
- [ ] **2.1.4** Test upsert + query with 3 dummy vectors

#### PDF Processing + Embeddings
- [ ] **2.1.5** Implement `EmbeddingService` in `services/embedding_service.py`:
  - `extract_text(pdf_bytes)` – use **PyMuPDF** (`fitz`) to extract text from PDF
  - `chunk_text(text)` – use LangChain `RecursiveCharacterTextSplitter` (chunk=512, overlap=50)
  - `embed_chunks(chunks[])` – use LangChain `GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")`
  - `mean_pool(vectors[])` – average chunk embeddings into one vector
  - `process_and_embed(user_id, pdf_bytes)` – orchestrate full pipeline
  - `delete_from_vector_db(user_id)` – remove user from Pinecone
- [ ] **2.1.6** Wire up `POST /embed` router to call `EmbeddingService.process_and_embed()`
- [ ] **2.1.7** Wire up `DELETE /embed/{user_id}` to call `EmbeddingService.delete_from_vector_db()`
- [ ] **2.1.8** Write pytest unit tests for `extract_text`, `chunk_text`, `embed_chunks`

### Sprint 3 – Midnight Batch Worker (Week 2)

- [ ] **2.2.1** Create `/workers/batch_embed.py` Python cron script
- [ ] **2.2.2** Script calls Node.js API `GET /internal/pending-embeddings` to get list of user IDs
- [ ] **2.2.3** For each user: download their Cloudinary PDF URL → run embedding pipeline
- [ ] **2.2.4** Rate limit: process max 10 users/minute to stay within Gemini free tier
- [ ] **2.2.5** On success: call Node.js `PATCH /internal/embedding-status` to mark `indexed`
- [ ] **2.2.6** Retry up to 3 times on failure; mark `failed` after exhaustion
- [ ] **2.2.7** Schedule with `python-cron` or host cron tab at 00:00 IST

### Sprint 4 – Search & Ranking (Week 2–3)

- [ ] **2.3.1** Implement `RankingService` in `services/ranking_service.py`:
  - `search(query, branch, year, top_k)` pipeline:
    - Step 1: Embed query → `GoogleGenerativeAIEmbeddings`
    - Step 2: ANN search Pinecone top-50 with `is_active=True` filter
    - Step 3: Post-filter by `branch`/`year` metadata
    - Step 4: Sort by cosine score DESC → take top `top_k`
    - Step 5: Generate explanations via Gemini Flash (parallel with `asyncio.gather`)
  - `get_detail(user_id, query)` – detailed matched skills breakdown
- [ ] **2.3.2** Implement `ExplanationEngine` in `services/explanation_engine.py`:
  - LangChain `PromptTemplate` + `ChatGoogleGenerativeAI(model="gemini-1.5-flash")`
  - `StringOutputParser` → returns 1–2 line string
  - Timeout: if LLM > 1.5s, skip explanation and return empty string
- [ ] **2.3.3** Wire up `POST /search` and `GET /search/{user_id}/detail` routers
- [ ] **2.3.4** Write integration tests for search with 5 indexed test vectors

### Sprint 5 – Moderation & Analytics (Week 3)

- [ ] **2.4.1** Implement `ModerationService` in `services/moderation_service.py`:
  - LangChain chain: `PromptTemplate` → `ChatGoogleGenerativeAI` → `JsonOutputParser`
  - Returns `{ passed: bool, violation_type: str|None, confidence: float }`
- [ ] **2.4.2** Wire up `POST /moderate` router
- [ ] **2.4.3** Implement `AnalyticsService.compute_trending(job_skills[][])` in `services/analytics_service.py`:
  - Count frequency of each skill across all job lists
  - Return top-15 sorted by count with `is_trending: bool`
- [ ] **2.4.4** Wire up `GET /analytics/trending` router
- [ ] **2.4.5** Write unit tests for moderation and analytics services

---

## Dev 3 – Backend Services: Jobs, Moderation, Notifications

> **Owns:** Job posting lifecycle, AI moderation, ban system, notifications engine

### Sprint 1 – MongoDB Models (Week 1)

- [ ] **3.1.1** Create `JobPosting` Mongoose model with all fields + indexes (coordinate with Dev 1)
- [ ] **3.1.2** Create `Notification` Mongoose model with compound index `{userId, isRead}`
- [ ] **3.1.3** Seed test data: 5 sample job postings with varied skills and deadlines

### Sprint 2 – Job Posting Module (Week 1–2)

- [ ] **3.2.1** `POST /jobs` – Alumni/Professor only (role middleware from Dev 1)
  - Validate required fields with Zod
  - Set `status: 'pending_moderation'`
  - Save to MongoDB
  - Enqueue to `moderation-queue`
  - Return `{ jobId, status: 'pending_moderation' }`
- [ ] **3.2.2** `GET /jobs` – list all active jobs (`status: 'active'`), paginated, sorted by deadline
- [ ] **3.2.3** `GET /jobs/:jobId` – fetch single job, include `postedBy` profile
- [ ] **3.2.4** `DELETE /jobs/:jobId` – Alumni withdraws own job; set `status: 'withdrawn'`
- [ ] **3.2.5** Implement automated job expiry: cron job every hour checks `deadline < now`, sets `status: 'expired'`
- [ ] **3.2.6** Write unit tests for JobService

### Sprint 3 – AI Moderation Module (Week 2)

- [ ] **3.3.1** After job save: call **Python AI service** `POST /moderate` with `{ job_id, title, description }`
- [ ] **3.3.2** Handle response `{ passed, violation_type, confidence }` from Python service:
  - If passed: update job `status: 'active'`, trigger notification engine
  - If failed: update job `status: 'rejected'`, call `BanManager`
- [ ] **3.3.3** Implement `BanManager` in Node.js:
  - `applyViolationPolicy(userId)`:
    - If `violationCount === 0`: set `banUntil = now + 3 days`, `violationCount++`
    - If `violationCount >= 1`: set `isBanned = true` (lifetime ban)
  - `checkActiveBan(userId)`: returns ban status + remaining time
- [ ] **3.3.4** On moderation fail: send email to alumni (Nodemailer + Gmail SMTP)
- [ ] **3.3.5** Integrate ban check into login and job-post routes (middleware from Dev 1)
- [ ] **3.3.6** Write unit tests for BanManager (mock the Python AI service call)

### Sprint 4 – Notification Module (Week 2–3)

- [ ] **3.4.1** Implement `NotificationEngine.triggerForNewJob(jobId, requiredSkills[])`:
  - Query all users where `skillPreferences` intersects with `requiredSkills`
  - Exclude `isActive: false` users
  - Batch insert notifications into MongoDB
- [ ] **3.4.2** `PUT /settings/preferences` – save `skillPreferences[]` to user record
- [ ] **3.4.3** `GET /notifications` – fetch all notifications for logged-in user, sorted newest-first
- [ ] **3.4.4** `PATCH /notifications/:id/read` – mark single notification as read
- [ ] **3.4.5** Invoke `NotificationEngine.triggerForNewJob()` after job passes moderation
- [ ] **3.4.6** Write unit tests for NotificationEngine
- [ ] **3.4.7** API integration test with Dev 4 (Frontend notifications page)

### Sprint 5 – Polish & Integration (Week 3–4)

- [ ] **3.5.1** End-to-end test: Post job → Moderation → Active → Notification → Expiry
- [ ] **3.5.2** Stress test moderation queue with 50 concurrent job submissions
- [ ] **3.5.3** Verify ban system persistence across server restarts
- [ ] **3.5.4** Document all job + notification API endpoints in shared Postman collection

---

## Dev 4 – Frontend Engineer: React UI & Integration

> **Owns:** Complete React frontend, all pages, role-based routing, API integration

### Sprint 1 – Project Setup & Design System (Week 1)

- [ ] **4.1.1** Initialize React project with Vite in `/frontend`
- [ ] **4.1.2** Install dependencies: `react-router-dom`, `axios`, `zustand` (or Context API), `react-hook-form`, `zod`
- [ ] **4.1.3** Set up folder structure:
  ```
  /src
    /pages
    /components
    /hooks
    /services    ← API calls
    /store       ← global state
    /utils
    /assets
  ```
- [ ] **4.1.4** Create global CSS design tokens (colors, spacing, typography, shadows)
- [ ] **4.1.5** Set up Google Fonts (Inter or Outfit)
- [ ] **4.1.6** Install and configure Axios instance with base URL + JWT interceptor (auto-attach token)
- [ ] **4.1.7** Implement token refresh interceptor (retry request on 401 with refresh token)
- [ ] **4.1.8** Set up React Router with protected route wrapper (`<PrivateRoute>`)
- [ ] **4.1.9** Set up global auth store (Zustand): `user`, `token`, `login()`, `logout()`

### Sprint 2 – Auth Pages (Week 1)

- [ ] **4.2.1** **Register Page** (`/register`):
  - Email, password, role selector (Student / Professor / Alumni)
  - Client-side Zod validation
  - Submit → call `POST /auth/register`
  - Show OTP input form on success
- [ ] **4.2.2** **OTP Verification Page** (`/verify`):
  - 6-digit OTP input with auto-focus
  - Submit → call `POST /auth/verify-otp`
  - Redirect to login on success
- [ ] **4.2.3** **Login Page** (`/login`):
  - Email + Password form
  - Submit → `POST /auth/login` → store token in state
  - Show "Account Banned" error with ban expiry
  - Redirect to dashboard on success
- [ ] **4.2.4** Logout button (in navbar) → `POST /auth/logout` → clear store → redirect to `/login`

### Sprint 3 – Dashboard & Profile Pages (Week 2)

- [ ] **4.3.1** **Dashboard Page** (`/dashboard`):
  - Shows role-specific welcome and quick-action cards
  - Notification badge count (from `GET /notifications`)
  - Trending skills section (from `GET /analytics/trending-skills`)
- [ ] **4.3.2** **My Profile Page** (`/profile`):
  - Show current branch, year, skills
  - PDF resume upload area (drag-and-drop) → `POST /profile/resume`
  - Show upload progress + success/error state
  - Skill tag editor: add / remove skills → `PUT /profile`
  - Soft delete button with confirmation modal
- [ ] **4.3.3** **View Profile Page** (`/profile/:userId`):
  - Read-only profile view for others
  - "Download Resume" button → `GET /profile/resume/:userId` → opens signed URL
  - Display matched skills and explanation (if arriving from search results)

### Sprint 4 – Search & Job Pages (Week 2–3)

- [ ] **4.4.1** **Search Page** (`/search`):
  - Query text input
  - Filter panel: Branch dropdown, Year selector (optional)
  - "Search" button → `POST /search`
  - Show loading skeleton while fetching
  - Results grid: student cards with match %, explanation, matched skills chips
  - Click card → navigate to `/profile/:userId`
- [ ] **4.4.2** **Jobs Listing Page** (`/jobs`):
  - List of active job cards (title, company, skills, deadline)
  - Filter/sort by skills or deadline
  - Alumni: see "My Posted Jobs" tab with withdraw button
- [ ] **4.4.3** **Post Job Page** (`/jobs/create`) – Alumni/Professor only:
  - Form: title, description, required skills (tag input), deadline (date picker)
  - Submit → `POST /jobs`
  - Show "pending moderation" state with estimated review time
- [ ] **4.4.4** **Job Detail Page** (`/jobs/:jobId`):
  - Full job description, required skills list, deadline countdown
  - Poster profile card

### Sprint 5 – Notifications & Settings (Week 3)

- [ ] **4.5.1** **Notifications Page** (`/notifications`):
  - List of all notifications, newest first
  - Unread items highlighted
  - Click → mark as read (`PATCH /notifications/:id/read`) + navigate to job
- [ ] **4.5.2** **Settings Page** (`/settings`):
  - Skill preferences multi-select (tag input)
  - Save → `PUT /settings/preferences`
  - Show current ban status if applicable

### Sprint 6 – Polish & Integration (Week 3–4)

- [ ] **4.6.1** Implement responsive design for all pages (mobile-first breakpoints)
- [ ] **4.6.2** Add loading states and skeleton loaders on all data-fetching pages
- [ ] **4.6.3** Add toast notifications for all success/error API responses
- [ ] **4.6.4** Implement global 401/403 error handler in Axios interceptor → redirect to login
- [ ] **4.6.5** Role-based UI hiding: hide "Post Job" from students, hide "Upload Resume" from alumni
- [ ] **4.6.6** End-to-end test with backend: full user journey (register → search → download → post job)
- [ ] **4.6.7** Browser compatibility check (Chrome, Firefox, Edge)
- [ ] **4.6.8** Write component-level tests with React Testing Library

---

## Phase 4 – Integration & QA (All Members – Week 4)

> Run these together as a team before final submission.

### System Integration Tests

- [ ] **INT-01** Full student journey: Register → Verify → Upload Resume → Appear in Search
- [ ] **INT-02** Full alumni journey: Register → Post Job → Moderation → Job Goes Live → Students notified
- [ ] **INT-03** Ban system: Alumni posts violating content → gets 3-day ban → cannot post again
- [ ] **INT-04** Lifetime ban: Alumni violates twice → lifetime ban → cannot login
- [ ] **INT-05** Search accuracy: query matches correct students with relevant explanations
- [ ] **INT-06** Embedding exclusion: soft-deleted users do not appear in search results
- [ ] **INT-07** Job expiry: expired jobs disappear from listing, retained in analytics
- [ ] **INT-08** Skill analytics: trending skills update after new jobs are posted
- [ ] **INT-09** Resume download log: every download is recorded in `DownloadLog`
- [ ] **INT-10** Token expiry: access token expires, refresh token rotates correctly

### Performance Checks

- [ ] **PERF-01** Search response time < 2 seconds (measure with 50 vectors indexed)
- [ ] **PERF-02** Resume upload + embedding queued within 3 seconds
- [ ] **PERF-03** Notification insert completes for 100 matching users within 1 second
- [ ] **PERF-04** Trending skills API cached and responds < 100ms on repeat calls

### Security Checks

- [ ] **SEC-01** Unauthenticated request to any endpoint returns 401
- [ ] **SEC-02** Student cannot call `POST /jobs` (returns 403)
- [ ] **SEC-03** Alumni cannot upload a resume (returns 403)
- [ ] **SEC-04** Signed resume URLs expire after 15 minutes
- [ ] **SEC-05** Banned user cannot login (returns 403 with ban expiry message)
- [ ] **SEC-06** User cannot download resume without being verified and logged in

---

## Final Delivery Checklist

- [ ] All API endpoints documented in Postman and exported to `/docs`
- [ ] README.md written with: project overview, local setup guide, environment variables, team info
- [ ] All `.env.example` files updated with every required variable
- [ ] MongoDB Atlas production cluster configured with backups
- [ ] Frontend deployed to Vercel / Netlify
- [ ] Backend deployed to Railway / Render
- [ ] Final demo walkthrough recorded (5 min video covering all user flows)
- [ ] SRS.md, SDD.md, and this file committed to `/docs` folder in repo

---

## Quick Reference: Who Owns What

| Module | Owner | Language | Key Files |
|--------|-------|----------|-----------|
| Auth (register, login, JWT) | **Dev 1** | Node.js | `AuthController`, `AuthService`, `OTPService` |
| User Profile & Resume Upload | **Dev 1** | Node.js | `ProfileService`, `ResumeService` (Cloudinary) |
| MongoDB Models & Indexes | **Dev 1** (with Dev 3) | Node.js | `User`, `StudentProfile`, `DownloadLog` models |
| Python AI Microservice setup | **Dev 2** | Python | `main.py`, `Dockerfile`, `requirements.txt` |
| PDF Parsing + Embedding Pipeline | **Dev 2** | Python | `services/embedding_service.py`, PyMuPDF, LangChain |
| Semantic Search & Ranking | **Dev 2** | Python | `services/ranking_service.py`, `services/explanation_engine.py` |
| AI Moderation (LLM check) | **Dev 2** | Python | `services/moderation_service.py` |
| Skill Analytics | **Dev 2** | Python | `services/analytics_service.py` |
| Midnight Batch Worker | **Dev 2** | Python | `/workers/batch_embed.py` |
| Job Posting Lifecycle | **Dev 3** | Node.js | `JobService`, `JobController`, expiry cron |
| Moderation Orchestration & Ban | **Dev 3** | Node.js | `BanManager` (calls Dev 2's Python service) |
| Notifications Engine | **Dev 3** | Node.js | `NotificationEngine`, `NotificationController` |
| React Frontend (all pages) | **Dev 4** | React | All `/frontend/src/pages/**` |
| CI/CD & Deployment | **Dev 1 + Dev 4** | — | GitHub Actions, Dockerfiles |
| Integration Testing | **All** | — | `/tests/integration/**` |
