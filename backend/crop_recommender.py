from typing import List, Dict, Any, Optional
import httpx
import json
import hashlib
from datetime import datetime, timedelta

# Simple in-memory cache for Ollama responses
_ollama_cache = {}

def get_ollama_response(prompt: str, cache_key: str, model: str = "llama3.1:latest") -> Optional[str]:
    """
    Get response from Ollama with caching for faster responses.
    Uses llama3.2:1b for speed (1-2 second responses).
    """
    # Check cache first (24 hour expiry)
    if cache_key in _ollama_cache:
        cached_data, timestamp = _ollama_cache[cache_key]
        if datetime.now() - timestamp < timedelta(hours=24):
            return cached_data
    
    try:
        # Call Ollama API
        response = httpx.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_predict": 300  # Limit response length for speed
                }
            },
            timeout=10.0  # 10 second timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            text = result.get("response", "").strip()
            
            # Cache the response
            _ollama_cache[cache_key] = (text, datetime.now())
            return text
    except Exception as e:
        print(f"Ollama error: {e}")
    
    return None

def calculate_suitability_score(crop_name: str, location_data: Dict[str, Any]) -> int:
    """
    Calculate dynamic suitability score based on location data.
    Score breakdown:
    - Soil compatibility: 0-40 points
    - Climate suitability: 0-30 points
    - Weather conditions: 0-20 points
    - Season appropriateness: 0-10 points
    Total: 0-100 points
    """
    score = 0
    
    soil_type = location_data.get("soil_type", "").lower()
    climate = location_data.get("climate", "").lower()
    weather = location_data.get("weather", {})
    current_temp = weather.get("current", {}).get("temperature", 25) if isinstance(weather, dict) else 25
    current_humidity = weather.get("current", {}).get("humidity", 60) if isinstance(weather, dict) else 60
    season = weather.get("season", "").lower() if isinstance(weather, dict) else ""
    
    crop_lower = crop_name.lower()
    
    # Soil compatibility (0-40 points)
    soil_scores = {
        "rice": {"loamy": 40, "clay": 38, "alluvial": 35, "black": 30},
        "wheat": {"loamy": 40, "alluvial": 38, "black": 35, "clay": 30},
        "cotton": {"black": 40, "clay": 35, "loamy": 30, "red": 25},
        "groundnut": {"red": 40, "sandy": 38, "loamy": 35, "alluvial": 30},
        "millet": {"sandy": 40, "red": 38, "loamy": 30, "black": 25},
        "tomato": {"loamy": 40, "red": 35, "alluvial": 35, "sandy": 30},
        "corn": {"loamy": 40, "alluvial": 38, "black": 35, "red": 30},
        "soybean": {"loamy": 40, "black": 38, "alluvial": 35, "red": 30},
        "sugarcane": {"loamy": 40, "alluvial": 38, "clay": 35, "black": 30},
        "chili": {"black": 40, "loamy": 35, "red": 35, "alluvial": 30}
    }
    
    if crop_lower in soil_scores:
        for soil_key, soil_score in soil_scores[crop_lower].items():
            if soil_key in soil_type:
                score += soil_score
                break
    else:
        score += 25  # Default soil score
    
    # Climate suitability (0-30 points)
    climate_scores = {
        "rice": {"tropical": 30, "subtropical": 28, "temperate": 20},
        "wheat": {"temperate": 30, "subtropical": 25, "tropical": 15},
        "cotton": {"tropical": 30, "subtropical": 28, "arid": 25},
        "groundnut": {"tropical": 30, "subtropical": 28, "arid": 25},
        "millet": {"arid": 30, "tropical": 28, "subtropical": 25},
        "tomato": {"subtropical": 30, "tropical": 28, "temperate": 25},
        "corn": {"tropical": 30, "subtropical": 28, "temperate": 25},
        "soybean": {"subtropical": 30, "tropical": 28, "temperate": 25},
        "sugarcane": {"tropical": 30, "subtropical": 28, "temperate": 15},
        "chili": {"tropical": 30, "subtropical": 28, "arid": 25}
    }
    
    if crop_lower in climate_scores:
        for climate_key, climate_score in climate_scores[crop_lower].items():
            if climate_key in climate:
                score += climate_score
                break
    else:
        score += 20  # Default climate score
    
    # Weather conditions (0-20 points)
    temp_scores = {
        "rice": (20, 35, 20),  # (min, max, points)
        "wheat": (10, 25, 20),
        "cotton": (21, 35, 20),
        "groundnut": (20, 30, 20),
        "millet": (25, 35, 20),
        "tomato": (15, 30, 20),
        "corn": (18, 32, 20),
        "soybean": (20, 30, 20),
        "sugarcane": (20, 35, 20),
        "chili": (20, 35, 20)
    }
    
    if crop_lower in temp_scores:
        min_temp, max_temp, max_points = temp_scores[crop_lower]
        if min_temp <= current_temp <= max_temp:
            score += max_points
        elif abs(current_temp - min_temp) <= 5 or abs(current_temp - max_temp) <= 5:
            score += max_points // 2
    else:
        score += 10  # Default weather score
    
    # Season appropriateness (0-10 points)
    season_scores = {
        "rice": {"kharif": 10, "rabi": 8, "summer": 5},
        "wheat": {"rabi": 10, "winter": 10, "kharif": 3},
        "cotton": {"kharif": 10, "summer": 5},
        "groundnut": {"kharif": 10, "rabi": 8, "summer": 8},
        "millet": {"kharif": 10, "summer": 8},
        "tomato": {"rabi": 10, "winter": 10, "kharif": 8, "summer": 6},
        "corn": {"kharif": 10, "rabi": 8, "summer": 6},
        "soybean": {"kharif": 10, "summer": 5},
        "sugarcane": {"kharif": 10, "rabi": 8},
        "chili": {"kharif": 10, "rabi": 8}
    }
    
    if crop_lower in season_scores and season:
        for season_key, season_score in season_scores[crop_lower].items():
            if season_key in season:
                score += season_score
                break
    else:
        score += 5  # Default season score
    
    return min(score, 100)  # Cap at 100

