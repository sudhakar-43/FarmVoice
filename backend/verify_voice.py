import urllib.request
import json
import time
import os
from jose import jwt

SECRET = "farmvoice-secret-key-12345"
ALGORITHM = "HS256"

# Create a dummy token for a fake user
token = jwt.encode({"sub": "9876543210"}, SECRET, algorithm=ALGORITHM)

url = "http://127.0.0.1:8000/api/voice/chat"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}


questions = [
    "Hello",
    "Which location am I from?",
    "Recommend crops for my location",
    "What season is it now?",
    "Hi FarmVoice!",
    "Can you tell me about my soil type?",
    "What crops grow best here?",
    "Good morning!",
    "What is the weather like right now?",
    "Suggest something for my farm"
]


print("-" * 60)
print(f"Running Voice Assistant Test ({len(questions)} questions)")
print("-" * 60)

for i, q in enumerate(questions, 1):
    data = {
        "text": q,
        "lang": "en",
        "context": {}
    }
    
    print(f"\n[{i}/{len(questions)}] Q: {q}")
    start = time.time()
    
    try:
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers)
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            elapsed = time.time() - start
            speech = result.get("speech", "NO SPEECH")
            print(f"   A: {speech}")
            print(f"   (Time: {elapsed:.2f}s)")
            
            # Save to results file
            with open("verification_results.txt", "a", encoding="utf-8") as f:
                f.write(f"Q: {q}\n")
                f.write(f"A: {speech}\n")
                f.write("-" * 30 + "\n")
                
    except Exception as e:
        elapsed = time.time() - start
        print(f"   ERROR: {e} (Time: {elapsed:.2f}s)")
        with open("verification_results.txt", "a", encoding="utf-8") as f:
            f.write(f"Q: {q}\n")
            f.write(f"ERROR: {e}\n")
            f.write("-" * 30 + "\n")

print("\n" + "-" * 60)
print("Test Complete")
print("-" * 60)
