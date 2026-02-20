import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def data_access_token():
    # Try to register first (ignore if exists)
    register_url = f"{BASE_URL}/api/auth/register"
    reg_payload = {
        "phone_number": "1234567899",
        "password": "password123",
        "name": "Test User"
    }
    try:
        requests.post(register_url, json=reg_payload)
    except:
        pass

    # Login to get token
    login_url = f"{BASE_URL}/api/auth/login"
    payload = {
        "phone_number": "1234567899",
        "password": "password123"
    }
    try:
        resp = requests.post(login_url, json=payload)
        if resp.status_code == 200:
            return resp.json()["access_token"]
        else:
            print(f"Login failed: {resp.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_pincode_resolution(pincode):
    token = data_access_token()
    if not token:
        print("Skipping test due to login failure")
        return

    print(f"Testing pincode: {pincode}")
    url = f"{BASE_URL}/api/weather/current"
    params = {"pincode": pincode}
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, params=params, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            location = data.get("location", "Unknown")
            print(f"Resolved Location: {location}")
            print("Full Response subset:")
            print(json.dumps({k:v for k,v in data.items() if k in ['location', 'description', 'source']}, indent=2))
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    # Give server a moment to reload if needed
    time.sleep(1)
    test_pincode_resolution("631203")
