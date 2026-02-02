import requests
import json

BASE_URL = "http://localhost:8000"

def register_user(phone, password, name):
    url = f"{BASE_URL}/api/auth/register"
    payload = {
        "phone_number": phone,
        "password": password,
        "name": name
    }
    try:
        response = requests.post(url, json=payload)
        return response
    except Exception as e:
        print(f"Error registering: {e}")
        return None

def login_user(identifier, password):
    url = f"{BASE_URL}/api/auth/login"
    payload = {
        "phone_number": identifier,
        "password": password
    }
    try:
        response = requests.post(url, json=payload)
        return response
    except Exception as e:
        print(f"Error logging in: {e}")
        return None

def test_login_variations():
    print("--- Starting Login Variations Test ---")
    
    phone = "9988770000"
    name = "CaseTestUser"
    password = "password123"
    
    # 1. Register a user
    print(f"\n1. Registering user: {name} / {phone}")
    reg_res = register_user(phone, password, name)
    if reg_res.status_code == 200:
        print("   Registration Successful")
    elif reg_res.status_code == 400 and "already registered" in reg_res.text:
        print("   User already exists, proceeding to login test")
    else:
        print(f"   Registration Failed: {reg_res.text}")

    # 2. Login with Exact Name
    print(f"\n2. Testing Login with Exact Name: {name}")
    exact_res = login_user(name, password)
    if exact_res.status_code == 200:
        print("   [PASS] Exact Name Login Successful")
    else:
        print(f"   [FAIL] Exact Name Login Failed: {exact_res.text}")

    # 3. Login with Lowercase Name
    print(f"\n3. Testing Login with Lowercase Name: {name.lower()}")
    lower_res = login_user(name.lower(), password)
    if lower_res.status_code == 200:
        print("   [PASS] Lowercase Name Login Successful")
    else:
        print(f"   [FAIL] Lowercase Name Login Failed (Expected if case-sensitive): {lower_res.text}")

    # 4. Login with Uppercase Name
    print(f"\n4. Testing Login with Uppercase Name: {name.upper()}")
    upper_res = login_user(name.upper(), password)
    if upper_res.status_code == 200:
        print("   [PASS] Uppercase Name Login Successful")
    else:
        print(f"   [FAIL] Uppercase Name Login Failed (Expected if case-sensitive): {upper_res.text}")

if __name__ == "__main__":
    test_login_variations()
