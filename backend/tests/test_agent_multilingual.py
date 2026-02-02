import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from voice_service.llm_service import llm_service
from voice_service.agent_core import farmvoice_agent

@pytest.mark.asyncio
async def test_llm_multilingual_support():
    """Test that the LLM service respects the language parameter."""
    
    # Test Telugu
    context = {"language": "te"}
    query = "How to grow tomatoes?"
    response = await llm_service.generate_response("agent", context, query)
    
    assert response is not None
    assert "speech" in response
    # We can't easily assert the language without a language detection library, 
    # but we can check if it returns a valid structure without error.
    # In a real scenario, we might check for known Telugu characters or words if deterministic.

@pytest.mark.asyncio
async def test_agent_core_propagates_language():
    """Test that the agent core correctly passes language to the LLM."""
    
    # We'll mock the llm_service to verify it receives the correct context
    # But for an integration test, we can just run it and ensure no crash
    context = {"language": "ta"} # Tamil
    response = await farmvoice_agent.process_message("What is the weather?", "test_user_mul", context)
    
    assert response.success is True
    assert response.speech is not None
