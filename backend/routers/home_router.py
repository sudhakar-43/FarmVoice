from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

from services.task_engine import task_engine
from services.weather_service import weather_service
from services.soil_service import soil_service

router = APIRouter()

class HomeInitRequest(BaseModel):
    user_id: str
    name: Optional[str] = None
    phone: Optional[str] = None
    pincode: Optional[str] = None
    state: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    active_crop: Optional[str] = None
    last_login_at: Optional[str] = None

class RescheduleRequest(BaseModel):
    task_id: str
    new_date: str
    reason: Optional[str] = None

@router.post("/api/home/init")
async def init_home(request: HomeInitRequest):
    """
    Initialize the Personalized Home.
    """
    try:
        # 1. Get Weather
        lat = request.lat or 20.59
        lon = request.lon or 78.96
        weather = await weather_service.get_current_weather(lat, lon)
        
        # 2. Get Soil (if needed for crop suitability)
        soil = await soil_service.get_soil_data(lat, lon, request.state) # Using state as district proxy if needed, or implement proper lookup
        
        # 3. Determine Active Crop or Recommend
        active_crop = request.active_crop
        crop_details = {"name": active_crop} if active_crop else {}
        
        if not active_crop:
            # TODO: Implement crop suitability logic here if crop is null
            # For now, return a "needs_setup" state or default recommendations
            return {
                "status": "setup_required",
                "weather": weather,
                "soil": soil,
                "message": "Please select a crop to generate your plan."
            }

        # 4. Generate Plan & Health
        dashboard_data = await task_engine.generate_plan(request.dict(), crop_details)
        
        return {
            "status": "ready",
            "user": request.dict(),
            "weather": weather,
            "active_crop": active_crop,
            "dashboard": dashboard_data
        }
    except Exception as e:
        import traceback
        print(f"Error in init_home: {str(e)}")
        print(traceback.format_exc())
        # Always return valid JSON even on error
        return {
            "status": "error",
            "message": f"Failed to initialize home: {str(e)}",
            "dashboard": {
                "tasks": [],
                "health": {"score": 85, "status": "Good", "growth": "Normal", "risks": "Low"}
            }
        }

@router.post("/api/tasks/{task_id}/complete")
async def complete_task(task_id: str):
    """
    Mark a task as completed.
    """
    from services.task_repository import task_repo
    success = task_repo.update_task_status(task_id, "completed")
    
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return {"status": "success", "task_id": task_id}

@router.post("/api/tasks/reschedule")
async def reschedule_task(request: RescheduleRequest):
    """
    Reschedule a task.
    """
    # In a real app, this would update the DB.
    # For now, we just acknowledge.
    return {
        "status": "success",
        "message": f"Task {request.task_id} rescheduled to {request.new_date}",
        "task_id": request.task_id,
        "new_date": request.new_date
    }
