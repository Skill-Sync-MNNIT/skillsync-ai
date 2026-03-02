# Product Requirements Document (PRD)

# SkillSync AI – MNNIT Academic Talent Intelligence Platform

**Version:** 1.0
**Product Type:** Closed AI-Powered Academic Networking & Recruitment System

---

## 1. Executive Summary

SkillSync AI is a private, AI-powered talent intelligence platform exclusively for MNNIT students, alumni, and professors.

It enables semantic resume discovery, explainable ranking, alumni-driven job postings, skill trend analytics, and secure internal resume sharing using vector embeddings and similarity-based retrieval.

The platform is restricted to verified MNNIT users only.

---

## 2. Product Vision

To build an internal AI-powered discovery engine that intelligently connects:

* Students
* Alumni
* Professors

within the MNNIT ecosystem through secure, explainable talent matching.

---

## 3. Problem Statement

Current academic networking lacks:

* Semantic resume understanding
* Intelligent student discovery
* Transparent ranking explanations
* Centralized alumni recruitment infrastructure
* Insight into in-demand skills

Manual screening is inefficient and keyword-based. No institutional AI intelligence layer exists.

---

## 4. Product Scope

### 4.1 In Scope (v1)

* Role-based authentication
* Resume upload and skill extraction
* Vector-based semantic ranking
* Alumni-only job posting
* AI-based job moderation
* Skill analytics (last 6 months)
* Preference-based notifications
* Resume download logging
* Soft delete model

### 4.2 Out of Scope (v1)

* Public access
* Internal messaging
* Admin dashboard
* Real-time push notifications
* Interview scheduling
* Ranking feedback loops

---

## 5. User Roles & Verification Model

| Role      | Verification Method               |
| --------- | --------------------------------- |
| Student   | `@mnnit.ac.in` email verification |
| Professor | Official listed email + OTP       |
| Alumni    | Email verification                |

All profiles are visible only to verified users.

### 5.1 Role Permissions Diagram

```mermaid
graph TD
    subgraph Roles
        S["Student"]
        P["Professor"]
        A["Alumni"]
    end

    subgraph Permissions
        UP[Upload Resume]
        ES[Edit Skills]
        SR[Search and Rank Students]
        DR[Download Resumes]
        JP[Post Job Openings]
        VA[View Skill Analytics]
        SN[Set Skill Notifications]
        SD[Soft Delete Account]
    end

    S --> UP
    S --> ES
    S --> SR
    S --> DR
    S --> VA
    S --> SN
    S --> SD

    P --> SR
    P --> DR
    P --> JP
    P --> VA

    A --> SR
    A --> DR
    A --> JP
    A --> VA
    A --> SN
```

---

## 6. Functional Requirements

### 6.1 Authentication & Access Control

The system shall:

* Require email verification during registration
* Enforce mandatory role selection
* Issue JWT-based authentication
* Implement role-based access control
* Store and enforce ban status

Acceptance Criteria:

* Unverified users cannot access platform features
* Only alumni accounts can create job postings
* Banned users cannot log in

### 6.1.1 Authentication Flow Diagram

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React Frontend
    participant API as Node.js API
    participant Auth as Auth Service
    participant DB as MongoDB

    U->>FE: Register (Email, Role)
    FE->>API: POST /auth/register
    API->>Auth: Verify MNNIT email domain
    Auth-->>API: Domain check result

    alt Valid MNNIT Email
        API->>DB: Create user (isVerified: false)
        API->>U: Send verification OTP/Link
        U->>FE: Enter OTP
        FE->>API: POST /auth/verify-otp
        API->>DB: Set isVerified true
        API-->>FE: 200 OK - Verification successful
    else Invalid Email
        API-->>FE: 400 - Email domain not permitted
    end

    U->>FE: Login (Email, Password)
    FE->>API: POST /auth/login
    API->>DB: Fetch user record
    DB-->>API: User record

    alt Banned User
        API-->>FE: 403 - Account banned
    else Unverified User
        API-->>FE: 403 - Email not verified
    else Valid User
        API->>Auth: Generate JWT
        Auth-->>API: JWT Token
        API-->>FE: 200 OK + JWT
        FE->>U: Dashboard (role-based UI)
    end
