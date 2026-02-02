"""
FarmVoice Agent Tools Registry
Comprehensive CRUD tools for all data entities
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import os
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY"

)

# Import existing services for reuse
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services.weather_service import weather_service
from services.market_service import market_service
from services.market_service import market_service
from services.task_engine import task_engine
from services.soil_service import soil_service
from services.soil_service import soil_service
import crop_recommender
import web_scraper


class AgentToolRegistry:
    """
    Registry of all CRUD tools the agent can use.
    Organized by entity type with full permissions.
    """
    
    def __init__(self):
        self.supabase: Optional[Client] = None
        if SUPABASE_URL and SUPABASE_KEY:
            self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Agent Tool Registry initialized")
    
    # ============================================================================
    # PROFILE TOOLS - User & Farmer Profile Management
    # ============================================================================
    
    async def read_profile(self, user_id: str, **kwargs) -> Dict[str, Any]:
        """Get user profile information"""
        try:
            result = self.supabase.table("farmer_profiles").select("*").eq("user_id", user_id).execute()
            if result.data:
                return {"success": True, "profile": result.data[0]}
            return {"success": False, "error": "Profile not found"}
        except Exception as e:
            logger.error(f"read_profile error: {e}")
            return {"success": False, "error": str(e)}
    
    async def update_profile(self, user_id: str, updates: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Update user profile"""
        try:
            updates["updated_at"] = datetime.now().isoformat()
            result = self.supabase.table("farmer_profiles").update(updates).eq("user_id", user_id).execute()
            return {"success": True, "profile": result.data[0] if result.data else None}
        except Exception as e:
            logger.error(f"update_profile error: {e}")
            return {"success": False, "error": str(e)}
    
    # ============================================================================
    # CROP TOOLS - Selected Crops Management
    # ============================================================================
    
    async def read_crop(self, user_id: str, crop_id: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Get selected crops for user"""
        try:
            query = self.supabase.table("selected_crops").select("*").eq("user_id", user_id)
            if crop_id:
                query = query.eq("id", crop_id)
            result = query.execute()
            return {"success": True, "crops": result.data}
        except Exception as e:
            logger.error(f"read_crop error: {e}")
            return {"success": False, "error": str(e)}
    
    async def create_crop(self, user_id: str, crop_name: str, **kwargs) -> Dict[str, Any]:
        """Add a new crop to user's farm"""
        try:
            crop_data = {
                "user_id": user_id,
                "crop_name": crop_name,
                "crop_variety": kwargs.get("crop_variety"),
                "planting_date": kwargs.get("planting_date"),
                "acres_allocated": kwargs.get("acres_allocated"),
                "suitability_score": kwargs.get("suitability_score"),
                "status": "active",
                "created_at": datetime.now().isoformat()
            }
            result = self.supabase.table("selected_crops").insert(crop_data).execute()
            return {"success": True, "crop": result.data[0] if result.data else None}
        except Exception as e:
            logger.error(f"create_crop error: {e}")
            return {"success": False, "error": str(e)}
    
    async def update_crop(self, user_id: str, crop_id: str, updates: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Update existing crop"""
        try:
            updates["updated_at"] = datetime.now().isoformat()
            result = self.supabase.table("selected_crops").update(updates).eq("id", crop_id).eq("user_id", user_id).execute()
            return {"success": True, "crop": result.data[0] if result.data else None}
        except Exception as e:
            logger.error(f"update_crop error: {e}")
            return {"success": False, "error": str(e)}
    
    async def delete_crop(self, user_id: str, crop_id: str, **kwargs) -> Dict[str, Any]:
        """Remove crop from user's farm"""
        try:
            result = self.supabase.table("selected_crops").delete().eq("id", crop_id).eq("user_id", user_id).execute()
            return {"success": True, "deleted": True}
        except Exception as e:
            logger.error(f"delete_crop error: {e}")
            return {"success": False, "error": str(e)}
    
    # ============================================================================
    # TASK TOOLS - Daily Tasks Management
    # ============================================================================
    
    async def read_task(self, user_id: str, task_id: Optional[str] = None, filter_date: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Get tasks for user"""
        try:
            query = self.supabase.table("daily_tasks").select("*").eq("user_id", user_id)
            if task_id:
                query = query.eq("id", task_id)
            if filter_date:
                query = query.eq("scheduled_date", filter_date)
            result = query.order("scheduled_date", desc=False).execute()
            return {"success": True, "tasks": result.data}
        except Exception as e:
            logger.error(f"read_task error: {e}")
            return {"success": False, "error": str(e)}
    
    async def create_task(self, user_id: str, task_name: str, scheduled_date: str, **kwargs) -> Dict[str, Any]:
        """Create a new task"""
        try:
            task_data = {
                "user_id": user_id,
                "task_name": task_name,
                "task_description": kwargs.get("task_description"),
                "task_type": kwargs.get("task_type", "general"),
                "scheduled_date": scheduled_date,
                "priority": kwargs.get("priority", "medium"),
                "crop_id": kwargs.get("crop_id"),
                "completed": False,
                "created_at": datetime.now().isoformat()
            }
            result = self.supabase.table("daily_tasks").insert(task_data).execute()
            return {"success": True, "task": result.data[0] if result.data else None}
        except Exception as e:
            logger.error(f"create_task error: {e}")
            return {"success": False, "error": str(e)}
    
    async def update_task(self, user_id: str, task_id: str, updates: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Update an existing task"""
        try:
            result = self.supabase.table("daily_tasks").update(updates).eq("id", task_id).eq("user_id", user_id).execute()
            return {"success": True, "task": result.data[0] if result.data else None}
        except Exception as e:
            logger.error(f"update_task error: {e}")
            return {"success": False, "error": str(e)}
    
    async def delete_task(self, user_id: str, task_id: str, **kwargs) -> Dict[str, Any]:
        """Delete a task"""
        try:
            result = self.supabase.table("daily_tasks").delete().eq("id", task_id).eq("user_id", user_id).execute()
            return {"success": True, "deleted": True}
        except Exception as e:
            logger.error(f"delete_task error: {e}")
            return {"success": False, "error": str(e)}
    
    # ============================================================================
    # NOTIFICATION TOOLS
    # ============================================================================
    
    async def read_notification(self, user_id: str, notification_id: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Get notifications for user"""
        try:
            query = self.supabase.table("notifications").select("*").eq("user_id", user_id)
            if notification_id:
                query = query.eq("id", notification_id)
            result = query.order("created_at", desc=True).limit(50).execute()
            return {"success": True, "notifications": result.data}
        except Exception as e:
            logger.error(f"read_notification error: {e}")
            return {"success": False, "error": str(e)}
    
    async def create_notification(self, user_id: str, title: str, message: str, **kwargs) -> Dict[str, Any]:
        """Create a new notification"""
        try:
            notif_data = {
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": kwargs.get("type", "info"),
                "priority": kwargs.get("priority", "medium"),
                "read": False,
                "created_at": datetime.now().isoformat()
            }
            result = self.supabase.table("notifications").insert(notif_data).execute()
            return {"success": True, "notification": result.data[0] if result.data else None}
        except Exception as e:
            logger.error(f"create_notification error: {e}")
            return {"success": False, "error": str(e)}
    
    async def update_notification(self, user_id: str, notification_id: str, updates: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Update notification (e.g., mark as read)"""
        try:
            result = self.supabase.table("notifications").update(updates).eq("id", notification_id).eq("user_id", user_id).execute()
            return {"success": True, "notification": result.data[0] if result.data else None}
        except Exception as e:
            logger.error(f"update_notification error: {e}")
            return {"success": False, "error": str(e)}
    
    async def delete_notification(self, user_id: str, notification_id: str, **kwargs) -> Dict[str, Any]:
        """Delete a notification"""
        try:
            result = self.supabase.table("notifications").delete().eq("id", notification_id).eq("user_id", user_id).execute()
            return {"success": True, "deleted": True}
        except Exception as e:
            logger.error(f"delete_notification error: {e}")
            return {"success": False, "error": str(e)}
    
    # ============================================================================
    # WEATHER TOOLS (Read-only - External API)
    # ============================================================================
    
    async def read_weather(self, lat: float = None, lon: float = None, location: str = None, city: str = None, **kwargs) -> Dict[str, Any]:
        """
        Get current weather. 
        Can provide lat/lon directly OR location/city name.
        """
        try:
            # Handle location/city parameter
            target_location = location or city
            if target_location and (lat is None or lon is None):
                # Try web_scraper first for better resolution including soil/weather context
                resolved = await web_scraper.get_location_from_name(target_location)
                if resolved:
                    lat = resolved.get("latitude")
                    lon = resolved.get("longitude")
                else:
                    # Fallback to weather_service simple lookup
                    lat, lon = await weather_service.get_coordinates(target_location)
            
            # Default to India center if still missing
            if lat is None or lon is None:
                lat, lon = 20.59, 78.96
                
            weather = await weather_service.get_current_weather(lat, lon)
            return {"success": True, "weather": weather}
        except Exception as e:
            logger.error(f"read_weather error: {e}")
            return {"success": False, "error": str(e)}
    
    # ============================================================================
    # MARKET TOOLS (Read-only - External API)
    # ============================================================================
    
    async def read_market(self, state: Optional[str] = None, district: Optional[str] = None, crop: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Get market prices"""
        try:
            prices = await market_service.get_prices(state=state, district=district, crop=crop)
            return {"success": True, "prices": prices}
        except Exception as e:
            logger.error(f"read_market error: {e}")
            return {"success": False, "error": str(e)}
    
    # ============================================================================
    # DISEASE TOOLS
    # ============================================================================
    
    async def diagnose_disease(self, **kwargs) -> Dict[str, Any]:
        """
        Diagnose crop disease based on symptoms.
        """
        try:
            crop = kwargs.get("crop", None)
            symptoms = kwargs.get("symptoms", "")
            
            # Use Supabase "crop_diseases" table if available
            try:
                query = self.supabase.table("crop_diseases").select("*")
                
                # Filter by crop if provided
                if crop and crop.lower() != "unknown":
                    query = query.ilike("crop", f"%{crop}%")
                
                # If symptoms provided, simple search (in future use embeddings)
                if symptoms:
                    # Basic keyword matching or let the agent filter the list
                    pass

                result = query.limit(5).execute()
                
                if result.data:
                    return {
                        "success": True, 
                        "diagnosis": {
                            "possible_diseases": result.data,
                            "note": "These are common diseases for your crop."
                        }
                    }
            except Exception as db_err:
                logger.warning(f"Database disease lookup failed: {db_err}")
                
            # Fallback to simple rule-based if DB fails or returns empty
            symptoms_lower = symptoms.lower()
            diagnosis = None
            
            if any(word in symptoms_lower for word in ["brown", "spot", "blight", "leaf"]):
                diagnosis = {
                    "name": "Leaf Blight",
                    "severity": "Moderate",
                    "description": "Fungal disease affecting leaves.",
                    "treatment": ["Remove affected leaves", "Apply fungicide"]
                }
            elif any(word in symptoms_lower for word in ["white", "powdery", "mildew"]):
                diagnosis = {
                    "name": "Powdery Mildew",
                    "severity": "Low",
                    "description": "White powdery growth on leaves.",
                    "treatment": ["Apply sulfur fungicide", "Reduce humidity"]
                }
            else:
                 diagnosis = {
                    "name": "General Stress",
                    "severity": "Low",
                    "description": "Symptoms suggest general plant stress. Please consult an expert.",
                    "treatment": ["Check water/nutrition"]
                }
                
            return {"success": True, "diagnosis": diagnosis}
        except Exception as e:
            logger.error(f"diagnose_disease error: {e}")
            return {"success": False, "error": str(e)}

    # ============================================================================
    # CROP HEALTH TOOLS
    # ============================================================================
    
    async def read_health(self, user_id: str, crop_id: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Get crop health records"""
        try:
            query = self.supabase.table("crop_health").select("*").eq("user_id", user_id)
            if crop_id:
                query = query.eq("crop_id", crop_id)
            result = query.order("recorded_at", desc=True).execute()
            return {"success": True, "health_records": result.data}
        except Exception as e:
            logger.error(f"read_health error: {e}")
            return {"success": False, "error": str(e)}
    
    async def create_health(self, user_id: str, crop_id: str, **kwargs) -> Dict[str, Any]:
        """Record new crop health check"""
        try:
            health_data = {
                "user_id": user_id,
                "crop_id": crop_id,
                "health_score": kwargs.get("health_score"),
                "growth_stage": kwargs.get("growth_stage"),
                "notes": kwargs.get("notes"),
                "images": kwargs.get("images"),
                "recorded_at": datetime.now().isoformat()
            }
            result = self.supabase.table("crop_health").insert(health_data).execute()
            return {"success": True, "health_record": result.data[0] if result.data else None}
        except Exception as e:
            logger.error(f"create_health error: {e}")
            return {"success": False, "error": str(e)}

    # ============================================================================
    # SOIL TOOLS
    # ============================================================================

    async def read_soil(self, lat: float = None, lon: float = None, district: str = None, **kwargs) -> Dict[str, Any]:
        """
        Get soil data for a location.
        """
        try:
            # If lat/lon not provided, try to find from profile or kwargs (legacy support)
            if lat is None or lon is None:
                # Default fallback handled by service if 0/0
                lat = kwargs.get("latitude", 0.0)
                lon = kwargs.get("longitude", 0.0)
            
            soil_data = await soil_service.get_soil_data(lat, lon, district)
            return {"success": True, "soil": soil_data}
        except Exception as e:
            logger.error(f"read_soil error: {e}")
            return {"success": False, "error": str(e)}

    # ============================================================================
    # CROP RECOMMENDATION TOOLS
    # ============================================================================

    async def recommend_crops(self, location: str = None, soil_type: str = None, lat: float = None, lon: float = None, state: str = None, **kwargs) -> Dict[str, Any]:
        """
        Get crop recommendations based on location and soil.
        Args:
            location: Name of the city, district, or state.
            soil_type: Type of soil (e.g., "red", "black", "loamy").
            lat: Optional latitude.
            lon: Optional longitude.
        """
        try:
            # 1. Gather location context
            location_data = {
                "state": state or location,
                "soil_type": soil_type or kwargs.get("soil_type"),
                "climate": kwargs.get("climate"),
                "weather": {}, 
            }
            
            # Auto-resolve location if lat/lon missing but name provided
            target_location = location or state
            if target_location and (lat is None or lon is None):
                logger.info(f"Auto-resolving location for crop recommendation: {target_location}")
                resolved = await web_scraper.get_location_from_name(target_location)
                if resolved:
                    lat = resolved.get("latitude")
                    lon = resolved.get("longitude")
                    # Enrich location data
                    location_data["soil_type"] = location_data.get("soil_type") or resolved.get("soil_type")
                    location_data["climate"] = location_data.get("climate") or resolved.get("climate")
                    location_data["state"] = resolved.get("state") or location_data["state"]
                    location_data["district"] = resolved.get("district")
                    location_data["weather"] = resolved.get("weather", {})
            
            # If we have lat/lon now (either provided or resolved)
            if lat and lon and not location_data.get("soil_type"):
                # Try to get soil data if we still don't have it
                soil_data = await soil_service.get_soil_data(lat, lon)
                if soil_data:
                    location_data["soil_type"] = soil_data.get("soil_type")

            # 2. Get recommendations
            recommendations = crop_recommender.recommend_crops(
                location_data=location_data,
                supabase_client=self.supabase,
                limit=5
            )
            
            return {
                "success": True, 
                "recommendations": recommendations,
                "input_location": target_location,
                "resolved_location": location_data.get("district") or location_data.get("state"),
                "message": f"Found {len(recommendations)} crops suitable for {location_data.get('district') or location_data.get('state') or 'your location'}."
            }
        except Exception as e:
            logger.error(f"recommend_crops error: {e}")
            return {"success": False, "error": str(e)}
