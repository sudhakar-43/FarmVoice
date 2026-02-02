import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from .weather_service import weather_service
from .task_repository import task_repo

logger = logging.getLogger(__name__)

# Crop-specific task templates with proper farming workflows
CROP_TASK_TEMPLATES = {
    "rice": [
        {"name": "Prepare nursery bed", "day": 0, "type": "Field Prep", "priority": "HIGH"},
        {"name": "Apply pre-emergence herbicide", "day": 1, "type": "Pesticide", "priority": "HIGH"},
        {"name": "Sow rice seeds in nursery", "day": 2, "type": "Sowing", "priority": "HIGH"},
        {"name": "First irrigation (shallow flooding)", "day": 3, "type": "Irrigation", "priority": "MEDIUM"},
        {"name": "Apply basal fertilizer (DAP)", "day": 7, "type": "Fertilizer", "priority": "MEDIUM"},
        {"name": "Transplant seedlings to main field", "day": 25, "type": "Transplanting", "priority": "HIGH"},
        {"name": "Apply nitrogen top dressing", "day": 35, "type": "Fertilizer", "priority": "MEDIUM"},
        {"name": "Check for stem borer and leaf folder", "day": 45, "type": "Inspection", "priority": "MEDIUM"},
        {"name": "Second nitrogen application", "day": 55, "type": "Fertilizer", "priority": "MEDIUM"},
        {"name": "Monitor for blast disease", "day": 70, "type": "Inspection", "priority": "HIGH"},
    ],
    "wheat": [
        {"name": "Deep plowing and leveling", "day": 0, "type": "Field Prep", "priority": "HIGH"},
        {"name": "Purchase certified wheat seeds", "day": 1, "type": "Purchase", "priority": "HIGH"},
        {"name": "Seed treatment with fungicide", "day": 2, "type": "Treatment", "priority": "HIGH"},
        {"name": "Sow wheat seeds (row sowing)", "day": 3, "type": "Sowing", "priority": "HIGH"},
        {"name": "Pre-emergence weed control", "day": 4, "type": "Weed Control", "priority": "MEDIUM"},
        {"name": "First irrigation (Crown Root Initiation)", "day": 21, "type": "Irrigation", "priority": "HIGH"},
        {"name": "Apply urea top dressing", "day": 22, "type": "Fertilizer", "priority": "MEDIUM"},
        {"name": "Second irrigation (tillering stage)", "day": 42, "type": "Irrigation", "priority": "HIGH"},
        {"name": "Check for aphids and yellow rust", "day": 50, "type": "Inspection", "priority": "MEDIUM"},
        {"name": "Third irrigation (heading stage)", "day": 80, "type": "Irrigation", "priority": "HIGH"},
    ],
    "cotton": [
        {"name": "Prepare land with deep plowing", "day": 0, "type": "Field Prep", "priority": "HIGH"},
        {"name": "Purchase Bt cotton seeds", "day": 1, "type": "Purchase", "priority": "HIGH"},
        {"name": "Sow cotton seeds", "day": 2, "type": "Sowing", "priority": "HIGH"},
        {"name": "Apply pre-emergence herbicide", "day": 3, "type": "Pesticide", "priority": "MEDIUM"},
        {"name": "First irrigation", "day": 5, "type": "Irrigation", "priority": "HIGH"},
        {"name": "Thinning of plants", "day": 15, "type": "Maintenance", "priority": "MEDIUM"},
        {"name": "First hoeing and weeding", "day": 20, "type": "Weed Control", "priority": "MEDIUM"},
        {"name": "Apply NPK fertilizer", "day": 30, "type": "Fertilizer", "priority": "MEDIUM"},
        {"name": "Check for bollworm", "day": 45, "type": "Inspection", "priority": "HIGH"},
        {"name": "Second fertilizer application", "day": 60, "type": "Fertilizer", "priority": "MEDIUM"},
        {"name": "Monitor for pink bollworm", "day": 90, "type": "Inspection", "priority": "HIGH"},
    ],
    "maize": [
        {"name": "Prepare seedbed with fine tilth", "day": 0, "type": "Field Prep", "priority": "HIGH"},
        {"name": "Purchase hybrid maize seeds", "day": 1, "type": "Purchase", "priority": "HIGH"},
        {"name": "Sow maize seeds", "day": 2, "type": "Sowing", "priority": "HIGH"},
        {"name": "Apply pre-emergence herbicide", "day": 3, "type": "Pesticide", "priority": "MEDIUM"},
        {"name": "First irrigation", "day": 5, "type": "Irrigation", "priority": "HIGH"},
        {"name": "Thinning of plants", "day": 12, "type": "Maintenance", "priority": "MEDIUM"},
        {"name": "First weeding and earthing up", "day": 20, "type": "Weed Control", "priority": "MEDIUM"},
        {"name": "Apply nitrogen fertilizer", "day": 25, "type": "Fertilizer", "priority": "MEDIUM"},
        {"name": "Check for fall armyworm", "day": 35, "type": "Inspection", "priority": "HIGH"},
        {"name": "Irrigation at tasseling stage", "day": 55, "type": "Irrigation", "priority": "HIGH"},
    ],
    "sugarcane": [
        {"name": "Deep plowing and preparation", "day": 0, "type": "Field Prep", "priority": "HIGH"},
        {"name": "Purchase quality seed canes", "day": 1, "type": "Purchase", "priority": "HIGH"},
        {"name": "Treat setts with fungicide", "day": 2, "type": "Treatment", "priority": "HIGH"},
        {"name": "Plant setts in furrows", "day": 3, "type": "Sowing", "priority": "HIGH"},
        {"name": "Light irrigation", "day": 5, "type": "Irrigation", "priority": "HIGH"},
        {"name": "Gap filling", "day": 30, "type": "Maintenance", "priority": "MEDIUM"},
        {"name": "Apply nitrogen fertilizer", "day": 45, "type": "Fertilizer", "priority": "MEDIUM"},
        {"name": "Earthing up", "day": 60, "type": "Maintenance", "priority": "MEDIUM"},
        {"name": "Check for early shoot borer", "day": 75, "type": "Inspection", "priority": "HIGH"},
    ],
    "groundnut": [
        {"name": "Prepare field with fine tilth", "day": 0, "type": "Field Prep", "priority": "HIGH"},
        {"name": "Purchase quality groundnut seeds", "day": 1, "type": "Purchase", "priority": "HIGH"},
        {"name": "Treat seeds with Rhizobium culture", "day": 2, "type": "Treatment", "priority": "HIGH"},
        {"name": "Sow groundnut seeds", "day": 3, "type": "Sowing", "priority": "HIGH"},
        {"name": "Apply gypsum at flowering", "day": 35, "type": "Fertilizer", "priority": "HIGH"},
        {"name": "Check for tikka disease", "day": 50, "type": "Inspection", "priority": "MEDIUM"},
        {"name": "Irrigation during pod formation", "day": 60, "type": "Irrigation", "priority": "HIGH"},
    ],
}

