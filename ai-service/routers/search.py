import asyncio
from fastapi import APIRouter, Query
from fastapi import HTTPException
from pydantic import BaseModel
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.ranking_service import RankingService
from services.explanation_engine import ExplanationEngine


router = APIRouter()
ranking_service = RankingService()
explanation_engine = ExplanationEngine()

class SearchRequest(BaseModel):
    query: str
    branch: str | None = None
    year: int | None = None
    top_k: int = 10
    history: list[dict] = []

@router.post("")
async def search_students(request: SearchRequest):
    result = await ranking_service.search(
        query=request.query,
        branch=request.branch,
        year=request.year,
        top_k=request.top_k,
        history=request.history
    )

    candidates = result.get("candidates", [])

    explanations = await asyncio.gather(*[
        explanation_engine.explain(
            query=request.query,
            skills=candidate["metadata"].get("skills",[])
        ) for candidate in candidates
    ])

    formatted_candidates = [
        {
            "user_id": candidate["user_id"],
            "score": round(candidate["score"],4),
            "explanation": explanations[i],
            "metadata": candidate["metadata"],
        }
        for i, candidate in enumerate(candidates)
    ]

    return {
        "candidates": formatted_candidates,
        "summary": result.get("summary", ""),
        "filters": result.get("filters", {})
    }


@router.get("/{user_id}/detail")
async def get_student_detail(user_id:str, query:str=Query(...)):
    detail = await ranking_service.get_detail(user_id,query)
    if not detail:
        raise HTTPException(status_code=404,detail="Student not found")
    return detail
    