```

---

### 6.2 Profile Management

Students shall be able to:

* Upload PDF resume
* Auto-extract skills
* Manually edit skills
* Add branch and year
* Soft delete account

Branch and year shall function as filters only.

Acceptance Criteria:

* Resume upload triggers embedding generation
* Soft-deleted users are excluded from search
* Embeddings for inactive users are ignored

---

### 6.3 Resume Processing & Embeddings

The system shall:

* Extract text from uploaded PDF resumes
* Chunk resume content
* Generate vector embeddings
* Store embeddings in vector database
* Link embeddings via userId
* Regenerate embeddings on resume upload
* Perform midnight batch updates for minor profile edits

Acceptance Criteria:

* Only active users are indexed
* Search response time < 2 seconds
* Embedding regeneration optimized for cost

### 6.3.1 Resume Processing Pipeline Diagram

```mermaid
flowchart TD
    A([Student Uploads PDF]) --> B[Parse and Extract Text]
    B --> C{Extraction Successful?}
    C -- No --> ERR([Error - Notify User])
    C -- Yes --> D[Chunk Resume Content]
    D --> E[AI Skill Extraction via NLP Model]
    E --> F{Manual Edits?}
    F -- Yes --> G[Update Skills in MongoDB]
    F -- No --> G
    G --> H[Generate Vector Embeddings via Embedding Service]
    H --> I{User Active?}
    I -- Yes --> J[(Vector Database - Store or Replace Embeddings)]
    I -- No - Soft Deleted --> SKIP([Skip Indexing])
    J --> K([Resume Indexed Successfully])

    subgraph Batch ["Midnight Batch Job"]
        MB[Fetch Minor Profile Edits] --> MH[Regenerate Embeddings]
        MH --> J
    end
```

---

### 6.4 AI-Based Query Ranking

The system shall:

1. Accept a user search query
2. Apply optional branch/year filters
3. Convert query to embedding
4. Retrieve top candidates from vector database
5. Rank by similarity score only
6. Display match percentage
7. Generate 1–2 line explanation

Ranking Formula:

Final Score = Vector Similarity Score Only

Acceptance Criteria:

* Filters do not influence similarity score
* Each result displays match percentage
* Explanation is generated for each result

### 6.4.1 AI Ranking Flow Diagram

```mermaid
sequenceDiagram
    actor U as Searcher (Alumni or Professor)
    participant FE as React Frontend
    participant API as Node.js API
    participant RS as Ranking Service
    participant VDB as Vector Database
    participant LLM as Explanation LLM

    U->>FE: Enter Search Query + optional filters (Branch, Year)
    FE->>API: POST /search with query, branch, year
    API->>RS: Forward query and filters

    RS->>RS: Convert query to Vector Embedding
    RS->>VDB: ANN Search Top-K candidates
    VDB-->>RS: Candidate vectors and userId list

    RS->>RS: Apply Branch and Year pre-filter (metadata only)
    RS->>RS: Compute Cosine Similarity Score

    loop For each ranked candidate
        RS->>LLM: Generate 1-2 line explanation
        LLM-->>RS: "89% Match - Strong backend, Node.js expert"
    end

    RS-->>API: Ranked results with userId, score%, explanation
    API-->>FE: Display ranked student cards
    FE->>U: Show results with Match % and Explanation