class TaskEngine:
    """
    Engine for generating and retrieving persistent farming tasks.
    """
    
    def __init__(self):
        pass

    async def generate_plan(self, user_profile: Dict[str, Any], crop_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get existing tasks or generate new ones if none exist for this crop.
        Returns the data needed for the dashboard.
        """
        user_id = user_profile.get("user_id", str(user_profile.get("id"))) # flexible
        active_crop = crop_details.get("name")
        
        if not active_crop:
            return {"tasks": [], "health": {"score": 0, "status": "No Crop"}}

        # 1. Check if tasks exist
        existing_tasks = task_repo.get_tasks_by_user(user_id, active_crop)
        
        if not existing_tasks:
            # 2. Generate new task workflow for this crop
            new_tasks = self._create_lifecycle_tasks(user_id, active_crop)
            task_repo.create_batch_tasks(new_tasks)
            existing_tasks = new_tasks
            
        # 3. Calculate Health Score
        health_data = task_repo.get_health_score(user_id)
            
        return {
            "tasks": existing_tasks,
            "health": health_data
        }

    def _create_lifecycle_tasks(self, user_id: str, crop_name: str) -> List[Dict[str, Any]]:
        """
        Creates a sequential list of tasks for a crop lifecycle starting from 'today'.
        Uses crop-specific templates when available, falls back to generic tasks.
        """
        tasks = []
        start_date = datetime.now()
        
        # Normalize crop name for lookup
        crop_key = crop_name.lower().strip()
        
        # Check if we have a specific template for this crop
        if crop_key in CROP_TASK_TEMPLATES:
            template = CROP_TASK_TEMPLATES[crop_key]
            for task_template in template:
                tasks.append({
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "crop_name": crop_name,
                    "task_name": task_template["name"],
                    "task_type": task_template["type"],
                    "due_date": (start_date + timedelta(days=task_template["day"])).strftime("%Y-%m-%d"),
                    "priority": task_template["priority"]
                })
        else:
            # Generic fallback for unknown crops
            generic_tasks = [
                {"name": f"Prepare land for {crop_name}", "day": 0, "type": "Field Prep", "priority": "HIGH"},
                {"name": f"Purchase quality {crop_name} seeds", "day": 1, "type": "Purchase", "priority": "HIGH"},
                {"name": f"Sow {crop_name} seeds", "day": 2, "type": "Sowing", "priority": "HIGH"},
                {"name": "First irrigation", "day": 3, "type": "Irrigation", "priority": "HIGH"},
                {"name": "Apply base fertilizer", "day": 7, "type": "Fertilizer", "priority": "MEDIUM"},
                {"name": "Weeding and maintenance", "day": 15, "type": "Maintenance", "priority": "MEDIUM"},
                {"name": "Second irrigation", "day": 20, "type": "Irrigation", "priority": "MEDIUM"},
                {"name": "Check for pests and diseases", "day": 30, "type": "Inspection", "priority": "HIGH"},
                {"name": "Apply additional fertilizer", "day": 45, "type": "Fertilizer", "priority": "MEDIUM"},
            ]
            for task_template in generic_tasks:
                tasks.append({
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "crop_name": crop_name,
                    "task_name": task_template["name"],
                    "task_type": task_template["type"],
                    "due_date": (start_date + timedelta(days=task_template["day"])).strftime("%Y-%m-%d"),
                    "priority": task_template["priority"]
                })

        return tasks

task_engine = TaskEngine()

