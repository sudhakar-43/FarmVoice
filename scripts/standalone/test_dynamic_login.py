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
    # The backend expects "phone_number" field even if it's a name
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

def test_dynamic_login():
    print("--- Starting Dynamic Login Test ---")
    
    phone = "9988776655"
    name = "TestFarmer"
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
        # Proceeding anyway as user might exist
        
    # 2. Login with Phone
    print(f"\n2. Testing Login with PHONE: {phone}")
    phone_res = login_user(phone, password)
    if phone_res.status_code == 200:
        print("   [PASS] Phone Login Successful")
        print(f"   Token: {phone_res.json()['access_token'][:20]}...")
    else:
        print(f"   [FAIL] Phone Login Failed: {phone_res.text}")

    # 3. Login with Name
    print(f"\n3. Testing Login with NAME: {name}")
    name_res = login_user(name, password)
    if name_res.status_code == 200:
        print("   [PASS] Name Login Successful")
        print(f"   Token: {name_res.json()['access_token'][:20]}...")
    else:
        print(f"   [FAIL] Name Login Failed: {name_res.text}")

    # 4. Login with Invalid Name
    print(f"\n4. Testing Login with INVALID Name")
    invalid_res = login_user("NonExistentUser", password)
    if invalid_res.status_code == 401:
        print("   [PASS] Invalid Name Login correctly rejected")
    else:
        print(f"   [FAIL] Expected 401, got {invalid_res.status_code}: {invalid_res.text}")

if __name__ == "__main__":
    test_dynamic_login()
