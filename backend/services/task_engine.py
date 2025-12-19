import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from .weather_service import weather_service
from .task_repository import task_repo

logger = logging.getLogger(__name__)

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
        """
        tasks = []
        start_date = datetime.now()
        
        # Standard workflow templates
        # Day 0: Prep
        tasks.append({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "crop_name": crop_name,
            "task_name": f"Buy quality {crop_name} seeds",
            "task_type": "Purchase",
            "due_date": start_date.strftime("%Y-%m-%d"),
            "priority": "HIGH"
        })
        
        tasks.append({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "crop_name": crop_name,
            "task_name": "Plow the field",
            "task_type": "Field Prep",
            "due_date": start_date.strftime("%Y-%m-%d"),
            "priority": "HIGH"
        })
        
        # Day 1: Sowing
        tasks.append({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "crop_name": crop_name,
            "task_name": f"Sow {crop_name} seeds",
            "task_type": "Sowing",
            "due_date": (start_date + timedelta(days=1)).strftime("%Y-%m-%d"),
            "priority": "HIGH"
        })
        
        # Day 2: Water
        tasks.append({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "crop_name": crop_name,
            "task_name": "First irrigation",
            "task_type": "Irrigation",
            "due_date": (start_date + timedelta(days=2)).strftime("%Y-%m-%d"),
            "priority": "MEDIUM"
        })
        
        # Day 5: Fertilizer
        tasks.append({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "crop_name": crop_name,
            "task_name": "Apply NPK Fertilizer",
            "task_type": "Fertilizer",
            "due_date": (start_date + timedelta(days=5)).strftime("%Y-%m-%d"),
            "priority": "MEDIUM"
        })
        
        # Day 10: Inspection
        tasks.append({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "crop_name": crop_name,
            "task_name": "Check for pests",
            "task_type": "Inspection",
            "due_date": (start_date + timedelta(days=10)).strftime("%Y-%m-%d"),
            "priority": "LOW"
        })

        return tasks

task_engine = TaskEngine()

