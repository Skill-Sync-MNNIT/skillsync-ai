"""
Health check tests for the FastAPI AI service.
Run with: pytest tests/test_health.py -v
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check_status_200():
    response = client.get("/health")
    assert response.status_code == 200


def test_health_check_response_body():
    response = client.get("/health")
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "skillsync-ai"


def test_health_check_content_type():
    response = client.get("/health")
    assert "application/json" in response.headers["content-type"]
