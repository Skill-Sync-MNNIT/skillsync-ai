# SkillSync AI – Team Implementation Checklist

**Project:** SkillSync AI – MNNIT Academic Talent Intelligence Platform
**Team Size:** 4 Members
**Version:** 1.0
**Reference Docs:** SRS.md, SDD.md

---

## Team Assignment Overview

```
Dev 1 – Project Lead & Backend Core (Auth, Profile, DB Setup)
Dev 2 – AI/ML Engineer (Embeddings, Search, Ranking, Analytics)
Dev 3 – Backend Services (Jobs, Moderation, Notifications)
Dev 4 – Frontend Engineer (React UI, all pages, integration)
```

---

## Phase 0 – Project Setup (All Members Together)

> Complete this phase together in a single session before splitting into individual work.

- [ ] **0.1** Create GitHub repository with `main` and `develop` branches
- [ ] **0.2** Define branch naming convention: `feat/<name>`, `fix/<name>`, `chore/<name>`
- [ ] **0.3** Set up monorepo structure:
  ```
  /skillsync-ai
    /backend       ← Node.js + Express
    /frontend      ← React
    /workers       ← Embedding & cron jobs
    /docs          ← SRS.md, SDD.md, this file
  ```
- [ ] **0.4** Create `.env.example` with all required variables (no real secrets)
- [ ] **0.5** Set up shared `ESLint` + `Prettier` config and commit hooks (Husky)
- [ ] **0.6** Create `docker-compose.yml` for local MongoDB + Redis
- [ ] **0.7** Set up MongoDB Atlas project and invite all team members
- [ ] **0.8** Set up Pinecone (or Weaviate) account and share API keys securely
- [ ] **0.9** Create shared Postman workspace and import API collection
- [ ] **0.10** Schedule daily 15-min standup and weekly integration session

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
- [ ] **1.1.7** Set up Redis client (Bull queue + cache)
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
- [ ] **1.3.3** `POST /profile/resume` – accept PDF upload (multer), validate file type + size limit (5MB)
- [ ] **1.3.4** Upload PDF to S3/Cloud Storage, store key in `StudentProfile.resumeStorageKey`
- [ ] **1.3.5** On upload: fire embedding job to Bull queue, set `embeddingStatus: 'pending'`
- [ ] **1.3.6** `GET /profile/resume/:userId` – generate signed URL (15 min TTL), log download
- [ ] **1.3.7** `DELETE /profile` – soft delete: set `isActive: false`, remove from vector index
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

## Dev 2 – AI/ML Engineer: Embeddings, Search, Ranking, Analytics

> **Owns:** Embedding pipeline, vector database, semantic search, ranking, skill analytics

### Sprint 1 – Embedding Infrastructure (Week 1–2)

#### Vector DB Setup
- [ ] **2.1.1** Create Pinecone index: dimension=1536 (OpenAI) or 768 (HuggingFace), metric=cosine
- [ ] **2.1.2** Define metadata schema for vectors: `{ userId, branch, year, isActive, skills }`
- [ ] **2.1.3** Implement `VectorRepository` class: `upsert()`, `annSearch()`, `delete()`, `fetchById()`
- [ ] **2.1.4** Test vector insert + ANN query with dummy data

#### Embedding Service
- [ ] **2.1.5** Implement `EmbeddingService`:
  - `generateEmbeddings(textChunks[])` – call OpenAI `text-embedding-3-small` or HuggingFace
  - `meanPool(vectors[])` – aggregate chunk embeddings into single vector
  - `upsertToVectorDB(userId, vector, metadata)`
  - `deleteFromVectorDB(userId)`
- [ ] **2.1.6** Implement PDF text extraction util: use `pdf-parse` or `pdfjs-dist`
- [ ] **2.1.7** Implement text chunker: 512-token windows with 50-token overlap
- [ ] **2.1.8** Implement `SkillExtractor`: regex + LLM prompt to extract normalized skills from text
- [ ] **2.1.9** Create Bull job processor for embedding queue:
  - Listens on `embedding-queue`
  - Runs: extract → chunk → embed → upsert → update `embeddingStatus` in MongoDB
- [ ] **2.1.10** Write unit tests for EmbeddingService and SkillExtractor

### Sprint 2 – Midnight Batch Worker (Week 2)

- [ ] **2.2.1** Create cron job runner in `/workers` (node-cron or Bull repeatable job)
- [ ] **2.2.2** Cron triggers midnight at 00:00 IST
- [ ] **2.2.3** Batch query: fetch all users with `embeddingStatus: 'pending'` and `isActive: true`
- [ ] **2.2.4** Re-run embedding pipeline for each (with rate limiting to avoid API throttle)
- [ ] **2.2.5** Update `embeddingStatus: 'indexed'` and `lastEmbeddingAt` on success
- [ ] **2.2.6** Retry failed embeddings up to 3 times, mark `'failed'` after exhaustion
- [ ] **2.2.7** Write worker integration test with mocked Embedding API

