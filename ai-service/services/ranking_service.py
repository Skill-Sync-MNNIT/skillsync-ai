from langchain_google_genai import GoogleGenerativeAIEmbeddings
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from config import settings
from services.pinecone_repo import PineconeRepository


from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import json

class RankingService:
    def __init__(self):
        self.embedder = GoogleGenerativeAIEmbeddings(
            model=settings.embedding_model,
            google_api_key=settings.gemini_api_key,
        )
        self.repo = PineconeRepository()
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=settings.groq_api_key,
            temperature=0.0,
            model_kwargs={"response_format": {"type": "json_object"}}
        )
        
        self.extract_prompt = PromptTemplate.from_template(
            "You are a recruitment AI processing a candidate search. Read the conversation history and the latest user query.\n"
            "Extract technical search parameters. Return EXACTLY valid JSON, no markdown.\n"
            "{{\n"
            "  \"limit\": 50,\n"
            "  \"min_cpi\": 0.0,\n"
            "  \"course\": null, // e.g., 'B.Tech', 'M.Tech', 'MCA'. Must be EXACTLY this casing. Default null.\n"
            "  \"branch\": null, // e.g., 'CSE', 'ECE', 'ME', 'IT'. Default null.\n"
            "  \"year\": null, // Integer of the year of study (1, 2, 3, 4). Default null.\n"
            "  \"core_query\": \"...\" // A succinct list of skills to execute the semantic vector search with.\n"
            "}}\n"
            "Query: {query}\nHistory: {history}"
        )
        self.extract_chain = self.extract_prompt | self.llm | StrOutputParser()

    async def search(
        self,
        query: str,
        branch: str | None = None,
        year: int | None = None,
        top_k: int = 10,
        history: list[dict] = None
    ) -> dict:
        hist_str = json.dumps(history[-4:] if history else [])
        
        # Default parameters
        limit = top_k
        min_cpi = 0.0
        core_query = query
        ext_course = None
        ext_branch = branch
        ext_year = year
        
        try:
            raw = await self.extract_chain.ainvoke({"query": query, "history": hist_str})
            import re
            json_match = re.search(r'\{.*\}', raw, re.DOTALL)
            if json_match:
                raw = json_match.group(0)
            data = json.loads(raw)
            if data.get("limit"): limit = int(data["limit"])
            if data.get("min_cpi"): min_cpi = float(data["min_cpi"])
            if data.get("course"): ext_course = str(data["course"])
            if data.get("branch"): ext_branch = str(data["branch"]).upper()
            if data.get("year"): ext_year = int(data["year"])
            if data.get("core_query") and str(data.get("core_query")).strip(): 
                core_query = data["core_query"]
        except Exception as e:
            print(f"[RankingService] Extraction failed: {e}\nRaw output was: {raw if 'raw' in locals() else 'None'}")
            
        print(f"Extracted Params: Limit={limit}, Min CPI={min_cpi}, Course={ext_course}, Branch={ext_branch}, Year={ext_year}, Core Query='{core_query}'")

        query_vector = self.embedder.embed_query(core_query)

        candidates = self.repo.search(
            vector=query_vector,
            top_k=min(limit, 100), # safety cap
            course=ext_course,
            branch=ext_branch,
            year=ext_year,
            min_cpi=min_cpi
        )

        filtered = [c for c in candidates if c["score"] >= 0.4]
        ranked = sorted(filtered, key=lambda x: x["score"], reverse=True)[:limit]

        # Generate a brief conversational summary
        summary = f"I've found {len(ranked)} candidate(s) for '{core_query}'"
        if history:
            summary = "Based on our context, " + summary.lower()
            
        if min_cpi > 0:
             summary += f" meeting the >{min_cpi} CPI threshold."
        else:
             summary += "."

        return {
            "candidates": ranked,
            "summary": summary,
            "filters": {
                "limit": limit,
                "min_cpi": min_cpi,
                "core_query": core_query
            }
        }

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