```

---

### 6.5 Detailed Profile View

The system shall provide:

* Structured explanation of match
* Bullet list of matched skills
* Experience relevance summary

---

### 6.6 Job Posting (Alumni Only)

The system shall allow alumni to:

* Create job postings
* Add required skills
* Set application deadline

The system shall:

* Automatically hide expired jobs
* Retain expired jobs for analytics

Acceptance Criteria:

* Only alumni role can access job creation
* Expired jobs are not visible in active listings

### 6.6.1 Job Posting Lifecycle Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft : Alumni creates job post
    Draft --> PendingModeration : Submit for review
    PendingModeration --> Active : AI Moderation Passed
    PendingModeration --> Rejected : Violation Detected
    Rejected --> [*] : Post removed
    Active --> Expired : Deadline passed (auto)
    Active --> Withdrawn : Alumni manually removes
    Expired --> ArchivedAnalytics : Stored for Skill Analytics
    Withdrawn --> [*]
    ArchivedAnalytics --> [*] : Retained for 6-month analytics window
```

---

### 6.7 Skill Analytics

The system shall:

* Analyze job postings from last 6 months
* Extract required skills
* Identify trending skills
* Display “Important Skills” section

---

### 6.8 Notifications

The system shall:

* Allow users to set skill preferences
* Match new jobs against preferences
* Store notifications in database

Acceptance Criteria:

* Notifications visible on dashboard
* No real-time push required in v1

### 6.8.1 Notification Flow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Node.js API
    participant NE as Notification Engine
    participant DB as MongoDB

    U->>FE: Set skill preferences e.g. React, ML
    FE->>API: PUT /user/preferences
    API->>DB: Save skillPreferences array

    Note over API, NE: New job posted by Alumni

    API->>NE: Trigger new job created with requiredSkills
    NE->>DB: Fetch all users with matching skillPreferences
    DB-->>NE: Matching user list

    loop For each matching user
        NE->>DB: Insert notification with userId, jobId, message, timestamp
    end

    U->>FE: Visit Dashboard
    FE->>API: GET /notifications
    API->>DB: Fetch unread notifications for userId
    DB-->>API: Notification list
    API-->>FE: Display notification badges and list
```

---

### 6.9 Resume Download Logging

The system shall:

* Allow verified users to download resumes
* Log downloaderId, resumeOwnerId, and timestamp

---

### 6.10 AI-Based Moderation

All job postings shall be scanned by AI.

Checks include:

* Offensive language
* Spam content
* Malicious links

Violation Policy:

* 1st violation → 3-day ban
* 2nd violation → Lifetime ban

Acceptance Criteria:

* Ban status stored in user record
* Banned users cannot post jobs

### 6.10.1 AI Moderation & Ban System Diagram

```mermaid
flowchart TD
    A([Alumni Submits Job Post]) --> B[AI Moderation Service]
    B --> C{All Checks Passed?}
    C -- Yes - Clean Content --> D([Job Goes Live])
    C -- No - Violation Found --> E[Fetch User Violation History]
    E --> F{Previous Violations Count}
    F -- 0 violations --> G["Issue 3-Day Ban (violationCount = 1)"]
    F -- 1 or more violations --> H["Issue Lifetime Ban (isBanned = true)"]
    G --> I[Store Ban Status in MongoDB]
    H --> I
    I --> J[Reject Job Post]
    J --> K([Notify Alumni of Violation via Email])

    subgraph LoginCheck ["At Login or Every API Request"]
        L{isBanned or banUntil is future?} -- Yes --> M([403 - Account Blocked])
        L -- No --> N([Allow Access])
    end
