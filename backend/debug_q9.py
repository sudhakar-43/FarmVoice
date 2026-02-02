import urllib.request
import json
import time
from jose import jwt

SECRET = "farmvoice-secret-key-12345"
ALGORITHM = "HS256"
token = jwt.encode({"sub": "9876543210"}, SECRET, algorithm=ALGORITHM)

data = {
    "text": "What is the best time to sow wheat?"
}

req = urllib.request.Request(
    "http://127.0.0.1:8000/api/voice/chat",
    data=json.dumps(data).encode('utf-8'),
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
)

print(f"Sending: '{data['text']}'...")
try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print("Success:", json.dumps(result, indent=2))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print("Raw output:", e.read().decode('utf-8'))
