from fastapi.testclient import TestClient
from main import app, get_current_user
from unittest.mock import MagicMock

# Create a test client
client = TestClient(app)

# Mock user dependency
async def mock_get_current_user():
    return {
        "id": "test_user_id",
        "email": "test@example.com",
        "name": "Test Farmer"
    }

# Override the dependency
app.dependency_overrides[get_current_user] = mock_get_current_user

def test_weather_endpoint():
    print("Testing /api/weather/current...")
    response = client.get("/api/weather/current")
    
    if response.status_code == 200:
        print("✅ Success! Status Code: 200")
        data = response.json()
        print("Response Data:")
        print(data)
        
        # Verify fields
        expected_fields = ["temperature", "condition", "humidity", "wind_speed", "location", "high", "low"]
        missing = [f for f in expected_fields if f not in data]
        
        if not missing:
            print("✅ All expected fields present.")
        else:
            print(f"❌ Missing fields: {missing}")
    else:
        print(f"❌ Failed! Status Code: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_weather_endpoint()
