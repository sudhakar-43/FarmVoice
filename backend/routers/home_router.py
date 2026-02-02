from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

from services.task_engine import task_engine
from services.weather_service import weather_service
# Need to import get_current_user dependency helper or move it to a shared place
# For now, will import from main via a slightly hacky way or assume it's passed
# Better pattern: standard dependencies in a separate file.
# To avoid circular import with main.py, we'll redefine a simple dependency here or trust that
# the router is included in an app that has the dependency validation.

# Actually, the proper way is to import the dependency function. 
# Since get_current_user is in main.py, we should extract it to dependencies.py or similar.
# For this immediate fix, we will assume authentication is handled by the parent app or duplicated logic.

# Let's import the user logic if possible, or simpler:
# We will cheat slightly and import `get_current_user` from `...main` if possible, 
# but that causes circular imports usually.
# A safe way is to move authentication to a `dependencies.py` file.
# Since I cannot refactor everything right now, I will use a placeholder that will need to be 
# swapped or I will duplicate the simple JWT decode logic here.

from jose import jwt
import os

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

def get_current_user_dep(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Simple JWT validation to get user identity.
    The token's 'sub' claim contains the phone_number.
    """
    try:
        from supabase import create_client, Client
        
        # Initialize single supabase client if not already done, or create new per request (low overhead)
        # Using environment variables loaded in main or here
        url: str = os.getenv("SUPABASE_URL")
        key: str = os.getenv("SUPABASE_KEY") # This should be the service key or anon key depending on usage
        
        supabase: Client = create_client(url, key)
        
        token = credentials.credentials
        # DEBUG LOGGING
        print(f"DEBUG AUTH (home_router): Received token: {token[:20]}...") 
        
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        phone_number: str = payload.get("sub")  # Token contains phone_number, not email
        
        print(f"DEBUG AUTH (home_router): Decoded phone_number: {phone_number}")
        
        if phone_number is None:
             print("DEBUG AUTH (home_router): phone_number is None")
             raise HTTPException(status_code=401, detail="Invalid credentials")
             
        # Fetch user from public.users table by phone_number
        # Based on main.py, the token's "sub" is the user's phone_number
        
        response = supabase.table("users").select("*").eq("phone_number", phone_number).execute()
        if not response.data:
            # Fallback or error
            print(f"DEBUG AUTH (home_router): User not found for phone: {phone_number}")
            raise HTTPException(status_code=401, detail="User not found")
            
        user = response.data[0]
        print(f"DEBUG AUTH (home_router): User found: {user.get('id')}")
        return user
        
    except Exception as e:
        print(f"DEBUG AUTH ERROR (home_router): {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=401, detail="Invalid credentials")

from services.soil_service import soil_service
from services.chi_service import chi_service
import crop_recommender

router = APIRouter()


@router.get("/api/chi-data")
async def get_chi_data(
    current_user: dict = Depends(get_current_user_dep)
):
    """
    Get Crop Health Index (CHI) and Daily Task Score (DTS) data.
    
    Returns:
        - dts: Daily Task Score (0-100, resets daily)
        - chi: Crop Health Index (0-100, persistent)
        - growth_status: Derived from CHI (Stunted/Moderate/Healthy/Optimal/Evaluating)
        - risk_level: Derived from missed tasks, disease, weather (Low/Medium/High/Unknown)
        - is_new_user: True if account < 24 hours old
        - grace_period_ends_at: ISO timestamp when grace period ends
    """
    from supabase import create_client, Client
    from datetime import date, datetime
    
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        supabase: Client = create_client(url, key)
        
        user_id = current_user["id"]
        today = date.today().isoformat()
        
        # Get user created_at for grace period detection
        created_at_str = current_user.get("created_at")
        created_at = None
        if created_at_str:
            try:
                # Parse ISO format timestamp
                created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                created_at = None
        
        # Get today's tasks
        response = supabase.table("daily_tasks").select("*").eq(
            "user_id", user_id
        ).eq("scheduled_date", today).execute()
        
        tasks = response.data or []
        total_tasks = len(tasks) if tasks else 10
        completed_tasks = len([t for t in tasks if t.get("completed", False)])
        
        # Get current CHI (default to 50 for new users)
        current_chi = current_user.get("current_chi", 50.0)
        previous_chi = current_user.get("previous_chi")  # May be None
        
        # Calculate DTS
        dts_data = chi_service.get_dts_data(user_id, completed_tasks, total_tasks)
        
        # Get comprehensive CHI data (now with created_at for grace period)
        chi_data = chi_service.get_chi_data(
            user_id=user_id,
            completed_tasks=completed_tasks,
            total_tasks=total_tasks,
            current_chi=current_chi,
            previous_chi=previous_chi,
            disease_risk="low",  # Would come from disease-risk-forecast API
            weather_stress=False,  # Would come from weather API
            created_at=created_at  # For new user detection
        )
        
        return {
            "dts": {
                "date": dts_data.date,
                "completed_tasks": dts_data.completed_tasks,
                "total_tasks": dts_data.total_tasks,
                "score": dts_data.dts_score,
                "impact_label": "+10 Daily Task Score"
            },
            "chi": {
                "score": chi_data.chi_score,
                "trend": chi_data.trend,
                "trend_delta": chi_data.trend_delta,
                "growth_status": chi_data.growth_status,
                "risk_level": chi_data.risk_level,
                "explanation": chi_data.explanation,
                "is_new_user": chi_data.is_new_user,
                "grace_period_ends_at": chi_data.grace_period_ends_at
            }
        }
        
    except Exception as e:
        import traceback
        print(f"Error in get_chi_data: {e}")
        print(traceback.format_exc())
        
        # Return safe defaults (assume new user for safety)
        return {
            "dts": {
                "date": date.today().isoformat(),
                "completed_tasks": 0,
                "total_tasks": 10,
                "score": 0,
                "impact_label": "+10 Daily Task Score"
            },
            "chi": {
                "score": 50.0,
                "trend": "hidden",
                "trend_delta": 0.0,
                "growth_status": "Evaluating",
                "risk_level": "Unknown",
                "explanation": "Baseline value. Health tracking begins after initial activity.",
                "is_new_user": True,
                "grace_period_ends_at": None
            }
        }

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
            # Implement crop suitability logic here if crop is null
            recommendations = []
            try:
                # Prepare location data for recommender
                location_data = {
                    "soil_type": soil.get("soil_type", "Loamy"),
                    "climate": "Tropical", # defaulting, could be derived from lat/lon or weather
                    "weather": weather,
                    "display_name": request.pincode or "Your Location"
                }
                recommendations = crop_recommender.recommend_crops(location_data, limit=5)
            except Exception as rec_err:
                print(f"Error getting recommendations: {rec_err}")
            
            return {
                "status": "setup_required",
                "weather": weather,
                "soil": soil,
                "recommendations": recommendations,
                "message": "Please select a crop to generate your plan. Here are some recommendations based on your location."
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
                "health": {"score": 0, "status": "Not Started", "growth": "N/A", "risks": "N/A"}
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

# @router.get("/api/tasks")
# async def get_tasks(
#     tab: str = "today",
#     current_user: dict = Depends(get_current_user_dep)
# ):
#     """
#     Get tasks for a specific tab (yesterday, today, tomorrow).
#     """
#     from services.task_repository import task_repo
#     
#     user_id = current_user["id"]
#     all_tasks = task_repo.get_tasks_by_user(user_id)
#     
#     # Calculate target date based on tab
#     today = datetime.now()
#     if tab == "yesterday":
#         target_date = (today - timedelta(days=1)).strftime("%Y-%m-%d")
#     elif tab == "tomorrow":
#         target_date = (today + timedelta(days=1)).strftime("%Y-%m-%d")
#     else:
#         target_date = today.strftime("%Y-%m-%d")
#         
#     # Filter tasks
#     filtered_tasks = []
#     
#     for task in all_tasks:
#         # Check if task is due on target date OR if it's overdue (for 'today' or 'yesterday')
#         # Simple logic: exact date match for now
#         
#         # Parse task due date
#         # task['due_date'] is string YYYY-MM-DD
#         
#         if task['due_date'] == target_date:
#             filtered_tasks.append({
#                 "id": task['id'], # UUID string
#                 "task": task['task_name'],
#                 "date": task['due_date'],
#                 "status": task['status'],
#                 "priority": task['priority'].lower(),
#                 "source": "smart-weather" if task['task_type'] in ['Irrigation', 'Weather'] else "manual"
#             })
#             
#     return filtered_tasks
