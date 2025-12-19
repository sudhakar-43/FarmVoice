from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any

from services.disease_engine import disease_engine
from services.weather_service import weather_service
from services.soil_service import soil_service
from voice_service.llm_service import llm_service

router = APIRouter()

class DiseaseRiskRequest(BaseModel):
    crop: str
    lat: float
    lon: float
    stage: Optional[str] = "vegetative"

@router.post("/api/disease/risk")
async def check_disease_risk(request: DiseaseRiskRequest):
    """
    Check disease risk.
    """
    # 1. Get Context Data
    weather = await weather_service.get_current_weather(request.lat, request.lon)
    soil = await soil_service.get_soil_data(request.lat, request.lon)
    
    # 2. Calculate Deterministic Risk
    risk_assessment = disease_engine.calculate_risk(request.crop, weather, soil)
    
    # 3. Get LLM Advice
    llm_response = await llm_service.generate_response("disease", {
        "risk": risk_assessment,
        "crop": request.crop,
        "weather": weather['current']
    })
    
    return {
        "risk_level": risk_assessment['level'],
        "risk_score": risk_assessment['score'],
        "factors": risk_assessment['factors'],
        "advice": llm_response.get('advice', risk_assessment['advice']),
        "speech": llm_response.get('speech', ""),
        "weather_summary": weather['current']
    }
