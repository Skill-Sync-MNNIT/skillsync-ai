"""
Pinecone connection test – run once to verify setup, then delete.
Usage: python test_pinecone.py
"""

import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pinecone import Pinecone
from config import settings

def test_pinecone_connection():
    pc = Pinecone(api_key=settings.pinecone_api_key)

    # 1. List indexes
    indexes = pc.list_indexes()
    index_names = [idx.name for idx in indexes]
    print(f"📋 Available indexes: {index_names}")

    # 2. Confirm our index exists
    assert settings.pinecone_index in index_names, (
        f"❌ Index '{settings.pinecone_index}' not found! "
        "Create it on pinecone.io (dim=3072, metric=cosine)"
    )

    # 3. Connect to index and check stats
    index = pc.Index(settings.pinecone_index)
    stats = index.describe_index_stats()
    print(f"✅ Pinecone index OK")
    print(f"   Index : {settings.pinecone_index}")
    print(f"   Dims  : {stats.dimension}")
    print(f"   Vectors stored: {stats.total_vector_count}")

    # 4. Upsert a dummy vector and query it back
    dummy_vector = [0.01] * 3072
    index.upsert(vectors=[{"id": "test-user-001", "values": dummy_vector, "metadata": {"branch": "CSE", "year": 3}}])
    print("   ✅ Dummy upsert OK")

    time.sleep(5) 

    result = index.query(vector=dummy_vector, top_k=1, include_metadata=True)
    assert result["matches"][0]["id"] == "test-user-001"
    print("   ✅ Dummy query OK – retrieved correct vector")

    # 5. Clean up dummy vector
    index.delete(ids=["test-user-001"])
    print("   ✅ Cleanup done")
    print("\n🎉 Pinecone fully working and ready for SkillSync!")


if __name__ == "__main__":
    test_pinecone_connection()
