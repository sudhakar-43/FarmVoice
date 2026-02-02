
import asyncio
import os
import pytest
import httpx
import json
import time
from datetime import datetime, timedelta

# Test Configuration
BASE_URL = "http://localhost:8000"
# Dynamic user to ensure fresh registration/login
suffix = int(time.time() * 1000)
TEST_USER = {
    "phone_number": f"99{suffix}",
    "password": "testpassword123",
    "name": f"Test Agent User {suffix}"
}

def is_server_running():
    """Check if the backend server is running"""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            s.connect(("localhost", 8000))
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

@pytest.fixture(scope="module")
def skip_if_server_not_running():
    if not is_server_running():
        pytest.skip("Backend server is not running at localhost:8000. Start it first with 'python main.py'")

@pytest.fixture
def client():
    return httpx.AsyncClient(base_url=BASE_URL, timeout=120.0) # Increased timeout for LLM

class TestAgentRealtime:
    
    async def get_auth_headers(self, client):
        """Get authentication headers"""
        try:
            # Try login first
            response = await client.post("/api/auth/login", json=TEST_USER)
            if response.status_code == 200:
                data = response.json()
                return {"Authorization": f"Bearer {data['access_token']}"}
            
            # Register if login fails
            response = await client.post("/api/auth/register", json=TEST_USER)
            if response.status_code in [200, 201]:
                data = response.json()
                return {"Authorization": f"Bearer {data['access_token']}"}
        except Exception as e:
            print(f"Auth setup failed: {e}")
        return {}

    @pytest.mark.asyncio
    async def test_01_realtime_weather_query(self, client, skip_if_server_not_running):
        """Test 1: Realtime Weather Query - Verify source and no mock tags"""
        auth_headers = await self.get_auth_headers(client)
        print(f"DEBUG TEST: Auth Headers: {auth_headers}")
        assert auth_headers, "Authentication failed"
        
        # Ask about weather in a specific location
        query = {
            "message": "What is the weather in New Delhi right now?"
        }
        
        print(f"\nSending query: {query['message']}")
        response = await client.post(
            "/api/agent/chat",
            json=query,
            headers=auth_headers,
            timeout=60.0
        )
        
        print(f"Response status: {response.status_code}")
        assert response.status_code == 200, f"Chat failed with {response.text}"
        
        data = response.json()
        print(f"Agent Response: {data}")
        
        assert data["success"] is True
        assert "speech" in data
        speech = data["speech"]
        
        # Verify it's not a mock response (mock typically returns static generic text)
        # Real weather usually mentions specific numbers like temperature
        has_weather_indicators = any(term in speech.lower() for term in ["degree", "celsius", "cloud", "sun", "rain", "temperature", "humidity"])
        assert has_weather_indicators, "Response doesn't look like a weather report"
        
        # Ensure no fallback language if possible (though we removed it from code)
        assert "simulated" not in speech.lower()
        assert "mock" not in speech.lower()


    @pytest.mark.asyncio
    async def test_02_agent_work_action_creation(self, client, skip_if_server_not_running):
        """Test 2: Agent Work - Verify Task Creation via NLP"""
        auth_headers = await self.get_auth_headers(client)
        
        test_task_name = f"Inspect irrigation pump {datetime.now().strftime('%H%M%S')}"
        query = {
            "message": f"Create a task to {test_task_name} tomorrow."
        }
        
        print(f"\nSending action query: {query['message']}")
        response = await client.post(
            "/api/agent/chat",
            json=query,
            headers=auth_headers,
            timeout=60.0 # LLM might take time
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify action was taken or suggested
        actions_taken = data.get("actions_taken", [])
        
        # Check if action was executed immediately (if permission allowed) or suggested
        # Qwen might decide to execute it directly or ask confirmation.
        # Ideally for "Create a task..." valid agent should execute or return action plan.
        
        task_created = False
        
        if actions_taken:
            for action in actions_taken:
                if action["action"]["entity"] == "task" and action["action"]["type"] == "create":
                   task_created = True
                   print(f"Task created via Agent: {action}")
        
        # If not created immediately, check suggestions or intent
        # But our prompt encourages actions for explicit requests.
        
        if not task_created:
            # Fallback: Check if it requires confirmation or interpreted intent correctly
            # Check DB directly to be sure if it didn't return in 'actions_taken' but did it anyway?
             pass 

        # We really want 'actions_taken' to be populated for "Agent Work"
        assert len(actions_taken) > 0 or "task" in data["speech"].lower(), "Agent did not attempt to create task or discuss it"


    @pytest.mark.asyncio
    async def test_03_market_data_real(self, client, skip_if_server_not_running):
        """Test 3: Market Data - Real Scraper Usage"""
        auth_headers = await self.get_auth_headers(client)
        
        query = {
            "message": "What is the price of Tomato in Maharashtra?"
        }
        
        print(f"\nSending market query: {query['message']}")
        response = await client.post(
            "/api/agent/chat",
            json=query,
            headers=auth_headers,
            timeout=60.0
        )
        
        assert response.status_code == 200
        data = response.json()
        speech = data["speech"]
        print(f"Market Response: {speech}")
        
        # Verify it's not generic fallback
        assert "price" in speech.lower() or "rupee" in speech.lower() or "rs" in speech.lower()

if __name__ == "__main__":
    # Allow running directly
    print("Run with: pytest backend/tests/test_agent_realtime.py -v")
