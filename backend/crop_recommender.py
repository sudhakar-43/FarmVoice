"""
Crop Recommendation Engine for FarmVoice
Provides dynamic crop recommendations based on real-time location data including:
- Soil type and fertility (from SoilGrids)
- Current weather conditions (from Open-Meteo)
- Climate zone
- Market prices (from data.gov.in)
- Agricultural season
"""

from typing import List, Dict, Any, Optional
import hashlib
from datetime import datetime, timedelta
# Import llm_service for centralized AI access
from voice_service.llm_service import llm_service

# Simple in-memory cache for Ollama responses
_ollama_cache = {}

# Comprehensive crop database with growing requirements
CROP_DATABASE = {
    # Cereals
    "Rice": {
        "category": "cereal",
        "soil_preference": ["loamy", "clay", "alluvial"],
        "climate": ["tropical", "subtropical"],
        "temp_range": (20, 35),
        "rainfall_mm": (1000, 2000),
        "seasons": ["kharif", "monsoon"],
        "growth_days": (120, 150),
        "water_requirement": "high",
        "ph_range": (5.5, 7.0),
        "states": ["Andhra Pradesh", "Telangana", "West Bengal", "Punjab", "Tamil Nadu"]
    },
    "Wheat": {
        "category": "cereal",
        "soil_preference": ["loamy", "alluvial", "clay loam"],
        "climate": ["temperate", "subtropical"],
        "temp_range": (10, 25),
        "rainfall_mm": (250, 750),
        "seasons": ["rabi", "winter"],
        "growth_days": (100, 140),
        "water_requirement": "medium",
        "ph_range": (6.0, 7.5),
        "states": ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan"]
    },
    "Maize": {
        "category": "cereal",
        "soil_preference": ["loamy", "alluvial", "red"],
        "climate": ["tropical", "subtropical", "temperate"],
        "temp_range": (18, 32),
        "rainfall_mm": (500, 1000),
        "seasons": ["kharif", "rabi"],
        "growth_days": (90, 120),
        "water_requirement": "medium",
        "ph_range": (5.5, 7.5),
        "states": ["Karnataka", "Andhra Pradesh", "Maharashtra", "Bihar", "Rajasthan"]
    },
    "Millet": {
        "category": "cereal",
        "soil_preference": ["sandy", "red", "loamy"],
        "climate": ["arid", "tropical", "subtropical"],
        "temp_range": (25, 35),
        "rainfall_mm": (250, 600),
        "seasons": ["kharif", "summer"],
        "growth_days": (60, 90),
        "water_requirement": "low",
        "ph_range": (5.5, 7.5),
        "states": ["Rajasthan", "Gujarat", "Maharashtra", "Karnataka", "Andhra Pradesh"]
    },
    "Jowar": {
        "category": "cereal",
        "soil_preference": ["black", "red", "loamy"],
        "climate": ["tropical", "subtropical", "arid"],
        "temp_range": (25, 35),
        "rainfall_mm": (400, 800),
        "seasons": ["kharif", "rabi"],
        "growth_days": (100, 130),
        "water_requirement": "low",
        "ph_range": (5.5, 8.0),
        "states": ["Maharashtra", "Karnataka", "Madhya Pradesh", "Andhra Pradesh", "Telangana"]
    },
    # Cash Crops
    "Cotton": {
        "category": "cash_crop",
        "soil_preference": ["black", "clay", "loamy"],
        "climate": ["tropical", "subtropical"],
        "temp_range": (21, 35),
        "rainfall_mm": (500, 1000),
        "seasons": ["kharif"],
        "growth_days": (150, 180),
        "water_requirement": "medium",
        "ph_range": (5.5, 8.0),
        "states": ["Gujarat", "Maharashtra", "Andhra Pradesh", "Telangana", "Punjab"]
    },
    "Sugarcane": {
        "category": "cash_crop",
        "soil_preference": ["loamy", "alluvial", "clay"],
        "climate": ["tropical", "subtropical"],
        "temp_range": (20, 35),
        "rainfall_mm": (1500, 2500),
        "seasons": ["kharif", "rabi"],
        "growth_days": (300, 365),
        "water_requirement": "very_high",
        "ph_range": (6.0, 8.0),
        "states": ["Uttar Pradesh", "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat"]
    },
    "Groundnut": {
        "category": "oilseed",
        "soil_preference": ["sandy", "red", "loamy"],
        "climate": ["tropical", "subtropical"],
        "temp_range": (20, 30),
        "rainfall_mm": (500, 1000),
        "seasons": ["kharif", "rabi"],
        "growth_days": (100, 130),
        "water_requirement": "medium",
        "ph_range": (5.5, 7.0),
        "states": ["Gujarat", "Andhra Pradesh", "Tamil Nadu", "Karnataka", "Rajasthan"]
    },
    "Soybean": {
        "category": "oilseed",
        "soil_preference": ["loamy", "black", "alluvial"],
        "climate": ["subtropical", "tropical"],
        "temp_range": (20, 30),
        "rainfall_mm": (500, 900),
        "seasons": ["kharif"],
        "growth_days": (90, 120),
        "water_requirement": "medium",
        "ph_range": (6.0, 7.0),
        "states": ["Madhya Pradesh", "Maharashtra", "Rajasthan", "Karnataka", "Telangana"]
    },
    "Mustard": {
        "category": "oilseed",
        "soil_preference": ["loamy", "alluvial", "sandy loam"],
        "climate": ["temperate", "subtropical"],
        "temp_range": (10, 25),
        "rainfall_mm": (250, 500),
        "seasons": ["rabi", "winter"],
        "growth_days": (110, 140),
        "water_requirement": "low",
        "ph_range": (6.0, 8.0),
        "states": ["Rajasthan", "Uttar Pradesh", "Haryana", "Madhya Pradesh", "Gujarat"]
    },
    "Sunflower": {
        "category": "oilseed",
        "soil_preference": ["loamy", "black", "red"],
        "climate": ["subtropical", "tropical"],
        "temp_range": (20, 30),
        "rainfall_mm": (500, 700),
        "seasons": ["kharif", "rabi"],
        "growth_days": (80, 100),
        "water_requirement": "medium",
        "ph_range": (6.0, 7.5),
        "states": ["Karnataka", "Andhra Pradesh", "Maharashtra", "Bihar", "Orissa"]
    },
    # Pulses
    "Chickpea": {
        "category": "pulse",
        "soil_preference": ["loamy", "black", "alluvial"],
        "climate": ["subtropical", "temperate"],
        "temp_range": (15, 30),
        "rainfall_mm": (200, 600),
        "seasons": ["rabi", "winter"],
        "growth_days": (90, 120),
        "water_requirement": "low",
        "ph_range": (6.0, 8.0),
        "states": ["Madhya Pradesh", "Rajasthan", "Maharashtra", "Uttar Pradesh", "Karnataka"]
    },
    "Pigeon Pea": {
        "category": "pulse",
        "soil_preference": ["loamy", "red", "black"],
        "climate": ["tropical", "subtropical"],
        "temp_range": (18, 35),
        "rainfall_mm": (600, 1000),
        "seasons": ["kharif"],
        "growth_days": (120, 180),
        "water_requirement": "medium",
        "ph_range": (5.0, 7.5),
        "states": ["Maharashtra", "Karnataka", "Andhra Pradesh", "Uttar Pradesh", "Madhya Pradesh"]
    },
    "Black Gram": {
        "category": "pulse",
        "soil_preference": ["loamy", "black", "alluvial"],
        "climate": ["tropical", "subtropical"],
        "temp_range": (25, 35),
        "rainfall_mm": (600, 1000),
        "seasons": ["kharif", "summer"],
        "growth_days": (70, 90),
        "water_requirement": "medium",
        "ph_range": (6.0, 7.0),
        "states": ["Andhra Pradesh", "Uttar Pradesh", "Maharashtra", "Madhya Pradesh", "Tamil Nadu"]
    },
    "Green Gram": {
        "category": "pulse",
        "soil_preference": ["loamy", "sandy loam", "alluvial"],
        "climate": ["tropical", "subtropical"],
        "temp_range": (25, 35),
        "rainfall_mm": (500, 750),
        "seasons": ["kharif", "summer"],
        "growth_days": (60, 75),
        "water_requirement": "low",
        "ph_range": (6.0, 7.0),
        "states": ["Rajasthan", "Maharashtra", "Andhra Pradesh", "Karnataka", "Orissa"]
    },
    # Vegetables
    "Tomato": {
        "category": "vegetable",
        "soil_preference": ["loamy", "red", "alluvial"],
        "climate": ["subtropical", "tropical", "temperate"],
        "temp_range": (15, 30),
        "rainfall_mm": (400, 600),
        "seasons": ["rabi", "winter", "kharif"],
        "growth_days": (90, 120),
        "water_requirement": "medium",
        "ph_range": (6.0, 7.0),
        "states": ["Andhra Pradesh", "Karnataka", "Maharashtra", "Madhya Pradesh", "Bihar"]
    },
    "Onion": {
        "category": "vegetable",
        "soil_preference": ["loamy", "sandy loam", "alluvial"],
        "climate": ["subtropical", "temperate"],
        "temp_range": (13, 27),
        "rainfall_mm": (350, 550),
        "seasons": ["rabi", "kharif"],
        "growth_days": (120, 150),
        "water_requirement": "medium",
        "ph_range": (6.0, 7.5),
        "states": ["Maharashtra", "Karnataka", "Madhya Pradesh", "Bihar", "Andhra Pradesh"]
    },
    "Potato": {
        "category": "vegetable",
        "soil_preference": ["loamy", "sandy loam", "alluvial"],
        "climate": ["temperate", "subtropical"],
        "temp_range": (15, 25),
        "rainfall_mm": (300, 500),
        "seasons": ["rabi", "winter"],
        "growth_days": (75, 120),
        "water_requirement": "medium",
        "ph_range": (5.0, 6.5),
        "states": ["Uttar Pradesh", "West Bengal", "Punjab", "Bihar", "Gujarat"]
    },
    "Chili": {
        "category": "spice",
        "soil_preference": ["black", "loamy", "red"],
        "climate": ["tropical", "subtropical"],
        "temp_range": (20, 35),
        "rainfall_mm": (600, 1200),
        "seasons": ["kharif", "rabi"],
        "growth_days": (120, 150),
        "water_requirement": "medium",
        "ph_range": (6.0, 7.5),
        "states": ["Andhra Pradesh", "Telangana", "Karnataka", "Maharashtra", "West Bengal"]
    },
    "Turmeric": {
        "category": "spice",
        "soil_preference": ["loamy", "red", "alluvial"],
        "climate": ["tropical", "subtropical"],
        "temp_range": (20, 30),
        "rainfall_mm": (1500, 2250),
        "seasons": ["kharif"],
        "growth_days": (240, 300),
        "water_requirement": "high",
        "ph_range": (5.5, 7.5),
        "states": ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Maharashtra"]
    },
    "Ginger": {
        "category": "spice",
        "soil_preference": ["loamy", "sandy loam", "red"],
        "climate": ["tropical", "subtropical"],
        "temp_range": (20, 30),
        "rainfall_mm": (1500, 3000),
        "seasons": ["kharif"],
        "growth_days": (210, 270),
        "water_requirement": "high",
        "ph_range": (5.5, 6.5),
        "states": ["Kerala", "Karnataka", "Assam", "Meghalaya", "Arunachal Pradesh"]
    },
    "Castor": {
        "category": "oilseed",
        "soil_preference": ["sandy", "loamy", "red"],
        "climate": ["arid", "tropical", "subtropical"],
        "temp_range": (20, 35),
        "rainfall_mm": (300, 600),
        "seasons": ["kharif"],
        "growth_days": (140, 180),
        "water_requirement": "low",
        "ph_range": (5.0, 8.0),
        "states": ["Gujarat", "Andhra Pradesh", "Rajasthan", "Karnataka", "Tamil Nadu"]
    },
}


