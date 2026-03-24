from langchain_google_genai import GoogleGenerativeAIEmbeddings
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from config import settings
from services.pinecone_repo import PineconeRepository


class RankingService:
    def __init__(self):
        self.embedder = GoogleGenerativeAIEmbeddings(
            model=settings.embedding_model,
            google_api_key=settings.gemini_api_key,
        )
        self.repo = PineconeRepository()

    async def search(
        self,
        query: str,
        branch: str | None = None,
        year: int | None = None,
        top_k: int = 10,
    ) -> list[dict]:
        query_vector = self.embedder.embed_query(query)

        candidates = self.repo.search(
            vector=query_vector,
            top_k=50,
            branch=branch,
            year=year,
        )

        filtered = [c for c in candidates if c["score"] >= 0.4]

        ranked = sorted(filtered, key=lambda x: x["score"], reverse=True)[:top_k]

        return ranked

    async def get_detail(self, user_id: str, query: str) -> dict | None:
        record = self.repo.fetch(user_id)
        if not record:
            return None

        metadata = record.metadata if hasattr(record, "metadata") else {}

        return {
            "user_id": user_id,
            "branch": metadata.get("branch", ""),
            "year": metadata.get("year", 0),
            "skills": metadata.get("skills", []),
        }
