import json
import sys
import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from services.embedding_service import EmbeddingService

router = APIRouter()

embedding_service = EmbeddingService()

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


@router.delete("/{user_id}")
async def delete_resume(user_id: str):
    await embedding_service.delete_from_vector_db(user_id)
    return {"status":"deleted","user_id":user_id}
    