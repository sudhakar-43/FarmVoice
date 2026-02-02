
import asyncio
import httpx
import os
import sys

import random
import time

BASE_URL = "http://localhost:8000"
suffix = int(time.time())
TEST_USER = {
    "phone_number": f"99{suffix}",
    "password": "testpassword123",
    "name": f"Debug User {suffix}"
}

async def debug_auth():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        print("1. Attempting Login/Register...")
        
        # Try login
        response = await client.post("/api/auth/login", json=TEST_USER)
        print(f"   Login Status: {response.status_code}")
        
        token = None
        if response.status_code == 200:
            token = response.json()["access_token"]
            print("   Login Successful.")
        else:
            print(f"   Login Failed: {response.text}")
            # Try Register
            print("   Attempting Register...")
            response = await client.post("/api/auth/register", json=TEST_USER)
            print(f"   Register Status: {response.status_code}")
            if response.status_code in [200, 201]:
                token = response.json()["access_token"]
                print("   Register Successful.")
            else:
                print(f"   Register Failed: {response.text}")
                return

        if not token:
            print("❌ Failed to get token.")
            return

        headers = {"Authorization": f"Bearer {token}"}
        print(f"2. Auth Headers: {headers}")

        # Try hitting the Agent Chat endpoint
        print("3. Sending Request to /api/agent/chat ...")
        
        query = {
            "message": "What is the weather in Delhi?",
            "context": {}
        }
        
        try:
            response = await client.post("/api/agent/chat", json=query, headers=headers)
            print(f"4. Response Status: {response.status_code}")
            print(f"   Response Body: {response.text}")
        except Exception as e:
            print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(debug_auth())