```

---

## 7. Non-Functional Requirements

* Query response time < 2 seconds
* Secure resume storage
* Scalable for full MNNIT student base
* Controlled API usage
* Closed ecosystem (no public endpoints)
* Embedding updates optimized via batching

---

## 8. Security & Privacy

* Verified access only
* Role-based visibility
* Resume download logging enforced
* Soft delete hides from search but preserves data
* Embeddings excluded for inactive users

---

## 9. Success Metrics

* Average query latency < 2 seconds
* Resume processing success rate > 99%
* Moderation accuracy > 95%
* Monthly active search users growth
* Job-to-search conversion rate

---

## 10. System Architecture Overview

### High-Level Components

* React Frontend (Role-based UI)
* Node.js + Express Backend
* Authentication Service
* Resume Processing Service
* Embedding Service
* Ranking Service
* AI Moderation Service
* Notification Engine
* Skill Analytics Service
* MongoDB (Structured Data)
* Vector Database (Embeddings)

---

## 11. System Architecture Diagram (Mermaid)

```mermaid
flowchart LR
    A["User - Student / Alumni / Professor"] --> B[React Frontend]
    B --> C[Node.js API Layer]
    C --> D[Authentication Service]
    C --> E[Resume Processing Service]
    C --> F[Embedding Service]
    C --> G[Ranking Service]
    C --> H[AI Moderation Service]
    C --> I[Notification Engine]
    C --> J[Skill Analytics Service]
    E --> K[Vector Database]
    F --> K
    C --> L[MongoDB]
    G --> K
    G --> L
    H --> L
    I --> L
    J --> L
```

### 11.1 Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USER {
        string userId PK
        string email
        string role
        boolean isVerified
        boolean isActive
        boolean isBanned
        date banUntil
        int violationCount
        string skillPreferences
        date createdAt
    }

    STUDENT_PROFILE {
        string profileId PK
        string userId FK
        string branch
        int year
        string skills
        string resumeUrl
        boolean embeddingUpdated
        date lastUpdated
    }

    EMBEDDING {
        string embeddingId PK
        string userId FK
        float vector
        date generatedAt
    }

    JOB_POSTING {
        string jobId PK
        string postedBy FK
        string title
        string description
        string requiredSkills
        date deadline
        string status
        boolean isModerationPassed
    }

    NOTIFICATION {
        string notifId PK
        string userId FK
        string jobId FK
        string message
        boolean isRead
        date createdAt
    }

    DOWNLOAD_LOG {
        string logId PK
        string downloaderId FK
        string resumeOwnerId FK
        date timestamp
    }

    USER ||--o| STUDENT_PROFILE : "has profile"
    USER ||--o{ EMBEDDING : "indexed as"
    USER ||--o{ JOB_POSTING : "posts"
    USER ||--o{ NOTIFICATION : "receives"
    JOB_POSTING ||--o{ NOTIFICATION : "triggers"
    USER ||--o{ DOWNLOAD_LOG : "downloads resumes"
```

---

## 12. Roadmap

### MVP

* Authentication & role management
* Resume upload & embeddings
* AI search & ranking
* Alumni job posting
* Moderation system
* Stored notifications

### V1

* Skill analytics dashboard
* Structured explanation engine
* Ranking optimization

### V2

* Skill gap insights
* Search history
* Admin panel
* Ranking feedback refinement

### 12.1 Product Roadmap Gantt Chart

```mermaid
gantt
    title SkillSync AI - Product Roadmap
    dateFormat  YYYY-MM-DD
    section MVP
    Authentication and Role Management   :a1, 2024-01-01, 14d
    Resume Upload and Embeddings         :a2, after a1, 14d
    AI Search and Ranking                :a3, after a2, 14d
    Alumni Job Posting                   :a4, after a1, 10d
    AI Moderation System                 :a5, after a4, 10d
    Stored Notifications                 :a6, after a4, 7d

    section V1
    Skill Analytics Dashboard            :b1, after a3, 14d
    Structured Explanation Engine        :b2, after a3, 10d
    Ranking Optimization                 :b3, after b2, 10d

    section V2
    Skill Gap Insights                   :c1, after b1, 14d
    Search History                       :c2, after b3, 7d
    Admin Panel                          :c3, after c1, 21d
    Ranking Feedback Refinement          :c4, after c3, 14d
```

---

## 13. Strategic Positioning

SkillSync AI is an internal academic talent intelligence system that leverages vector-based semantic ranking and explainable AI to connect alumni and students within MNNIT securely and intelligently.
