"""Run from ai-service/: python scripts/test_pinecone_repo.py"""
import sys
import os
import time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.pinecone_repo import PineconeRepository

repo = PineconeRepository()
dummy = [0.001] * 3072

# Test upsert
repo.upsert("test-123", dummy, {"branch": "CSE", "year": 3, "is_active": True, "skills": ["Python"]})
print("✅ upsert OK")


time.sleep(5)  

# Test search
results = repo.search(dummy, top_k=1)
assert results[0]["user_id"] == "test-123"
print(f"✅ search OK – score: {results[0]['score']:.4f}")

# Test fetch
fetched = repo.fetch("test-123")
assert fetched is not None
print("✅ fetch OK")

# Test delete
repo.delete("test-123")
print("✅ delete OK")

print("\n🎉 PineconeRepository all methods working!")
