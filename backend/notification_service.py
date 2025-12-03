"""
Notification service for generating alerts and reminders
"""

from datetime import datetime, timedelta
from typing import List, Dict
from supabase import Client

async def generate_weather_notifications(user_id: str, location_data: Dict, supabase: Client) -> List[Dict]:
    """Generate weather-based notifications"""
    notifications = []
    
    weather = location_data.get("weather", "").lower()
    
    # Rain alert
    if "rainy" in weather or "monsoon" in weather:
        notifications.append({
            "user_id": user_id,
            "title": "Rain Alert",
            "message": "Heavy rain expected in your area. Ensure proper drainage and protect your crops from waterlogging.",
            "type": "weather",
            "priority": "high",
            "created_at": datetime.utcnow().isoformat()
        })
    
    # Drought alert
    if "dry" in weather or "arid" in weather:
        notifications.append({
            "user_id": user_id,
            "title": "Water Management Alert",
            "message": "Dry conditions expected. Ensure adequate irrigation for your crops.",
            "type": "weather",
            "priority": "high",
            "created_at": datetime.utcnow().isoformat()
        })
    
    return notifications

async def generate_watering_reminders(user_id: str, tasks: List[Dict], supabase: Client) -> List[Dict]:
    """Generate watering reminders based on tasks"""
    notifications = []
    today = datetime.utcnow().date()
    
    for task in tasks:
        if task.get("task_type") == "watering" and task.get("scheduled_date") == today.isoformat() and not task.get("completed"):
            notifications.append({
                "user_id": user_id,
                "title": "Watering Reminder",
                "message": f"Don't forget to water your crops today: {task.get('task_name', 'Watering task')}",
                "type": "watering",
                "priority": "high",
                "created_at": datetime.utcnow().isoformat()
            })
    
    return notifications

async def generate_disease_alerts(user_id: str, crops: List[Dict], supabase: Client) -> List[Dict]:
    """Generate disease prevention alerts based on crop and season"""
    notifications = []
    today = datetime.utcnow()
    month = today.month
    
    # Monsoon season (June-September) - high disease risk
    if month in [6, 7, 8, 9]:
        for crop in crops:
            if crop.get("status") == "active":
                notifications.append({
                    "user_id": user_id,
                    "title": "Disease Prevention Alert",
                    "message": f"Monsoon season increases disease risk for {crop.get('crop_name', 'your crops')}. Monitor regularly and apply preventive measures.",
                    "type": "disease",
                    "priority": "medium",
                    "created_at": datetime.utcnow().isoformat()
                })
    
    return notifications

async def generate_harvest_reminders(user_id: str, crops: List[Dict], supabase: Client) -> List[Dict]:
    """Generate harvest reminders"""
    notifications = []
    today = datetime.utcnow().date()
    
    for crop in crops:
        if crop.get("expected_harvest_date"):
            try:
                harvest_date = datetime.fromisoformat(crop["expected_harvest_date"]).date()
                days_until = (harvest_date - today).days
                
                if 0 <= days_until <= 7:
                    notifications.append({
                        "user_id": user_id,
                        "title": "Harvest Reminder",
                        "message": f"{crop.get('crop_name', 'Your crop')} is ready for harvest in {days_until} days. Prepare for harvesting.",
                        "type": "harvest",
                        "priority": "high",
                        "created_at": datetime.utcnow().isoformat()
                    })
            except:
                pass
    
    return notifications

async def generate_market_alerts(user_id: str, supabase: Client) -> List[Dict]:
    """Generate market price alerts"""
    notifications = []
    
    # This would integrate with market data API
    # For now, generate sample notifications
    
    notifications.append({
        "user_id": user_id,
        "title": "Market Price Update",
        "message": "Check latest market prices for your crops. Prices are updated daily.",
        "type": "market",
        "priority": "low",
        "action_url": "/home?feature=market",
        "created_at": datetime.utcnow().isoformat()
    })
    
    return notifications

async def generate_all_notifications(user_id: str, supabase: Client):
    """Generate all notifications for a user"""
    try:
        # Get user profile
        profile_response = supabase.table("farmer_profiles").select("*").eq("user_id", user_id).execute()
        profile = profile_response.data[0] if profile_response.data else None
        
        # Get selected crops
        crops_response = supabase.table("selected_crops").select("*").eq("user_id", user_id).eq("status", "active").execute()
        crops = crops_response.data or []
        
        # Get tasks
        tasks_response = supabase.table("daily_tasks").select("*").eq("user_id", user_id).gte("scheduled_date", datetime.utcnow().date().isoformat()).execute()
        tasks = tasks_response.data or []
        
        all_notifications = []
        
        # Generate weather notifications
        if profile:
            location_data = {
                "weather": "moderate",  # In production, fetch from weather API
                "region": profile.get("region", ""),
            }
            all_notifications.extend(await generate_weather_notifications(user_id, location_data, supabase))
        
        # Generate watering reminders
        all_notifications.extend(await generate_watering_reminders(user_id, tasks, supabase))
        
        # Generate disease alerts
        all_notifications.extend(await generate_disease_alerts(user_id, crops, supabase))
        
        # Generate harvest reminders
        all_notifications.extend(await generate_harvest_reminders(user_id, crops, supabase))
        
        # Generate market alerts (once per day)
        existing_market = supabase.table("notifications").select("*").eq("user_id", user_id).eq("type", "market").gte("created_at", (datetime.utcnow() - timedelta(days=1)).isoformat()).execute()
        if not existing_market.data:
            all_notifications.extend(await generate_market_alerts(user_id, supabase))
        
        # Insert notifications (avoid duplicates)
        if all_notifications:
            for notification in all_notifications:
                # Check if similar notification already exists
                existing = supabase.table("notifications").select("*").eq("user_id", user_id).eq("title", notification["title"]).eq("read", False).execute()
                if not existing.data:
                    supabase.table("notifications").insert(notification).execute()
        
    except Exception as e:
        print(f"Error generating notifications: {e}")

