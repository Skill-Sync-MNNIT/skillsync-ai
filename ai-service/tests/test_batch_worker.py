from unittest.mock import patch, AsyncMock, MagicMock
import asyncio


@patch("services.embedding_service.PineconeRepository")
@patch("services.embedding_service.GoogleGenerativeAIEmbeddings")
def test_process_user_success(mock_embed, mock_repo):
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'workers'))

    with patch("requests.get") as mock_get, \
         patch("requests.patch") as mock_patch, \
         patch("cloudinary.utils.private_download_url", return_value="http://fake-url/resume.pdf"):

        # Mock PDF download
        mock_get.return_value.content = b"%PDF-1.4 fake"
        mock_get.return_value.raise_for_status = MagicMock()

        with patch("batch_embed.svc") as mock_svc:
            mock_svc.process_resume = AsyncMock(return_value={"chunks": 3, "vector_dims": 3072})

            import batch_embed
            user = {
                "userId": "user-abc",
                "resumeStorage": "resumes/resume_user-abc_123.pdf",
                "branch": "CSE", "year": 2, "skills": ["Python"]
            }
            result = asyncio.run(batch_embed.process_user(user))
            assert result is True
            mock_patch.assert_called()   # update_status was called


@patch("requests.get")
def test_get_pending_users(mock_get):
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'workers'))

    mock_get.return_value.json.return_value = {
        "data": [{"userId": "u1", "resumeStorage": "key1", "branch": "CSE", "year": 2, "skills": []}]
    }
    mock_get.return_value.raise_for_status = MagicMock()

    import batch_embed
    users = batch_embed.get_pending_users()
    assert len(users) == 1
    assert users[0]["userId"] == "u1"
