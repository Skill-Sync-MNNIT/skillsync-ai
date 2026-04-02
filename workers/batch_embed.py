import sys
import os
import asyncio
import time
import requests
import cloudinary
import cloudinary.api
import cloudinary.utils
import schedule

# Add ai-service directory directly (folder name has a dash so can't be imported as a package)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'ai-service'))

from config import settings
from services.embedding_service import EmbeddingService

BACKEND_URL = settings.backend_url
SECRET = {"x-internal-secret": settings.internal_secret}
MAX_PER_MINUTE=10
MAX_RETRIES=3

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret
)

svc = EmbeddingService()

def get_pending_users() -> list[dict]:
    resp = requests.get(f"{BACKEND_URL}/internal/pending-embeddings",
    headers=SECRET, timeout=10)
    resp.raise_for_status()
    return resp.json().get("data",[])


def update_status(user_id: str, status: str) -> None:
    requests.patch(
        f"{BACKEND_URL}/internal/embedding-status",
        json={"userId": user_id, "status": status},
        headers={**SECRET,"Content-Type":"application/json"},
        timeout=10,
    )
    
def download_pdf(resume_storage_key:str) -> bytes:
    signed = cloudinary.utils.private_download_url(
        resume_storage_key,"pdf",resource_type="raw",
        expires_at=int(time.time()) + 300
    )
    pdf_resp = requests.get(signed, timeout=30)
    pdf_resp.raise_for_status()
    return pdf_resp.content

async def process_user(user:dict, attempt:int =1)->bool:
    user_id = user["userId"]
    try:
        update_status(user_id, "processing")
        pdf_bytes = download_pdf(user["resumeStorage"])
        await svc.process_resume(
            user_id=user_id,
            pdf_bytes=pdf_bytes,
            metadata={
                "branch": user.get("branch",""),
                "year": user.get("year",0),
                "is_active":True,
                "skills": user.get("skills",[])
            },
        )
        update_status(user_id,"indexed")
        print(f"[OK] {user_id} indexed (attempt {attempt})")
        return True
    except Exception as e:
        print(f"[FAIL] {user_id} failed attempt {attempt}: {e}")
        if attempt < MAX_RETRIES:
            await asyncio.sleep(2**attempt)
            return await process_user(user, attempt+1)
        update_status(user_id,"failed")
        print(f"[FAIL] {user_id} failed after {MAX_RETRIES} attempts")
        return False
    
async def run_batch()->None:
    print("Batch worker starting")
    users = get_pending_users()
    print(f"Found {len(users)} pending users")
    for i,user in enumerate(users):
        await process_user(user)
        if (i+1) % MAX_PER_MINUTE == 0 and (i+1)<len(users):
            print(f"Rate limit pause after {i+1} users")
            await asyncio.sleep(60)
    print("Batch worker finished")

def job()->None:
    asyncio.run(run_batch())

if __name__=="__main__":
    job()
    schedule.every(2).hours.do(job)

    print("Scheduler running (every 2h). Ctrl+C to stop")
    while True:
        schedule.run_pending()
        time.sleep(60)