async def get_ai_guide(prompt: str, cache_key: str) -> Optional[str]:
    """
    Get AI-generated guide using the centralized LLM service.
    Supports both Gemini and Ollama via the service configuration.
    """
    # Check cache first (24 hour expiry)
    if cache_key in _ollama_cache:
        cached_data, timestamp = _ollama_cache[cache_key]
        if datetime.now() - timestamp < timedelta(hours=24):
            return cached_data
    
    try:
        # Use the query_answerer role which is configured for concise knowledge
        response = await llm_service.generate_response(
            role="query_answerer",
            context={"system_instruction": "You are an expert agricultural advisor. Provide concise, practical advice."},
            user_query=prompt
        )
        
        text = response.get("speech") or response.get("answer") or ""
        text = text.strip()
        
        if text:
            # Cache the response
            _ollama_cache[cache_key] = (text, datetime.now())
            return text
            
    except Exception as e:
        print(f"AI Guide Generation error: {e}")
    
    return None


def calculate_suitability_score(crop_name: str, location_data: Dict[str, Any], market_prices: List[Dict] = None) -> Dict[str, Any]:
    """
    Calculate dynamic suitability score based on real-time location data.
    
    Score breakdown:
    - Soil compatibility: 0-35 points
    - Climate suitability: 0-25 points
    - Temperature conditions: 0-20 points
    - Season appropriateness: 0-10 points
    - Market potential (if prices available): 0-10 points
    Total: 0-100 points
    
    Returns:
        Dict with score and breakdown
    """
    score = 0
    breakdown = {}
    
    # Get crop data from database
    crop_info = CROP_DATABASE.get(crop_name, {})
    if not crop_info:
        # Try case-insensitive match
        for name, info in CROP_DATABASE.items():
            if name.lower() == crop_name.lower():
                crop_info = info
                crop_name = name
                break
    
    # Extract location data
    soil_type = location_data.get("soil_type", "").lower()
    climate = location_data.get("climate", "").lower()
    weather = location_data.get("weather", {})
    state = location_data.get("state", "")
    
    # Current conditions
    current_temp = 25
    current_humidity = 60
    season = ""
    
    if isinstance(weather, dict):
        current_data = weather.get("current", {})
        current_temp = current_data.get("temperature", 25)
        current_humidity = current_data.get("humidity", 60)
        season = weather.get("season", "").lower()
    
    # 1. Soil Compatibility (0-35 points)
    soil_score = 0
    if crop_info:
        preferred_soils = crop_info.get("soil_preference", [])
        for i, pref_soil in enumerate(preferred_soils):
            if pref_soil in soil_type:
                # More points for being first preference
                soil_score = 35 - (i * 5)
                break
        if soil_score == 0 and soil_type:
            soil_score = 15  # Some points for having soil data
    else:
        soil_score = 20  # Default for unknown crops
    breakdown["soil"] = min(soil_score, 35)
    score += breakdown["soil"]
    
    # 2. Climate Suitability (0-25 points)
    climate_score = 0
    if crop_info:
        preferred_climates = crop_info.get("climate", [])
        for i, pref_climate in enumerate(preferred_climates):
            if pref_climate in climate:
                climate_score = 25 - (i * 5)
                break
        if climate_score == 0 and climate:
            climate_score = 12  # Some points for having climate data
    else:
        climate_score = 15  # Default
    breakdown["climate"] = min(climate_score, 25)
    score += breakdown["climate"]
    
    # 3. Temperature Conditions (0-20 points)
    temp_score = 0
    if crop_info:
        min_temp, max_temp = crop_info.get("temp_range", (15, 35))
        if min_temp <= current_temp <= max_temp:
            temp_score = 20
        elif abs(current_temp - min_temp) <= 5 or abs(current_temp - max_temp) <= 5:
            temp_score = 12
        else:
            temp_score = 5
    else:
        temp_score = 12  # Default
    breakdown["temperature"] = temp_score
    score += temp_score
    
    # 4. Season Appropriateness (0-10 points)
    season_score = 0
    if crop_info and season:
        preferred_seasons = crop_info.get("seasons", [])
        for pref_season in preferred_seasons:
            if pref_season in season:
                season_score = 10
                break
        if season_score == 0:
            season_score = 3  # Out of season
    else:
        season_score = 5  # Default
    breakdown["season"] = season_score
    score += season_score
    
    # 5. Market Potential (0-10 points) - Based on state compatibility and market prices
    market_score = 0
    if crop_info:
        preferred_states = crop_info.get("states", [])
        for pref_state in preferred_states:
            if pref_state.lower() in state.lower():
                market_score = 7
                break
        
        # Boost if crop appears in market prices (indicates active trading)
        if market_prices:
            for price in market_prices:
                if crop_name.lower() in price.get("commodity", "").lower():
                    market_score += 3
                    break
    else:
        market_score = 5  # Default
    breakdown["market"] = min(market_score, 10)
    score += breakdown["market"]
    
    return {
        "score": min(score, 100),
        "breakdown": breakdown,
        "crop_info": crop_info
    }


async def generate_farming_guide(crop_name: str, location_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a practical farming guide based on crop database and location.
    Tries AI for enhanced guide, falls back to database-based guide.
    """
    crop_info = CROP_DATABASE.get(crop_name, {})
    if not crop_info:
        for name, info in CROP_DATABASE.items():
            if name.lower() == crop_name.lower():
                crop_info = info
                break
    
    soil_type = location_data.get("soil_type", "loamy")
    climate = location_data.get("climate", "tropical")
    weather = location_data.get("weather", {})
    season = weather.get("season", "kharif") if isinstance(weather, dict) else "kharif"
    
    # Try AI for enhanced guide
    prompt = f"""Generate a concise farming guide for {crop_name} cultivation.
Location: Soil type is {soil_type}, Climate is {climate}, Season is {season}.

Provide:
1. Best planting time
2. Water requirements  
3. Fertilizer recommendations
4. Expected harvest period
5. Key success tip

Keep response under 150 words, be practical."""

    cache_key = hashlib.md5(f"{crop_name}_{soil_type}_{climate}_guide_v3".encode()).hexdigest()
    # Execute async call synchronously for compatibility if needed, or better, make this function async
    # For now, we'll return the base guide and let the caller handle AI enrichment if they can await,
    # BUT since this is called by sync functions in this file, we might need a workaround.
    # Actually, agent_tools.py calls this. Let's make generate_farming_guide async.
    
    # NOTE: Changing to async requires updating callers. 
    # For now, we will assume the caller will update to await this.
    ollama_response = await get_ai_guide(prompt, cache_key)
    
    # Build guide from crop database
    base_guide = {
        "crop_name": crop_name,
        "soil_type": soil_type,
        "climate": climate
    }
    
    if crop_info:
        growth_min, growth_max = crop_info.get("growth_days", (90, 120))
        seasons = crop_info.get("seasons", ["kharif"])
        water_req = crop_info.get("water_requirement", "medium")
        
        base_guide.update({
            "planting_season": f"Best during {', '.join(seasons)} season",
            "growth_duration": f"{growth_min}-{growth_max} days",
            "water_requirements": f"{water_req.title()} - {'Regular irrigation' if water_req in ['high', 'very_high'] else 'Moderate watering'}",
            "fertilizer_schedule": "Apply NPK fertilizer at planting and flowering stages. Top dress with nitrogen at tillering.",
            "harvest_period": f"Approximately {growth_max} days after planting",
            "soil_ph": f"Optimal pH: {crop_info.get('ph_range', (6.0, 7.5))[0]} - {crop_info.get('ph_range', (6.0, 7.5))[1]}",
            "category": crop_info.get("category", "general")
        })
    else:
        base_guide.update({
            "planting_season": f"Best during {season} season",
            "growth_duration": "90-120 days (varies by variety)",
            "water_requirements": "Regular irrigation based on soil moisture",
            "fertilizer_schedule": "Apply balanced NPK fertilizer as per soil test recommendations",
            "harvest_period": "Depends on variety and conditions",
            "category": "general"
        })
    
    # Add AI-enhanced content if available
    if ollama_response:
        base_guide["ai_tips"] = ollama_response
    else:
        base_guide["tips"] = f"Suitable for {soil_type} soil in {climate} climate. Monitor weather conditions regularly."
    
    return base_guide


def generate_disease_predictions(crop_name: str, location_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate disease predictions based on climate and weather conditions.
    Uses Ollama if available, falls back to comprehensive database.
    """
    climate = location_data.get("climate", "tropical")
    weather = location_data.get("weather", {})
    humidity = weather.get("current", {}).get("humidity", 70) if isinstance(weather, dict) else 70
    temp = weather.get("current", {}).get("temperature", 25) if isinstance(weather, dict) else 25
    
    # Disease database organized by condition and crop
    disease_db = {
        "Rice": [
            {"name": "Blast Disease", "symptoms": "Spindle-shaped spots with gray centers on leaves", "prevention": "Use resistant varieties, avoid excess nitrogen", "conditions": "humidity > 80"},
            {"name": "Bacterial Leaf Blight", "symptoms": "Yellow-white streaks on leaves", "prevention": "Balanced fertilization, proper drainage", "conditions": "humidity > 75"},
            {"name": "Sheath Blight", "symptoms": "Green-gray spots on sheath", "prevention": "Avoid dense planting, apply fungicides", "conditions": "temp > 25"}
        ],
        "Wheat": [
            {"name": "Rust (Yellow/Brown)", "symptoms": "Pustules on leaves", "prevention": "Grow resistant varieties like HD 2967", "conditions": "humidity > 70"},
            {"name": "Powdery Mildew", "symptoms": "White powdery coating", "prevention": "Early sowing, fungicide spray", "conditions": "temp < 25"}
        ],
        "Cotton": [
            {"name": "Leaf Curl Virus", "symptoms": "Upward curling and thickening of leaves", "prevention": "Control whitefly, use resistant hybrids", "conditions": "temp > 25"},
            {"name": "Fusarium Wilt", "symptoms": "Yellowing and wilting", "prevention": "Crop rotation, resistant varieties", "conditions": "temp > 28"}
        ],
        "Tomato": [
            {"name": "Early Blight", "symptoms": "Brown spots with concentric rings", "prevention": "Crop rotation, fungicide spray", "conditions": "humidity > 70"},
            {"name": "Late Blight", "symptoms": "Water-soaked lesions turning brown", "prevention": "Avoid overhead irrigation, use fungicides", "conditions": "humidity > 80"}
        ],
        "Chili": [
            {"name": "Leaf Curl Virus", "symptoms": "Curling and puckering of leaves", "prevention": "Control thrips/mites, remove infected plants", "conditions": "temp > 25"},
            {"name": "Anthracnose", "symptoms": "Dark sunken spots on fruits", "prevention": "Use certified seeds, spray Mancozeb", "conditions": "humidity > 80"}
        ]
    }
    
    # Get crop-specific diseases or use generic ones
    crop_diseases = disease_db.get(crop_name, [])
    
    if not crop_diseases:
        # Try case-insensitive match
        for name, diseases in disease_db.items():
            if name.lower() == crop_name.lower():
                crop_diseases = diseases
                break
    
    if not crop_diseases:
        # Generic diseases based on conditions
        if humidity > 80:
            crop_diseases = [
                {"name": "Fungal Leaf Spot", "symptoms": "Brown spots on leaves", "prevention": "Improve air circulation, avoid overhead watering"},
                {"name": "Root Rot", "symptoms": "Wilting despite adequate water", "prevention": "Ensure proper drainage"}
            ]
        else:
            crop_diseases = [
                {"name": "Aphid Infestation", "symptoms": "Curled leaves, sticky residue", "prevention": "Use neem oil spray regularly"},
                {"name": "Bacterial Wilt", "symptoms": "Sudden wilting", "prevention": "Use disease-free seeds, crop rotation"}
            ]
    
    # Filter diseases based on current conditions
    relevant_diseases = []
    for disease in crop_diseases:
        condition = disease.get("conditions", "")
        is_relevant = True
        
        if "humidity > 80" in condition and humidity <= 80:
            is_relevant = False
        elif "humidity > 75" in condition and humidity <= 75:
            is_relevant = False
        elif "humidity > 70" in condition and humidity <= 70:
            is_relevant = False
        elif "temp > 28" in condition and temp <= 28:
            is_relevant = False
        elif "temp > 25" in condition and temp <= 25:
            is_relevant = False
        elif "temp < 25" in condition and temp >= 25:
            is_relevant = False
        
        relevant_diseases.append({
            "name": disease["name"],
            "symptoms": disease["symptoms"],
            "prevention": disease["prevention"],
            "risk_level": "high" if is_relevant else "medium"
        })
    
    return relevant_diseases[:3]


def recommend_crops(
    location_data: Dict[str, Any], 
    supabase_client: Any = None, 
    limit: int = 10,
    market_prices: List[Dict] = None
) -> List[Dict[str, Any]]:
    """
    Recommend crops based on location data with dynamic suitability scores.
    
    Args:
        location_data: Dict containing soil_type, climate, weather, state, etc.
        supabase_client: Optional Supabase client for fetching crop metadata
        limit: Maximum number of recommendations to return
        market_prices: Optional list of current market prices for scoring
        
    Returns:
        List of crop recommendations sorted by suitability score
    """
    soil_type = location_data.get("soil_type", "").lower()
    climate = location_data.get("climate", "").lower()
    state = location_data.get("state", "")
    
    # Get all crops to evaluate
    all_crops = list(CROP_DATABASE.keys())
    
    # Also fetch from Supabase if available (for additional crops)
    crop_metadata = {}
    if supabase_client:
        try:
            response = supabase_client.table("crops").select("*").execute()
            if response.data:
                for row in response.data:
                    name = row.get("name")
                    if name and name not in CROP_DATABASE:
                        all_crops.append(name)
                    crop_metadata[name] = row
        except Exception as e:
            print(f"Error fetching crops from Supabase: {e}")
    
    recommendations = []
    
    for crop in all_crops:
        # Calculate comprehensive suitability score
        result = calculate_suitability_score(crop, location_data, market_prices)
        suitability = result["score"]
        breakdown = result["breakdown"]
        crop_info = result.get("crop_info", {})
        
        # Get metadata from Supabase if available
        meta = crop_metadata.get(crop, {})
        
        # Boost score if Supabase metadata matches location
        if meta:
            if soil_type in (meta.get("soil_type") or "").lower():
                suitability = min(100, suitability + 5)
            if climate in (meta.get("category") or "").lower():
                suitability = min(100, suitability + 3)
        
        # Only include crops with suitability > 35
        if suitability > 35:
            # Generate description
            if crop_info:
                seasons = crop_info.get("seasons", [])
                category = crop_info.get("category", "general")
                description = f"{category.replace('_', ' ').title()} crop ideal for {', '.join(seasons)} season in {climate} climate."
            else:
                description = meta.get("description") or f"Suitable for {climate} regions with {soil_type} soil."
            
            recommendations.append({
                "name": crop,
                "suitability": suitability,
                "description": description,
                "benefits": [
                    f"Soil match: {breakdown.get('soil', 0)}/35",
                    f"Climate fit: {breakdown.get('climate', 0)}/25",
                    f"Weather: {breakdown.get('temperature', 0)}/20",
                    f"Season: {breakdown.get('season', 0)}/10"
                ],
                "category": crop_info.get("category", meta.get("category", "general")),
                "growth_duration": f"{crop_info.get('growth_days', (90, 120))[0]}-{crop_info.get('growth_days', (90, 120))[1]} days" if crop_info else "90-120 days",
                "water_requirement": crop_info.get("water_requirement", "medium") if crop_info else "medium",
                "image_url": meta.get("image_url"),
                "scientific_name": meta.get("scientific_name")
            })
    
    # Sort by suitability score (highest first)
    recommendations.sort(key=lambda x: x["suitability"], reverse=True)
    
    return recommendations[:limit]


async def check_crop_suitability(
    crop_name: str, 
    location_data: Dict[str, Any], 
    supabase_client: Any = None
) -> Dict[str, Any]:
    """
    Check if a specific crop is suitable for the given location with detailed analysis.
    
    Returns comprehensive information including:
    - Suitability score and breakdown
    - Farming guide
    - Disease predictions
    - Crop details
    """
    # Calculate suitability
    result = calculate_suitability_score(crop_name, location_data)
    suitability_score = result["score"]
    breakdown = result["breakdown"]
    crop_info = result.get("crop_info", {})
    
    # Get metadata from Supabase if available
    meta = {}
    if supabase_client:
        try:
            res = supabase_client.table("crops").select("*").ilike("name", crop_name).execute()
            if res.data:
                meta = res.data[0]
        except Exception:
            pass
    
    # Generate farming guide and disease predictions
    farming_guide = await generate_farming_guide(crop_name, location_data)
    disease_predictions = generate_disease_predictions(crop_name, location_data)
    
    # Determine suitability level
    if suitability_score >= 75:
        suitability_text = "Highly Suitable"
        is_suitable = True
    elif suitability_score >= 50:
        suitability_text = "Moderately Suitable"
        is_suitable = True
    else:
        suitability_text = "Not Recommended"
        is_suitable = False
    
    return {
        "crop_name": crop_name,
        "is_suitable": is_suitable,
        "suitability_score": suitability_score,
        "suitability_text": suitability_text,
        "score_breakdown": breakdown,
        "reason": f"Score: {suitability_score}/100 - Soil: {breakdown.get('soil', 0)}/35, Climate: {breakdown.get('climate', 0)}/25, Temperature: {breakdown.get('temperature', 0)}/20, Season: {breakdown.get('season', 0)}/10, Market: {breakdown.get('market', 0)}/10",
        "farming_guide": farming_guide,
        "disease_predictions": disease_predictions,
        "details": {
            "name": crop_name,
            "suitability": suitability_score,
            "category": crop_info.get("category", meta.get("category", "general")),
            "description": meta.get("description") or f"{'Highly suitable' if is_suitable else 'Marginally suitable'} based on location analysis.",
            "benefits": [
                f"Suitability: {suitability_score}%",
                f"Category: {crop_info.get('category', 'agriculture').replace('_', ' ').title()}",
                f"Water: {crop_info.get('water_requirement', 'medium').title()}" if crop_info else "Water: Medium",
                "Data-driven recommendation"
            ],
            "growth_duration": f"{crop_info.get('growth_days', (90, 120))[0]}-{crop_info.get('growth_days', (90, 120))[1]} days" if crop_info else None,
            "image_url": meta.get("image_url"),
            "scientific_name": meta.get("scientific_name")
        }
    }
