import os
import sys
from pymongo import MongoClient
import fitz  # PyMuPDF
import certifi
import json
import urllib.request
from bson import ObjectId

# Add the parent directory to the system path to allow imports from services
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.pinecone_repo import PineconeRepository
from config import settings

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser


# We'll use Groq to quickly extract CPI (since it's fast and we may have rate limits with Gemini)
CPI_EXTRACTION_PROMPT = PromptTemplate.from_template(
    "Extract the precise numerical CPI (Cumulative Performance Index) or CGPA from this resume excerpt.\n"
    "Return ONLY a valid JSON object containing exactly one key 'cpi' mapped to a float.\n"
    "If no CPI/CGPA is found, return {{\"cpi\": 0.0}}.\n"
    "Example format: {{\"cpi\": 8.5}}\n\n"
    "Resume text:\n{text}"
)

# Initialize LLM
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=settings.groq_api_key,
    temperature=0.0,
)
if getattr(settings, "groq_api_key_2", ""):
    f_llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=settings.groq_api_key_2,
        temperature=0.0,
    )
    llm = llm.with_fallbacks([f_llm])
    
cpi_chain = CPI_EXTRACTION_PROMPT | llm | StrOutputParser()

def extract_pdf_text_from_url(url: str) -> str:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            pdf_bytes = response.read()
        
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = "".join(page.get_text() for page in doc)
        doc.close()
        return text.strip()[:6000] # Cap extraction size to keep it fast
    except Exception as e:
        print(f"Failed to fetch/parse PDF from {url}: {e}")
        return ""

def extract_cpi_with_ai(text: str) -> float:
    if not text:
        return 0.0
    try:
        raw = cpi_chain.invoke({"text": text})
        raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(raw)
        return float(data.get("cpi", 0.0))
    except Exception as e:
        print(f"AI CPI extraction failed: {e}")
        return 0.0

def main():
    print("=" * 60)
    print("MIGRATING PINECONE VECTORS: APPENDING CPI METADATA")
    print("=" * 60)

    # 1. Connect to Mongo
    mongo_uri = settings.mongo_uri
    if not mongo_uri:
        print("ERROR: MONGO_URI configuration is missing.")
        return

    print("Connecting to MongoDB...")
    client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
    try:
        db = client.get_default_database() # Auto-gets from string
    except Exception:
        db = client["test"] # fallback default Mongoose db name if not in URI
    profiles_col = db["studentprofiles"] # Matches Mongoose model collection name "studentprofiles"

    print("Initializing Pinecone Repository...")
    pinecone_repo = PineconeRepository()

    profiles = list(profiles_col.find({"embeddingStatus": "indexed"}))
    success_count = 0
    total_count = len(profiles)
    
    print(f"Found {total_count} indexed Student Profiles tracking in MongoDB.")

    for idx, profile in enumerate(profiles, start=1):
        user_id_str = str(profile.get("userId"))
        print(f"\n[{idx}/{total_count}] Processing User {user_id_str}")

        # Check existing CPI
        cpi = profile.get("cpi")
        if cpi is not None:
            cpi_val = float(cpi)
            print(f"   => Found existing DB CPI: {cpi_val}")
        else:
            resume_url = profile.get("resumeStorageKey")
            if resume_url and resume_url.startswith("http"):
                print(f"   => No CPI in DB. Scanning Resume: {resume_url}")
                text = extract_pdf_text_from_url(resume_url)
                cpi_val = extract_cpi_with_ai(text)
                print(f"   => AI Fallback Extracted CPI: {cpi_val}")
            else:
                cpi_val = 0.0
                print(f"   => No CPI in DB and no valid Resume URL. Defaulting CPI: 0.0")

        # Now we need to update Pinecone. 
        # Pinecone doesn't have an 'update_metadata_keys' method on the free tier directly,
        # we have to fetch the existing vector, mutate metadata, and upsert it back identically.
        print(f"   => Fetching existing vector from Pinecone for {user_id_str}...")
        existing_vector_data = pinecone_repo.fetch(user_id_str)
        
        if not existing_vector_data:
            print(f"   => WARNING: Vector {user_id_str} not found in Pinecone. Skipping.")
            continue
            
        vector_values = existing_vector_data.values
        metadata = existing_vector_data.metadata or {}
        
        # Append CPI, branch, year, skills
        metadata["cpi"] = cpi_val
        metadata["course"] = profile.get("course", "")
        metadata["branch"] = profile.get("branch", "")
        try:
            metadata["year"] = int(profile.get("year", 0)) if profile.get("year") else 0
        except ValueError:
            metadata["year"] = 0
            
        skills_raw = profile.get("skills", [])
        # Sometimes skills could be stored as a string or empty, let's coerce to list
        if isinstance(skills_raw, list):
            metadata["skills"] = [str(s) for s in skills_raw]
        else:
            metadata["skills"] = [str(skills_raw)] if skills_raw else []
        
        print(f"   => Upserting updated metadata to Pinecone...")
        pinecone_repo.upsert(user_id=user_id_str, vector=vector_values, metadata=metadata)
        success_count += 1
        print(f"   => ✅ Updated successfully!")

    print("=" * 60)
    print(f"MIGRATION COMPLETE. Successfully migrated {success_count} vectors.")
    print("=" * 60)

if __name__ == "__main__":
    main()