def generate_farming_guide_with_ollama(crop_name: str, location_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Generate farming guide using Ollama AI based on location-specific data.
    """
    soil_type = location_data.get("soil_type", "loamy")
    climate = location_data.get("climate", "tropical")
    season = location_data.get("weather", {}).get("season", "kharif") if isinstance(location_data.get("weather"), dict) else "kharif"
    location_name = location_data.get("display_name", "your location")
    
    prompt = f"""Generate a concise farming guide for {crop_name} cultivation in {location_name}.
Location details: Soil type is {soil_type}, Climate is {climate}, Current season is {season}.

Provide the following in a structured format:
1. Best planting time (month/season)
2. Water requirements (frequency and amount)
3. Fertilizer recommendations (type and timing)
4. Expected harvest period (duration in days/months)
5. One key tip for this specific location

Keep the response under 150 words and be practical."""

    cache_key = hashlib.md5(f"{crop_name}_{soil_type}_{climate}_guide".encode()).hexdigest()
    response = get_ollama_response(prompt, cache_key)
    
    if response:
        return {
            "planting_season": "Based on local conditions",
            "water_requirements": "As per AI recommendation",
            "fertilizer_schedule": "Location-specific",
            "harvest_period": "Varies by season",
            "special_care": response
        }
    
    # Fallback if Ollama fails
    return {
        "planting_season": f"Best during {season} season",
        "water_requirements": "Regular irrigation based on soil moisture",
        "fertilizer_schedule": "Apply NPK fertilizer at planting and flowering stages",
        "harvest_period": "90-120 days depending on variety",
        "special_care": f"Suitable for {soil_type} soil in {climate} climate. Monitor weather conditions regularly."
    }

def generate_disease_predictions_with_ollama(crop_name: str, location_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate disease predictions using Ollama based on climate and weather.
    """
    climate = location_data.get("climate", "tropical")
    weather = location_data.get("weather", {})
    humidity = weather.get("current", {}).get("humidity", 70) if isinstance(weather, dict) else 70
    temp = weather.get("current", {}).get("temperature", 25) if isinstance(weather, dict) else 25
    
    prompt = f"""List 3 common diseases for {crop_name} in {climate} climate with {humidity}% humidity and {temp}°C temperature.

For each disease provide:
- Disease name
- Key symptoms (one sentence)
- Prevention tip (one sentence)

Format as a simple list, one disease per line."""

    cache_key = hashlib.md5(f"{crop_name}_{climate}_{humidity}_diseases".encode()).hexdigest()
    response = get_ollama_response(prompt, cache_key)
    
    diseases = []
    
    if response:
        # Parse Ollama response
        lines = [line.strip() for line in response.split('\n') if line.strip()]
        current_disease = {}
        
        for line in lines[:9]:  # Limit to 9 lines (3 diseases x 3 fields)
            if any(keyword in line.lower() for keyword in ['disease:', 'name:', '1.', '2.', '3.']):
                if current_disease:
                    diseases.append(current_disease)
                current_disease = {"name": line.split(':', 1)[-1].strip() if ':' in line else line.strip('123. ')}
            elif 'symptom' in line.lower():
                current_disease["symptoms"] = line.split(':', 1)[-1].strip() if ':' in line else line
            elif 'prevent' in line.lower():
                current_disease["prevention"] = line.split(':', 1)[-1].strip() if ':' in line else line
        
        if current_disease:
            diseases.append(current_disease)
    
    # Fallback diseases based on climate
    if not diseases:
        if humidity > 80:
            diseases = [
                {"name": "Fungal Leaf Spot", "symptoms": "Brown spots on leaves", "prevention": "Improve air circulation and avoid overhead watering"},
                {"name": "Powdery Mildew", "symptoms": "White powdery coating on leaves", "prevention": "Apply sulfur-based fungicide preventively"},
                {"name": "Root Rot", "symptoms": "Wilting despite adequate water", "prevention": "Ensure proper drainage and avoid waterlogging"}
            ]
        else:
            diseases = [
                {"name": "Aphid Infestation", "symptoms": "Curled leaves and sticky residue", "prevention": "Use neem oil spray regularly"},
                {"name": "Bacterial Wilt", "symptoms": "Sudden wilting of plants", "prevention": "Use disease-free seeds and practice crop rotation"},
                {"name": "Leaf Curl", "symptoms": "Leaves curling and yellowing", "prevention": "Control whitefly population and remove infected plants"}
            ]
    
    return diseases[:3]  # Return max 3 diseases

def recommend_crops(location_data: Dict[str, Any], limit: int = 10) -> List[Dict[str, Any]]:
    """
    Recommend crops based on location data with dynamic suitability scores.
    """
    # Define crop pool based on soil and climate
    soil_type = location_data.get("soil_type", "").lower()
    climate = location_data.get("climate", "").lower()
    
    # Comprehensive crop list
    all_crops = [
        "Rice", "Wheat", "Cotton", "Groundnut", "Millet", 
        "Tomato", "Corn", "Soybean", "Sugarcane", "Chili",
        "Potato", "Onion", "Chickpea", "Mustard", "Sunflower"
    ]
    
    recommendations = []
    
    for crop in all_crops:
        suitability = calculate_suitability_score(crop, location_data)
        
        # Only include crops with suitability > 40
        if suitability > 40:
            recommendations.append({
                "name": crop,
                "suitability": suitability,
                "description": f"Suitability score based on {soil_type} soil and {climate} climate.",
                "benefits": [f"Suited for {climate} regions", "Good market demand", "Proven variety", "Local adaptation"]
            })
    
    # Sort by suitability score (highest first)
    recommendations.sort(key=lambda x: x["suitability"], reverse=True)
    
    return recommendations[:limit]

def check_crop_suitability(crop_name: str, location_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Check if a specific crop is suitable for the given location with detailed analysis.
    """
    suitability_score = calculate_suitability_score(crop_name, location_data)
    
    # Generate farming guide and disease predictions
    farming_guide = generate_farming_guide_with_ollama(crop_name, location_data)
    disease_predictions = generate_disease_predictions_with_ollama(crop_name, location_data)
    
    return {
        "crop_name": crop_name,
        "is_suitable": suitability_score > 50,
        "suitability_score": suitability_score,
        "reason": f"Score: {suitability_score}/100 based on soil, climate, and weather analysis",
        "farming_guide": farming_guide,
        "disease_predictions": disease_predictions,
        "details": {
            "name": crop_name,
            "suitability": suitability_score,
            "description": f"Calculated based on location-specific factors",
            "benefits": [f"Suitability: {suitability_score}%", "Location-optimized", "Data-driven recommendation"]
        }
    }
