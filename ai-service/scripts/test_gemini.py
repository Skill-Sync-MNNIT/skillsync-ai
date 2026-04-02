"""
2.0.7 – Test Gemini connection:
  call gemini-embedding-001 with a sample string and print vector shape.

  Note: text-embedding-004 was an old SDK alias. The new google-genai SDK
  uses gemini-embedding-001, which lives on v1beta (the default endpoint).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from google import genai
from config import settings

client = genai.Client(api_key=settings.gemini_api_key)

sample = "Python developer with experience in FastAPI and machine learning"

result = client.models.embed_content(
    model=settings.embedding_model,  # "gemini-embedding-001"
    contents=sample,
)

vector = result.embeddings[0].values
print(f"✅ Gemini embedding OK")
print(f"   Model  : {settings.embedding_model}")
print(f"   Input  : \"{sample}\"")
print(f"   Dims   : {len(vector)}")
print(f"   First 5: {list(vector[:5])}")

