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
                        "branch": metadata.get("branch", ""),
                        "year": metadata.get("year", ""),
                        "skills": metadata.get("skills", []),
                        "is_active": metadata.get("is_active", True),
                    }
                }
            ]
        )
    
    def search(self,vector: list[float],top_k: int=50,branch: str |None=None, year:int |None=None) -> list[dict]:
        filter_dict : dict = {"is_active":{"$eq": True}}
        if branch:
            filter_dict["branch"] = {"$eq": branch}
        if year is not None:
            filter_dict["year"] = {"$eq": year}
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
        
    def delete(self, user_id:str)->None:
        self.index.delete(ids=[user_id])

    def fetch(self,user_id:str)->dict | None:
        results = self.index.fetch(ids=[user_id])
        return results.vectors.get(user_id)

