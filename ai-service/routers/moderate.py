from fastapi import APIRouter
from pydantic import BaseModel
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.moderation_service import ModerationService



router = APIRouter()
moderation_service = ModerationService()


class ModerateRequest(BaseModel):
    job_id : str
    title : str
    description : str


@router.post("")
async def moderate_job(request : ModerateRequest):
    result = await moderation_service.moderate(
        title = request.title,
        description = request.description, 
    )
    return {
        "job_id" : request.job_id,
        **result
    }

