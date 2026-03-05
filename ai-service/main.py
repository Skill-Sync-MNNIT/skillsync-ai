from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

