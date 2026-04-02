from unittest.mock import patch, AsyncMock
import pytest


@patch("services.moderation_service.ChatGoogleGenerativeAI")
def test_moderate_passes_clean_job(mock_llm):
    from services.moderation_service import ModerationService
    from unittest.mock import MagicMock, AsyncMock
    svc = ModerationService()
    svc.chain = MagicMock()
    svc.chain.ainvoke = AsyncMock(return_value='{"passed": true, "violation_type": null, "confidence": 0.95}')
    
    import asyncio
    result = asyncio.run(svc.moderate("Software Engineer", "Looking for a Python developer"))
    assert result["passed"] is True
    assert result["violation_type"] is None


@patch("services.moderation_service.ChatGoogleGenerativeAI")
def test_moderate_fails_spam(mock_llm):
    from services.moderation_service import ModerationService
    from unittest.mock import MagicMock, AsyncMock
    svc = ModerationService()
    svc.chain = MagicMock()
    svc.chain.ainvoke = AsyncMock(return_value='{"passed": false, "violation_type": "spam", "confidence": 0.88}')
    
    import asyncio
    result = asyncio.run(svc.moderate("FREE MONEY!!!", "Click here to earn fast"))
    assert result["passed"] is False
    assert result["violation_type"] == "spam"
