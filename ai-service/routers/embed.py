import json
import sys
import os
import time
import requests
import cloudinary
import cloudinary.utils
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.embedding_service import EmbeddingService
from config import settings

router = APIRouter()

embedding_service = EmbeddingService()

# Configure Cloudinary (needed for private download)
cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
)

@router.post("")
async def embed_resume(
    user_id: str = Form(...),
    branch: str = Form(default=""),
    year: int = Form(default=0),
    skills: str = Form(default='[]'),
    file: UploadFile = File(...)    
):
    if file.content_type not in ["application/pdf"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF file.")
    
    pdf_bytes = await file.read()
    try:
        skills_list = json.loads(skills)
    except json.JSONDecodeError:
        skills_list = []
    
    try:
        result = await embedding_service.process_resume(
            user_id=user_id,
            pdf_bytes=pdf_bytes,
            metadata={
                "branch": branch,
                "year": year,
                "is_active": True,
                "skills": skills_list
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {"status":"indexed",**result}


class EmbedFromKeyRequest(BaseModel):
    user_id: str
    storage_key: str          # Cloudinary public_id
    branch: str = ""
    year: int = 0
    skills: list[str] = []


@router.post("/from-key")
async def embed_from_storage_key(body: EmbedFromKeyRequest):
    try:
        signed_url = cloudinary.utils.private_download_url(
            body.storage_key, "pdf",
            resource_type="raw",
            expires_at=int(time.time()) + 300,
        )
        resp = requests.get(signed_url, timeout=30)
        resp.raise_for_status()
        pdf_bytes = resp.content
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to download PDF from storage: {e}")

    try:
        result = await embedding_service.process_resume(
            user_id=body.user_id,
            pdf_bytes=pdf_bytes,
            metadata={
                "branch": body.branch,
                "year": body.year,
                "is_active": True,
                "skills": body.skills,
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    try:
        requests.patch(
            f"{settings.backend_url}/internal/embedding-status",
            json={"userId": body.user_id, "status": "indexed"},
            headers={"x-internal-secret": settings.internal_secret, "Content-Type": "application/json"},
            timeout=10,
        )
    except Exception as e:
        print(f"[embed/from-key] Failed to update backend status: {e}")

    return {"status": "indexed", **result}


@router.delete("/{user_id}")
async def delete_resume(user_id: str):
    await embedding_service.delete_from_vector_db(user_id)
    return {"status":"deleted","user_id":user_id}
    