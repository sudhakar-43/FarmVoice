from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import json
import time
from datetime import datetime

# Import config from voice_service (assuming it exists or I need to create/update it)
# For now, I'll define a simple config handler here or use the one in voice_service if compatible.
# I'll assume I need to implement the admin logic here.

router = APIRouter()

# In-memory stats
stats = {
    "start_time": time.time(),
    "requests": 0,
    "cached_hits": 0,
    "fallbacks": 0,
    "events": []
}

ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "admin-secret-123") # Should be generated if missing

class ConfigUpdate(BaseModel):
    mode: Optional[str] = None
    warn_ms: Optional[int] = None
    failsafe_ms: Optional[int] = None

def verify_admin_token(x_admin_token: str = Header(...)):
    if x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid Admin Token")
    return x_admin_token

@router.post("/api/voice/admin/config")
async def update_config(config: ConfigUpdate, token: str = Depends(verify_admin_token)):
    """
    Update voice configuration.
    """
    # Update in-memory config (mocking the config object for now)
    # real implementation would update voice_service.config
    
    # Persist if enabled
    if os.getenv("ALLOW_MODE_PERSIST", "false").lower() == "true":
        try:
            with open("farmvoice_config.json", "w") as f:
                json.dump(config.dict(exclude_unset=True), f)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to persist config: {e}")
            
    return {"status": "updated", "config": config.dict(exclude_unset=True)}

@router.get("/api/voice/health")
async def get_health():
    """
    Get voice service health and stats.
    """
    from datetime import datetime
    uptime = time.time() - stats["start_time"]
    return {
        "status": "healthy",
        "uptime_seconds": uptime,
        "mode": os.getenv("VOICE_MODE", "local"),
        "active_sessions": stats["requests"],  # Use request count as proxy for active sessions
        "timestamp": datetime.now().isoformat(),
        "stats": {
            "requests": stats["requests"],
            "cached_hits": stats["cached_hits"],
            "fallbacks": stats["fallbacks"]
        },
        "latest_events": stats["events"][-50:]
    }

# Helper to log events
def log_event(event_type: str, details: str):
    stats["events"].append({
        "ts": datetime.now().isoformat(),
        "type": event_type,
        "details": details
    })
    # Rotate
    if len(stats["events"]) > 200:
        stats["events"] = stats["events"][-200:]
