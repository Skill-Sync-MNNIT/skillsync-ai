import sys
import os
import asyncio
import time
from langchain_google_genai import GoogleGenerativeAIEmbeddings


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.embedding_service import EmbeddingService
from services.pinecone_repo import PineconeRepository
from config import settings


svc = EmbeddingService()

PDF_PATH = os.path.join(os.path.dirname(__file__), "..", "tests", "data", "Vivek.pdf")

with open(PDF_PATH, "rb") as f:
    pdf_bytes = f.read()

text = svc.extract_text(pdf_bytes)
print(f'Extracted {len(text)} characters')

print("--- First 500 chars ---")
print(text[:500])                   # ← see if it looks right
print("--- Last 200 chars ---")
print(text[-200:])                  # ← check end too


# After chunk_text:
chunks = svc.chunk_text(text)
print(f"Split into {len(chunks)} chunks")
print("--- Chunk 0 preview ---")
print(chunks[0][:300])              # ← see what the first chunk looks like 

result = asyncio.run(svc.process_resume(
    user_id='test-embed-001',
    pdf_bytes=pdf_bytes,
    metadata={"branch":"MCA","year":2,"is_active":True,"skills":['Python']}
))

print(" Processed resume Result:", result)


time.sleep(5)

repo = PineconeRepository()
embedder = GoogleGenerativeAIEmbeddings(model=settings.embedding_model, google_api_key=settings.gemini_api_key)
query_vector = embedder.embed_query("Python developer MCA")
results = repo.search(query_vector, top_k=1)
print("Search result:", results)


asyncio.run(svc.delete_from_vector_db('test-embed-001'))
print("Deleted from vector db")