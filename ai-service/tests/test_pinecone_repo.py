"""Pytest unit tests for PineconeRepository – mocks Pinecone client."""
from unittest.mock import MagicMock, patch


@patch("services.pinecone_repo.Pinecone")
def test_upsert_calls_index(mock_pinecone):
    mock_index = MagicMock()
    mock_pinecone.return_value.Index.return_value = mock_index

    from services.pinecone_repo import PineconeRepository
    repo = PineconeRepository()
    repo.upsert("user-1", [0.1] * 3072, {"branch": "CSE", "year": 3, "is_active": True, "skills": []})

    mock_index.upsert.assert_called_once()


@patch("services.pinecone_repo.Pinecone")
def test_delete_calls_index(mock_pinecone):
    mock_index = MagicMock()
    mock_pinecone.return_value.Index.return_value = mock_index

    from services.pinecone_repo import PineconeRepository
    repo = PineconeRepository()
    repo.delete("user-1")

    mock_index.delete.assert_called_once_with(ids=["user-1"])


@patch("services.pinecone_repo.Pinecone")
def test_search_applies_active_filter(mock_pinecone):
    mock_index = MagicMock()
    mock_index.query.return_value = {"matches": []}
    mock_pinecone.return_value.Index.return_value = mock_index

    from services.pinecone_repo import PineconeRepository
    repo = PineconeRepository()
    repo.search([0.1] * 3072, top_k=5)

    call_kwargs = mock_index.query.call_args.kwargs
    assert call_kwargs["filter"]["is_active"] == {"$eq": True}
