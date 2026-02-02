"""
FarmVoice Agent API Router
RESTful endpoints for agent interactions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
import logging
from datetime import datetime
from jose import jwt

from voice_service.agent_core import farmvoice_agent, AgentResponse

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


# ============================================================================
# Auth Helper
# ============================================================================

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate JWT and extract user identity.
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return {"id": user_id}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")


# ============================================================================
# Request/Response Models
# ============================================================================

class AgentChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None


class AgentChatResponse(BaseModel):
    speech: str
    suggestions: List[Dict[str, Any]]
    actions_taken: List[Dict[str, Any]]
    ui_updates: Dict[str, Any]
    success: bool
    error: Optional[str] = None


class AgentContextResponse(BaseModel):
    conversation_history: List[Dict[str, str]]
    preferences: Dict[str, Any]
    working_context: Dict[str, Any]


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/api/agent/chat", response_model=AgentChatResponse)
async def agent_chat(
    request: AgentChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Main conversation endpoint for FarmVoice Agent.
    
    Send a message and get intelligent response with:
    - Natural language speech
    - Proactive suggestions
    - Executed actions (CRUD operations)
    - UI updates
    """
    try:
        logger.info(f"Agent chat request from user {current_user['id']}: {request.message}")
        
        # Process message through agent
        response: AgentResponse = await farmvoice_agent.process_message(
            message=request.message,
            user_id=current_user["id"],
            context=request.context
        )
        
        # Convert to API response
        return AgentChatResponse(
            speech=response.speech,
            suggestions=[
                {
                    "text": sug.text,
                    "priority": sug.priority,
                    "action": sug.action.__dict__ if sug.action else None,
                    "reason": sug.reason
                }
                for sug in response.suggestions
            ],
            actions_taken=response.actions_taken,
            ui_updates=response.ui_updates,
            success=response.success,
            error=response.error
        )
        
    except Exception as e:
        logger.error(f"Agent chat error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Agent processing failed: {str(e)}"
        )


@router.get("/api/agent/suggestions")
async def get_suggestions(
    current_user: dict = Depends(get_current_user)
):
    """
    Get proactive suggestions for the user based on their current state.
    """
    try:
        # Get user context
        context = await farmvoice_agent.memory.get_context(current_user["id"])
        
        # Generate suggestions
        suggestions = await farmvoice_agent.generate_suggestions(context)
        
        return {
            "suggestions": [
                {
                    "text": sug.text,
                    "priority": sug.priority,
                    "reason": sug.reason
                }
                for sug in suggestions
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting suggestions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get suggestions: {str(e)}"
        )


@router.get("/api/agent/context", response_model=AgentContextResponse)
async def get_context(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current agent context for the user.
    Includes conversation history, preferences, and working state.
    """
    try:
        context = await farmvoice_agent.memory.get_context(current_user["id"])
        
        return AgentContextResponse(
            conversation_history=context.get("conversation_history", []),
            preferences=context.get("preferences", {}),
            working_context=context.get("working_context", {})
        )
        
    except Exception as e:
        logger.error(f"Error getting context: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get context: {str(e)}"
        )


@router.get("/api/agent/history")
async def get_history(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """
    Get conversation history.
    """
    try:
        history = await farmvoice_agent.memory.get_conversation_history(
            user_id=current_user["id"],
            limit=limit
        )
        
        return {
            "history": history,
            "count": len(history)
        }
        
    except Exception as e:
        logger.error(f"Error getting history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get history: {str(e)}"
        )


@router.delete("/api/agent/session")
async def clear_session(
    current_user: dict = Depends(get_current_user)
):
    """
    Clear current session (short-term memory).
    Long-term memory and preferences are preserved.
    """
    try:
        await farmvoice_agent.memory.clear_session(current_user["id"])
        
        return {
            "success": True,
            "message": "Session cleared successfully"
        }
        
    except Exception as e:
        logger.error(f"Error clearing session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear session: {str(e)}"
        )


@router.get("/api/agent/health")
async def agent_health():
    """
    Health check endpoint for the agent.
    """
    return {
        "status": "healthy",
        "agent": "FarmVoice",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }
