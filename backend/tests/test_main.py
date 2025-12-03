from fastapi.testclient import TestClient
from main import app, get_current_user
from unittest.mock import patch, AsyncMock

client = TestClient(app)

# Mock the current user dependency to bypass auth
async def mock_get_current_user():
    return {"id": "test_user_id", "email": "test@example.com", "name": "Test Farmer"}

app.dependency_overrides[get_current_user] = mock_get_current_user



@patch("web_scraper.scrape_plant_diseases", new_callable=AsyncMock)
def test_predict_disease(mock_scrape):
    mock_scrape.return_value = [
        {
            "name": "Test Disease",
            "symptoms": "Test Symptoms",
            "control": "Test Control",
            "image_url": "http://example.com/image.jpg"
        }
    ]
    
    # We need to override the dependency for this specific endpoint if it's not global
    # But main.py uses Depends(get_current_user) in the endpoint definition
    app.dependency_overrides["get_current_user"] = mock_get_current_user

    response = client.post(
        "/api/disease/predict",
        json={"crop_name": "Rice"},
        headers={"Authorization": "Bearer test_token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "diseases" in data
    assert len(data["diseases"]) == 1
    assert data["diseases"][0]["name"] == "Test Disease"

def test_voice_query_greeting():
    response = client.post(
        "/api/voice/query",
        json={"query": "Hello"},
        headers={"Authorization": "Bearer test_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "Hello" in data["response"]
    assert "suggestions" in data

def test_voice_query_market():
    response = client.post(
        "/api/voice/query",
        json={"query": "What is the market price?"},
        headers={"Authorization": "Bearer test_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "Market" in data["response"]
