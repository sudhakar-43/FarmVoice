
import asyncio
import sys
import os
import logging
from unittest.mock import MagicMock, AsyncMock

# Add backend to path
sys.path.append(os.path.join(os.getcwd()))
from dotenv import load_dotenv
load_dotenv()

from voice_service.config import config
from voice_service.llm_service import llm_service

async def test_gemini():
    # Suppress logs
    logging.getLogger().setLevel(logging.CRITICAL)
    
    # Configure genai logger
    os.environ["GRPC_VERBOSITY"] = "ERROR"
    os.environ["GLOG_minloglevel"] = "2"

    print(f"Provider: {config.llm_provider}")
    print(f"Key Present: {bool(config.gemini_api_key)}")
    
    if config.llm_provider != 'gemini':
         print("FAIL: Provider not set to gemini")
         return

    print("Sending test request to Gemini...")
    try:
        response = await llm_service.generate_response(
            role="agent", 
            context={"user_id": "test_gemini"}, 
            user_query="Hello, who are you? Answer in one word."
        )
        print(f"Response Intent: {response.get('intent')}")
        print(f"Response Speech: {response.get('speech')}")
        
        if response.get("speech"):
             print("PASS: Got speech response")
        else:
             print("FAIL: No speech")
             
    except Exception as e:
        print(f"FAIL: Exception: {e}")
        with open("error.txt", "w") as f:
            f.write(str(e))

if __name__ == "__main__":
    asyncio.run(test_gemini())