### Sprint 3 – Search & Ranking (Week 2–3)

- [ ] **2.3.1** Implement `RankingService.search(query, filters)`:
  - Step 1: Embed the query text
  - Step 2: ANN lookup top-50 from Vector DB with `isActive: true` filter
  - Step 3: Apply branch/year metadata filters post-ANN
  - Step 4: Sort by cosine similarity DESC
  - Step 5: Take top-10
  - Step 6: Fetch full profiles from MongoDB for each result
- [ ] **2.3.2** `POST /search` – wire up controller, apply auth middleware
- [ ] **2.3.3** Implement Redis query cache: cache query embedding for 5 min (hash query text as key)
- [ ] **2.3.4** Implement `ExplanationEngine`:
  - Build prompt from candidate profile + original query
  - Call LLM API (GPT-4-mini or Gemini Flash)
  - Parse and return 1–2 line explanation
- [ ] **2.3.5** Parallelize LLM calls for top-10 results using `Promise.all()`
- [ ] **2.3.6** `GET /search/:userId/detail` – return matched skills breakdown + explanation
- [ ] **2.3.7** Enforce end-to-end latency < 2s; add timeout fallback if LLM is slow (skip explanation)
- [ ] **2.3.8** Write integration tests for search endpoint

### Sprint 4 – Skill Analytics (Week 3)

- [ ] **2.4.1** Create `JobPostings` Mongoose model (coordinate with Dev 3 for schema)
- [ ] **2.4.2** Create `SkillAnalyticsService.computeTrending()`:
  - Query all jobs with `createdAt >= 6 months ago`
  - Aggregate `requiredSkills[]` across all postings
  - Count skill frequency
  - Sort and pick top-15 as trending
- [ ] **2.4.3** `GET /analytics/trending-skills` – call service, cache result in Redis (1 hr TTL)
- [ ] **2.4.4** Invalidate cache on every new job post (hook into Dev 3's job creation flow)
- [ ] **2.4.5** Write unit tests for SkillAnalyticsService

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

- [ ] **3.3.1** Create Bull queue processor for `moderation-queue`
- [ ] **3.3.2** Implement `ModerationService.scanJobPost(content)`:
  - Build prompt for LLM: check for offensive language, spam, malicious links
  - Parse LLM JSON response: `{ passed, violationType, confidence }`
  - Optionally run URL safety check (Google Safe Browsing API)
- [ ] **3.3.3** Implement `BanManager`:
  - `applyViolationPolicy(userId)`:
    - If `violationCount === 0`: set `banUntil = now + 3 days`, increment `violationCount`
    - If `violationCount >= 1`: set `isBanned = true` (lifetime)
  - `checkActiveBan(userId)`: returns ban status and remaining ban time
- [ ] **3.3.4** On moderation pass: update job `status: 'active'`, trigger notification engine
- [ ] **3.3.5** On moderation fail: update job `status: 'rejected'`, call BanManager, send email to alumni
- [ ] **3.3.6** Integrate ban check into login and job-post routes (middleware from Dev 1)
- [ ] **3.3.7** Write unit tests for ModerationService and BanManager

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

| Module | Owner | Key Files |
|--------|-------|-----------|
| Auth (register, login, JWT) | **Dev 1** | `AuthController`, `AuthService`, `OTPService` |
| User Profile & Resume Upload | **Dev 1** | `ProfileService`, `ResumeService`, `StorageService` |
| MongoDB Models & Indexes | **Dev 1** (with Dev 3) | `User`, `StudentProfile`, `DownloadLog` models |
| Embedding Pipeline & Vector DB | **Dev 2** | `EmbeddingService`, `VectorRepository`, embedding worker |
| Semantic Search & Ranking | **Dev 2** | `RankingService`, `ExplanationEngine` |
| Skill Analytics | **Dev 2** | `SkillAnalyticsService` |
| Job Posting Lifecycle | **Dev 3** | `JobService`, `JobController`, expiry cron |
| AI Moderation & Ban System | **Dev 3** | `ModerationService`, `BanManager` |
| Notifications Engine | **Dev 3** | `NotificationEngine`, `NotificationController` |
| React Frontend (all pages) | **Dev 4** | All `/frontend/src/pages/**` |
| CI/CD & Deployment | **Dev 1 + Dev 4** | GitHub Actions, Dockerfile |
| Integration Testing | **All** | `/tests/integration/**` |
