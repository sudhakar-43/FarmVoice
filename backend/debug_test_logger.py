
import asyncio
import httpx
import time
import json
import sys

BASE_URL = "http://localhost:8000"
LOG_FILE = "backend/debug_output.txt"

def log(msg):
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg)

async def run_debug():
    # Clear log
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("Starting Debug Run\n")

    # Dynamic user
    suffix = int(time.time())
    user = {
        "phone_number": f"99{suffix}",
        "password": "testpassword123",
        "name": f"Debug User {suffix}"
    }

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=60.0) as client:
        # Auth
        log(f"Registering user {user['phone_number']}...")
        resp = await client.post("/api/auth/register", json=user)
        log(f"Register status: {resp.status_code}")
        
        token = None
        if resp.status_code in [200, 201]:
            token = resp.json()["access_token"]
        else:
            log(f"Register failed: {resp.text}")
            return

        headers = {"Authorization": f"Bearer {token}"}
        
        # Test 1: Weather
        log("\n--- TEST 1: Weather ---")
        query = {"message": "What is the weather in Delhi right now?"}
        log(f"Sending query: {query}")
        
        try:
            r = await client.post("/api/agent/chat", json=query, headers=headers)
            log(f"Status: {r.status_code}")
            try:
                data = r.json()
                log(f"Response: {json.dumps(data, indent=2)}")
                
                # Check for mock
                speech = data.get("speech", "")
                if "[MOCK]" in speech:
                    log("FAILURE: Mock data detected.")
                elif "weather" in speech.lower() or "temperature" in speech.lower() or "degree" in speech.lower():
                    log("SUCCESS: Weather data seems present.")
                else:
                    log("WARNING: Response might not contain weather data.")
            except:
                log(f"Raw text: {r.text}")
        except Exception as e:
            log(f"Exception: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_debug())
