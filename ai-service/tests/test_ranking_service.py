from unittest.mock import MagicMock, patch, AsyncMock


@patch("services.ranking_service.PineconeRepository")
@patch("services.ranking_service.GoogleGenerativeAIEmbeddings")
def test_search_returns_sorted_results(mock_embedder, mock_repo):
    mock_embedder.return_value.embed_query.return_value = [0.1] * 3072
    mock_repo.return_value.search.return_value = [
        {"user_id": "user-1", "score": 0.9, "metadata": {"skills": ["Python"]}},
        {"user_id": "user-2", "score": 0.5, "metadata": {"skills": ["Java"]}},
        {"user_id": "user-3", "score": 0.2, "metadata": {}},  # below 0.4 threshold
    ]

    from services.ranking_service import RankingService
    import asyncio
    svc = RankingService()
    results = asyncio.run(svc.search("Python developer", top_k=5))

    assert len(results) == 2                       
    assert results[0]["user_id"] == "user-1"       
    assert results[0]["score"] >= results[1]["score"]


@patch("services.ranking_service.PineconeRepository")
@patch("services.ranking_service.GoogleGenerativeAIEmbeddings")
def test_search_filters_low_scores(mock_embedder, mock_repo):
    mock_embedder.return_value.embed_query.return_value = [0.1] * 3072
    mock_repo.return_value.search.return_value = [
        {"user_id": "user-x", "score": 0.3, "metadata": {}},
    ]

    from services.ranking_service import RankingService
    import asyncio
    svc = RankingService()
    results = asyncio.run(svc.search("query"))
    assert results == []  # all below threshold
