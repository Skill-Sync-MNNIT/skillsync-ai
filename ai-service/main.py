from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import embed
from routers import search
from routers import moderate
from routers import analytics

app = FastAPI(
    title="SkillSync AI Service",
    description="LangChain-powered AI microservice for embeddings, search, ranking and moderation",
    version="1.0.0",
)

# Only allow calls from the Node.js backend — not public
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "skillsync-ai"}

app.include_router(embed.router, prefix="/embed", tags=["Embeddings"])
app.include_router(search.router, prefix="/search", tags=["Search & Ranking"])
app.include_router(moderate.router, prefix="/moderate", tags=["AI Moderation"])
app.include_router(analytics.router, prefix="/analytics", tags=["Skill Analytics"])