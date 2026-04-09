from pinecone import Pinecone
from config import settings

class PineconeRepository:
    def __init__(self):
        pc = Pinecone(api_key=settings.pinecone_api_key)
        self.index = pc.Index(settings.pinecone_index)

    def upsert(self,user_id: str, vector: list[float], metadata: dict) -> None:
        self.index.upsert(
            vectors=[
                {
                    "id": user_id,
                    "values": vector,
                    "metadata": {
                        "user_id": user_id,
                        "course": metadata.get("course", ""),
                        "branch": metadata.get("branch", ""),
                        "year": metadata.get("year", ""),
                        "skills": metadata.get("skills", []),
                        "is_active": metadata.get("is_active", True),
                        "cpi": metadata.get("cpi", 0.0),
                    }
                }
            ]
        )
    
    def search(self,vector: list[float],top_k: int=50,course: str|None=None, branch: str|None=None, year:int|None=None, min_cpi:float=0.0) -> list[dict]:
        filter_dict : dict = {"is_active":{"$eq": True}}
        if course:
            filter_dict["course"] = {"$eq": course}
        if branch:
            filter_dict["branch"] = {"$eq": branch}
        if year is not None:
            filter_dict["year"] = {"$eq": year}
        if min_cpi > 0.0:
            filter_dict["cpi"] = {"$gte": min_cpi}
        results = self.index.query(
            vector=vector,
            top_k=top_k,
            filter=filter_dict,
            include_metadata=True
        )
        return [
            {
                "user_id": match["id"],
                "score": match["score"],
                "metadata": match.get("metadata", {}),
            }
            for match in results["matches"]
        ]
        
    def update_metadata(self, user_id: str, metadata: dict) -> None:
        try:
            self.index.update(id=user_id, set_metadata=metadata)
        except Exception as e:
            # Might throw if vector doesn't exist yet, we can silently swallow or raise
            print(f"[Pinecone] Failed to update metadata for {user_id}: {e}")

    def delete(self, user_id:str)->None:
        self.index.delete(ids=[user_id])

    def fetch(self,user_id:str)->dict | None:
        results = self.index.fetch(ids=[user_id])
        return results.vectors.get(user_id)

