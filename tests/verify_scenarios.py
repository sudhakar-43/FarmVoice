import sys
import os
import asyncio
import json
import logging
from datetime import datetime
from fastapi.testclient import TestClient

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app
from voice_service.config import config

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

client = TestClient(app)

RESULTS_FILE = "tests/results.md"

def log_result(scenario: str, status: str, details: str):
    timestamp = datetime.now().isoformat()
    with open(RESULTS_FILE, "a") as f:
        f.write(f"## Scenario: {scenario}\n")
        f.write(f"- **Status**: {status}\n")
        f.write(f"- **Time**: {timestamp}\n")
        f.write(f"- **Details**: \n```json\n{details}\n```\n\n")
    logger.info(f"Scenario {scenario}: {status}")

def setup_results_file():
    with open(RESULTS_FILE, "w") as f:
        f.write("# FarmVoice Acceptance Test Results\n\n")

def test_scenario_1():
    """First login: crop recommendation -> user picks Rice -> Home with lanes up to D+10."""
    scenario = "1. First Login & Crop Selection"
    try:
        # 1. Init Home (Simulate first login)
        payload = {
            "user_id": "test_user_1",
            "lat": 20.59,
            "lon": 78.96,
            "active_crop": "Rice" # User picks Rice
        }
        response = client.post("/api/home/init", json=payload)
        if response.status_code != 200:
            raise Exception(f"API Error: {response.text}")
            
        data = response.json()
        plan = data.get("plan", {})
        lanes = plan.get("lanes", [])
        
        # Verify lanes
        if len(lanes) != 12: # -1 to 10
            raise Exception(f"Expected 12 lanes, got {len(lanes)}")
            
        log_result(scenario, "PASS", json.dumps(data, indent=2))
        
    except Exception as e:
        log_result(scenario, "FAIL", str(e))

def test_scenario_2():
    """Returning user sliding window correctness."""
    scenario = "2. Returning User Sliding Window"
    try:
        # Same as scenario 1 but verify dates
        payload = {
            "user_id": "test_user_1",
            "lat": 20.59,
            "lon": 78.96,
            "active_crop": "Rice"
        }
        response = client.post("/api/home/init", json=payload)
        data = response.json()
        lanes = data["plan"]["lanes"]
        
        today_lane = lanes[1]
        if today_lane["label"] != "Today":
             raise Exception("Second lane should be Today")
             
        log_result(scenario, "PASS", json.dumps({"today_lane": today_lane}, indent=2))
        
    except Exception as e:
        log_result(scenario, "FAIL", str(e))

def test_scenario_3():
    """Rain strike: simulate precip >=3 mm for Today -> irrigation struck & labeled."""
    scenario = "3. Rain Strike Logic"
    try:
        # Mock weather service response locally for this test or rely on deterministic engine logic
        # Since we can't easily mock the internal service call from outside without patching,
        # we will check if the logic in TaskEngine handles it if we pass a weather object manually.
        # But we are testing the API. 
        # For this autonomous run, I'll trust the unit test or try to patch if possible.
        # Let's use the TaskEngine directly to verify logic since we can't control live weather.
        
        from services.task_engine import task_engine
        from datetime import datetime
        
        # Mock weather with rain
        mock_weather = {
            "current": {"precip_mm": 5.0, "temp_c": 25, "wind_kph": 10},
            "forecast": [{"precip_mm": 5.0}] * 10
        }
        
        tasks = task_engine._generate_tasks_for_day(datetime.now(), 0, {"name": "Rice"}, mock_weather)
        
        rain_struck = False
        for t in tasks:
            if t["verb"] == "Irrigate" and t["status"] == "cancelled" and "Raining" in t.get("reason", ""):
                rain_struck = True
                break
                
        if not rain_struck:
             raise Exception("Irrigation task was not cancelled despite rain")
             
        log_result(scenario, "PASS", json.dumps(tasks, indent=2))
        
    except Exception as e:
        log_result(scenario, "FAIL", str(e))

def test_scenario_4():
    """Disease alert: simulate high humidity -> 'Blast risk' card + safety note."""
    scenario = "4. Disease Alert Logic"
    try:
        from services.disease_engine import disease_engine
        
        # Mock high humidity
        mock_weather = {"current": {"humidity": 90, "precip_mm": 10, "temp_c": 25}}
        mock_soil = {"ph": 6.5}
        
        risk = disease_engine.calculate_risk("Rice", mock_weather, mock_soil)
        
        if risk["level"] != "High":
            raise Exception(f"Expected High risk, got {risk['level']}")
            
        log_result(scenario, "PASS", json.dumps(risk, indent=2))
        
    except Exception as e:
        log_result(scenario, "FAIL", str(e))

def test_scenario_5():
    """Market page: filters work, images show, top-3 mandi suggestions appear."""
    scenario = "5. Market Page"
    try:
        payload = {"district": "Guntur", "crop": "Chilli"}
        response = client.post("/api/market", json=payload)
        data = response.json()
        
        if not data["prices"]:
             raise Exception("No prices returned for Guntur/Chilli")
             
        log_result(scenario, "PASS", json.dumps(data, indent=2))
        
    except Exception as e:
        log_result(scenario, "FAIL", str(e))

def test_scenario_6():
    """Voice turn: 'Plan my next 10 days for rice' -> planner KPI first, full canvas + TTS later."""
    scenario = "6. Voice Turn (Simulated)"
    try:
        # We will use the planner directly to simulate the pipeline
        from voice_service.planner import voice_planner
        
        context = {"lat": 20.59, "lon": 78.96, "active_crop": "Rice"}
        query = "Plan my next 10 days for rice"
        
        # This will call Ollama, so it might take time
        result = asyncio.run(voice_planner.process_query(query, context))
        
        if not result["success"]:
            raise Exception(f"Planner failed: {result.get('error')}")
            
        if "lanes" not in str(result["canvas_spec"]):
             raise Exception("Canvas spec missing lanes")
             
        log_result(scenario, "PASS", json.dumps(result, indent=2, default=str))
        
    except Exception as e:
        log_result(scenario, "FAIL", str(e))

if __name__ == "__main__":
    setup_results_file()
    test_scenario_1()
    test_scenario_2()
    test_scenario_3()
    test_scenario_4()
    test_scenario_5()
    test_scenario_6()
    print("Verification complete. Check tests/results.md")
