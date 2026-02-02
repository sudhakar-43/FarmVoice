
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from voice_service.planner import voice_planner

def test_cache_key_generation():
    print("Testing _generate_voice_cache_key with None values...")
    try:
        # Simulate context with None lat/lon
        context = {
            "user_id": "test_user",
            "lat": None,
            "lon": None,
            "active_crop": "Rice"
        }
        key = voice_planner._generate_voice_cache_key(context, "test_intent")
        print(f"SUCCESS: Generated key: {key}")
    except Exception as e:
        print(f"FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_cache_key_generation()
