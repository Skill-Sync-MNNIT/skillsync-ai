<div align="center">

# 🎓 SkillSync AI

### MNNIT Academic Talent Intelligence Platform

*A closed, AI-powered platform connecting MNNIT students, alumni, and professors through semantic resume discovery and intelligent talent matching.*

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://cloud.mongodb.com)
[![LangChain](https://img.shields.io/badge/LangChain-Python-1C3C3C?logo=langchain&logoColor=white)](https://python.langchain.com)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Repo Structure](#repo-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Team](#team)
- [Branching Strategy](#branching-strategy)

---

## About

SkillSync AI is a **private, invite-only** platform exclusively for verified MNNIT users. It uses vector embeddings and LangChain to:

- 🔍 **Semantically search** for students by skills, not just keywords
- 📄 **Auto-extract skills** from uploaded PDF resumes
- 💼 **Allow alumni/professors** to post jobs with AI-based moderation
- 📊 **Show trending skills** from the last 6 months of job postings
- 🔔 **Notify students** when jobs match their skill preferences

Access is restricted to `@mnnit.ac.in` emails (students), official faculty emails (professors), and alumni.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite, Axios, Zustand, React Router |
| **Backend API** | Node.js 18 + Express, Mongoose, Zod, JWT |
| **AI Service** | Python 3.11 + FastAPI + LangChain |
| **LLM & Embeddings** | Google Gemini Flash + `text-embedding-004` (free tier) |
| **Vector Database** | Pinecone (free tier – 100k vectors) |
| **Database** | MongoDB Atlas (free M0 cluster) |
| **Cache & Queue** | Upstash Redis (free tier) |
| **File Storage** | Cloudinary (free tier – resume PDFs) |
| **Email / OTP** | Nodemailer + Gmail SMTP |
| **Containerization** | Docker + Docker Compose |

---

## Repo Structure

```
skillsync-ai/
├── backend/          # Node.js + Express API (Auth, Jobs, Notifications)
├── ai-service/       # Python FastAPI + LangChain (Embeddings, Search, Moderation)
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── workers/          # Python cron jobs (midnight embedding batch)
├── frontend/         # React + Vite (all user-facing pages)
├── docs/             # SRS.md, SDD.md, IMPLEMENTATION_CHECKLIST.md
├── .env.example      # All required environment variables (no real secrets)
├── docker-compose.yml
└── README.md
```

---

## Local Setup

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [Python 3.11+](https://python.org)
- [Docker + Docker Compose](https://docs.docker.com/get-docker/)
- [Git](https://git-scm.com)

### 1. Clone the repo

```bash
git clone https://github.com/Skill-Sync-MNNIT/skillsync-ai.git
cd skillsync-ai
git checkout dev
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Fill in all values in .env (see Environment Variables section below)
```

### 3. Start infrastructure (MongoDB + AI Service)

```bash
docker-compose up -d
```

### 4. Start Node.js backend

```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### 5. Start Python AI service (without Docker)

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
```

### 6. Start React frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in these values:

| Variable | Where to get it |
|----------|----------------|
| `MONGO_URI` | MongoDB Atlas → Connect → Drivers |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |
| `PINECONE_API_KEY` | [pinecone.io](https://app.pinecone.io) → API Keys |
| `CLOUDINARY_*` | [cloudinary.com](https://cloudinary.com) → Dashboard |
| `UPSTASH_REDIS_*` | [upstash.com](https://upstash.com) → Redis → REST API |
| `GMAIL_APP_PASSWORD` | Google Account → Security → 2FA → App Passwords |

---

## Team

| Member | Role | Module Ownership |
|--------|------|-----------------|
| **Yugank** | Dev 1 – Project Lead | Node.js Backend: Auth, Profile, Resume, DB setup, CI/CD |
| **Vivek Sharma** | Dev 2 – AI/ML Engineer | Python FastAPI: Embeddings, Search, Ranking, Moderation |
| **TBD** | Dev 3 – Backend Services | Node.js: Jobs, Notifications, Ban System |
| **TBD** | Dev 4 – Frontend Engineer | React: All pages, Axios integration, Role-based UI |

---

## Branching Strategy

```
main      ← Production only. PR required. 1 review minimum.
  └── dev ← Integration branch. All features merge here first.
        ├── feat/auth-module       (Dev 1)
        ├── feat/ai-service        (Dev 2)
        ├── feat/jobs-notifications (Dev 3)
        └── feat/frontend          (Dev 4)
```

**Rules:**
- ❌ Never push directly to `main` or `dev`
- ✅ Always branch from `dev`
- ✅ Open PR to `dev` → 1 approval → merge
- ✅ Weekly: `dev` → PR to `main` after integration testing

---

<div align="center">
<sub>Built with ❤️ for MNNIT Allahabad</sub>
</div>
