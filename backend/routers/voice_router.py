from fastapi import APIRouter, Depends, HTTPException, Header, Request, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import json
import time
import asyncio
from datetime import datetime
from jose import jwt

# Explicit import of farmvoice_agent
from voice_service.agent_core import farmvoice_agent
from voice_service.config import config
import logging
logger = logging.getLogger(__name__)

router = APIRouter()

# --- Auth Helper (Localized to avoid circular imports) ---
security = HTTPBearer()
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

def get_current_user_dep(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Simple JWT validation to get user identity.
    """
    try:
        token = credentials.credentials
        # DEBUG LOGGING
        print(f"DEBUG AUTH: Received token: {token[:20]}...") 
        
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub") # Phone number or ID
        
        print(f"DEBUG AUTH: Decoded user_id: {user_id}")
        
        if user_id is None:
             print("DEBUG AUTH: user_id is None")
             raise HTTPException(status_code=401, detail="Invalid credentials")
        return {"id": user_id} # Minimal user object
    except Exception as e:
        print(f"DEBUG AUTH ERROR: {str(e)}")
        print(f"DEBUG AUTH ERROR: JWT_SECRET_KEY preview: {JWT_SECRET_KEY[:10]}...")
        # Print full token if it's a structural error to see if it's malformed
        print(f"Token caused error (first 30 chars): {credentials.credentials[:30]}...") 
        raise HTTPException(status_code=401, detail="Invalid credentials")

# --- Models ---
class VoiceChatRequest(BaseModel):
    text: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    lang: Optional[str] = "en"
    context: Optional[Dict[str, Any]] = {}

class VoiceFinalResponse(BaseModel):
    speech: str
    mode: str = "final"
    request_id: str
    canvas_spec: Optional[Dict[str, Any]] = {}
    ui: Optional[Dict[str, Any]] = {}
    timings: Optional[Dict[str, Any]] = {}
    cached: bool = False
    tool_results: Optional[Dict[str, Any]] = {}

# --- Endpoints ---

@router.post("/api/voice/chat")
async def voice_chat(
    request: VoiceChatRequest,
    current_user: dict = Depends(get_current_user_dep)
):
    """
    Process voice chat query - Blocking/Synchronous.
    Returns final response directly.
    """
    import uuid
    
    # TIMING: STT received
    stt_received_ts = time.perf_counter()
    request_id = str(uuid.uuid4())[:8]
    
    try:
        # Build context
        context = request.context or {}
        context.update({
            "user_id": current_user["id"],
            "lat": request.lat,
            "lon": request.lon,
            "language": request.lang,
            "active_crop": context.get("active_crop", "Rice"),
            "request_id": request_id,
            "stt_received_ts": stt_received_ts
        })
        
        logger.info(f"Processing voice query: {request.text} (ID: {request_id})")
        
        # BLOCKING: Process message directly
        result = await farmvoice_agent.process_message(
            message=request.text,
            user_id=current_user["id"],
            context=context
        )
        
        # Calculate timings
        synth_end_ts = time.perf_counter()
        total_ms = round((synth_end_ts - stt_received_ts) * 1000, 1)
        
        result["timings"] = result.get("timings", {})
        result["timings"].update({
            "total_e2e_ms": total_ms
        })
        
        # Ensure result has standard fields
        # Ideally, process_message returns a dict that matches VoiceFinalResponse structure roughly
        # We construct the response object to be safe
        
        final_response = {
            "speech": result.get("speech", ""),
            "mode": "final",
            "request_id": request_id,
            "canvas_spec": result.get("ui_updates", {}), # Mapping ui_updates to canvas_spec ? Check agent_core
            "ui": result.get("ui_updates", {}),
            "timings": result.get("timings", {}),
            "tool_results": {}, # Could extract if needed
            "cached": False
        }

        # Check for error in result
        if not result.get("success", True):
             error_msg = result.get("error", "Unknown processing error")
             logger.error(f"Voice processing returned error: {error_msg}")
             # Throw real 500 so frontend knows it failed
             raise HTTPException(status_code=500, detail=f"Voice processing failed: {error_msg}")

        # Check for empty speech
        if not final_response["speech"]:
             logger.error("Empty speech in response")
             raise HTTPException(status_code=500, detail="Voice agent returned empty response")

        logger.info(f"Voice request {request_id} completed in {total_ms}ms")
        return final_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice Chat Critical Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


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
