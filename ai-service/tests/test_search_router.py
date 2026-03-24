from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


@patch("routers.search.ranking_service")
@patch("routers.search.explanation_engine")
def test_search_returns_results(mock_explain, mock_rank):
    mock_rank.search = AsyncMock(return_value=[{
        "user_id": "user-1",
        "score": 0.85,
        "metadata": {"skills": ["Python"], "branch": "CSE", "year": 3}
    }])
    mock_explain.explain = AsyncMock(return_value="Strong Python match.")

    response = client.post("/search", json={"query": "Python developer", "top_k": 5})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["user_id"] == "user-1"
    assert data[0]["score"] == 0.85
    assert data[0]["explanation"] == "Strong Python match."


@patch("routers.search.ranking_service")
@patch("routers.search.explanation_engine")
def test_search_returns_empty_list(mock_explain, mock_rank):
    mock_rank.search = AsyncMock(return_value=[])
    response = client.post("/search", json={"query": "no match query"})
    assert response.status_code == 200
    assert response.json() == []
