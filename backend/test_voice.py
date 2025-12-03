import requests
import json

BASE_URL = "http://localhost:8000"

def login():
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testuser_v1@example.com", "password": "Test@123"},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"Login Failed: {response.text}")
            return None
    except Exception as e:
        print(f"Login Error: {e}")
        return None

def test_voice(token):
    try:
        response = requests.post(
            f"{BASE_URL}/api/voice/query",
            json={"query": "What is the price of tomato in Guntur?"},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
        )
        print(f"Voice Query Status: {response.status_code}")
        print(f"Voice Query Response: {response.json()}")
    except Exception as e:
        print(f"Voice Query Error: {e}")

if __name__ == "__main__":
    token = login()
    if token:
        print("Login Successful")
        test_voice(token)
    else:
        print("Skipping voice test due to login failure")
