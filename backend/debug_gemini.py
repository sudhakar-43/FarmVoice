
import os
import sys
import traceback
from dotenv import load_dotenv

# Load env vars
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {bool(api_key)}")

if not api_key:
    print("ERROR: No API key found")
    sys.exit(1)

try:
    import google.generativeai as genai
    print("Successfully imported google.generativeai")
    
    genai.configure(api_key=api_key)
    
    print("Listing available models...")
    print("Listing available models...")
    with open("models.txt", "w", encoding="utf-8") as f:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(m.name)
                f.write(m.name + "\n")
            
    # Try with 'gemini-1.5-flash'
    target_model = 'gemini-2.5-flash'
    print(f"\nAttempting to use model: {target_model}")
    model = genai.GenerativeModel(target_model)
    print("Model initialized. Generating content...")
    
    response = model.generate_content("Hello, can you hear me?")
    print(f"Response: {response.text}")
    print("SUCCESS")

except ImportError:
    print("ERROR: google.generativeai module not found. Run: pip install google-generativeai")
except Exception as e:
    print(f"ERROR: Generation failed: {e}")
    traceback.print_exc()
