import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_register():
    url = f"{BASE_URL}/api/auth/register"
    headers = {"Content-Type": "application/json"}
    payload = {
        "email": "testuser_repro_1@example.com",
        "password": "password123",
        "name": "Test User Repro"
    }

    try:
        print(f"Sending POST request to {url}...")
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        try:
            print("Response JSON:", response.json())
        except:
            print("Response Text:", response.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_register()
