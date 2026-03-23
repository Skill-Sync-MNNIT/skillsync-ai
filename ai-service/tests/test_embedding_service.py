from unittest.mock import MagicMock, patch, AsyncMock

def test_extract_text_returns_string():
    from services.embedding_service import EmbeddingService
    with patch("services.embedding_service.PineconeRepository"), \
         patch("services.embedding_service.GoogleGenerativeAIEmbeddings"):
        svc = EmbeddingService()
        # Create a minimal valid in-memory PDF using fitz
        import fitz
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 100), "Python developer skilled in FastAPI")
        pdf_bytes = doc.tobytes()
        result = svc.extract_text(pdf_bytes)
        assert "Python" in result

def test_chunk_text_splits_correctly():
    from services.embedding_service import EmbeddingService
    with patch("services.embedding_service.PineconeRepository"), \
         patch("services.embedding_service.GoogleGenerativeAIEmbeddings"):
        svc = EmbeddingService()
        chunks = svc.chunk_text("word " * 300)
        assert len(chunks) > 1

def test_mean_pool_correct_shape():
    from services.embedding_service import EmbeddingService
    with patch("services.embedding_service.PineconeRepository"), \
         patch("services.embedding_service.GoogleGenerativeAIEmbeddings"):
        svc = EmbeddingService()
        vectors = [[1.0, 2.0, 3.0], [3.0, 4.0, 5.0]]
        result = svc.mean_pool(vectors)
        assert result == [2.0, 3.0, 4.0]
        assert len(result) == 3
