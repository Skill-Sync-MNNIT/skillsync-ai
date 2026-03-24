from fastapi import APIRouter
from pydantic import BaseModel
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.analytics_service import AnalyticsService

router = APIRouter()
analytics_service = AnalyticsService()

class TrendingRequest(BaseModel):
    job_skills : list[list[str]]
    
@router.post("/trending")
def get_trending_skills(request: TrendingRequest):
    return analytics_service.compute_trending(request.job_skills)