from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from main import app
import io

client = TestClient(app)


@patch("routers.embed.embedding_service")
def test_post_embed_success(mock_svc):
    mock_svc.process_resume = AsyncMock(return_value={
        "user_id": "user-1", "chunks": 3, "vector_dims": 3072
    })
    
    fake_pdf = io.BytesIO(b"%PDF-1.4 fake content")
    response = client.post("/embed", data={
        "user_id": "user-1",
        "branch": "CSE",
        "year": 3,
        "skills": '["Python"]'
    }, files={"file": ("resume.pdf", fake_pdf, "application/pdf")})
    
    assert response.status_code == 200
    assert response.json()["status"] == "indexed"


@patch("routers.embed.embedding_service")
def test_post_embed_rejects_non_pdf(mock_svc):
    fake_txt = io.BytesIO(b"not a pdf")
    response = client.post("/embed", data={
        "user_id": "user-1"
    }, files={"file": ("resume.txt", fake_txt, "text/plain")})
    
    assert response.status_code == 400


@patch("routers.embed.embedding_service")
def test_delete_embed_success(mock_svc):
    mock_svc.delete_from_vector_db = AsyncMock()
    
    response = client.delete("/embed/user-1")
    assert response.status_code == 200
    assert response.json() == {"status": "deleted", "user_id": "user-1"}
