import requests
import json

def test_pincode(pincode):
    url = f"https://api.postalpincode.in/pincode/{pincode}"
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_pincode("631203")
