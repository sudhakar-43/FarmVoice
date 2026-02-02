"""
FarmVoice AI Agent Core
The main intelligence engine for FarmVoice with full CRUD permissions
"""
import asyncio
import logging
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
import json

from .agent_memory import AgentMemory
from .agent_tools import AgentToolRegistry
from .llm_service import llm_service
from .observability import metrics_collector
from .cache_manager import cache_manager
from .config import config
import re


FAST_INTENTS = {
    "greeting": [
        r"^(hi|hello|hey|greetings|namaste|vanakkam|namaskar)\b",
        r"^good\s*(morning|afternoon|evening|night)\b",
        r"^(how are you|what's up|howdy)\b"
    ],
    "help": [
        r"^(help|what can you do|how do I use|what are your features)\b",
        r"^(tell me about yourself|who are you)\b"
    ],
    "weather_check": [
        r"(weather|rain|temperature|forecast|hot|cold)\b",
        r"(will it rain|is it going to rain)\b"
    ],
    "market_prices": [
        r"(price|market|rate|cost|sell|buy)\b.*(crop|vegetable|fruit|rice|wheat|tomato|onion)",
        r"(crop|vegetable|fruit|rice|wheat|tomato|onion)\b.*(price|market|rate|cost)"
    ],
    "repair": [
        r"^(what|huh|pardon|sorry|repeat|say again|i didn'?t (hear|catch|understand))\b",
        r"^(you need to say that|speak up)\b",
        r"^\?+$"
    ]
}

# HARD GATES: Intent -> Required Context Field
REQUIRED_PRECONDITIONS = {
    # "recommend_crops": "location",
    # "read_weather": "location",
    # "read_soil": "location",
    # "read_market": "location"
}

logger = logging.getLogger(__name__)


@dataclass
class AgentAction:
    """Represents an action the agent wants to execute"""
    type: str  # create, read, update, delete
    entity: str  # crop, task, profile, etc.
    params: Dict[str, Any]
    

@dataclass
class Suggestion:
    """Proactive suggestion from the agent"""
    text: str
    priority: str  # high, medium, low
    action: Optional[AgentAction] = None
    reason: Optional[str] = None


@dataclass
class AgentResponse:
    """Complete agent response structure"""
    speech: str
    suggestions: List[Suggestion]
    actions_taken: List[Dict[str, Any]]
    ui_updates: Dict[str, Any]
    context_updates: Dict[str, Any]
    success: bool = True
    error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "success": self.success,
            "speech": self.speech,
            "suggestions": [asdict(s) for s in self.suggestions],
            "actions_taken": self.actions_taken,
            "ui_updates": self.ui_updates,
            "error": self.error
        }


class FarmVoiceAgent:
    """
    Main AI Agent that replaces VoicePlanner.
    Handles: Query answering, Suggestions, CRUD operations, Memory
    """
    
    def __init__(self):
        self.memory = AgentMemory()
        self.tools = AgentToolRegistry()
        logger.info("FarmVoice Agent initialized")

    def detect_fast_intent(self, query: str) -> Optional[str]:
        """
        Detect if query matches a fast-path intent.
        Returns intent name or None.
        """
        query_lower = query.lower().strip()
        
        for intent, patterns in FAST_INTENTS.items():
            for pattern in patterns:
                if re.search(pattern, query_lower, re.IGNORECASE):
                    return intent
        return None
    
    async def process_message(
        self,
        message: str,
        user_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Main entry point for all agent interactions.
        Processes user message and returns complete response.
        """
        # VOICE SAFETY: Validate input
        if not message or not message.strip():
             raise ValueError("Empty user input received")

        start_time = time.perf_counter()
        
        try:
            logger.info(f"[TIMING] Agent processing started for user {user_id}")
            
            # Load context from memory
            memory_context = await self.memory.get_context(user_id)
            
            # Merge with provided context
            full_context = {
                **memory_context,
                **(context or {}),
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
                "language": context.get("language", "en") if context else "en"
            }
            
            # AUTO-REVERSE GEOCODE: If we have lat/lon but no named location, fix it now
            if "lat" in full_context and "lon" in full_context and full_context["lat"] and full_context["lon"]:
                 if not full_context.get("location") and not full_context.get("city"):
                     try:
                         from services.weather_service import weather_service
                         logger.info(f"Auto-resolving location for {full_context['lat']}, {full_context['lon']}")
                         geo_info = await weather_service.reverse_geocode(float(full_context["lat"]), float(full_context["lon"]))
                         if geo_info:
                             full_context.update({
                                 "location": geo_info.get("location_name"),
                                 "city": geo_info.get("city"),
                                 "state": geo_info.get("state"),
                                 "district": geo_info.get("district")
                             })
                             logger.info(f"Resolved location context: {geo_info.get('location_name')}")
                     except Exception as e:
                         logger.error(f"Auto-reverse geocode failed: {e}")
            
            # Store conversation in memory
            await self.memory.store_conversation(user_id, "user", message)
            
            # Classify intent and generate response
            # Debug tracing
            try:
                with open("backend/trace_agent.log", "a") as f:
                     f.write(f"Calling _get_agent_decision for user {user_id}\n")
            except: pass

            agent_decision = None
            
            # 1. FAST PATH: Check for simple intents (greeting, repair, etc.)
            fast_intent = self.detect_fast_intent(message)
            if fast_intent:
                logger.info(f"Fast intent detected: {fast_intent}")
                if fast_intent == "greeting":
                    agent_decision = {
                        "intent": "greeting",
                        "speech": "Hello! How can I help you today?",
                        "actions": []
                    }
                elif fast_intent == "repair":
                    # REPAIR: Get last assistant message
                    last_speech = "I didn't say anything yet."
                    history = full_context.get("conversation_history", [])
                    # Walk backwards to find last assistant message
                    for msg in reversed(history):
                        if msg.get("role") == "assistant":
                            last_speech = msg.get("content", "")
                            break
                    
                    agent_decision = {
                        "intent": "repair",
                        "speech": f"I said: {last_speech}", # Simple repetition
                        "actions": []
                    }

            # 2. LLM PATH: If no fast intent, use LLM
            if not agent_decision:
                agent_decision = await self._get_agent_decision(message, full_context)
            
            try:
                with open("backend/trace_agent.log", "a") as f:
                     f.write(f"Decision received: {agent_decision}\n")
            except: pass

            # 3. SAFETY GATES (HARD PRECONDITIONS)
            # Enforce location requirements
            detected_intent = agent_decision.get("intent")
            if detected_intent in REQUIRED_PRECONDITIONS:
                required_field = REQUIRED_PRECONDITIONS[detected_intent]
                
                # specific check for location which might be in separate keys
                has_requirement = False
                if required_field == "location":
                    # Enhanced location check: Look in context, memory, and profile
                    profile = full_context.get("user_profile", {})
                    has_requirement = bool(
                        full_context.get("location") or 
                        full_context.get("city") or 
                        full_context.get("state") or
                        (full_context.get("lat") and full_context.get("lon")) or
                        profile.get("location") or 
                        profile.get("location_address") or 
                        profile.get("pincode") or 
                        profile.get("district") or 
                        profile.get("state") or
                        profile.get("latitude")
                    )
                # Specific check for soil_type if needed, currently optional/defaulting to loamy
                # elif required_field == "soil_type": ...
                else:
                    # Check matching key in all context layers
                    has_requirement = bool(
                        full_context.get(required_field) or
                        full_context.get("user_profile", {}).get(required_field)
                    )
                
                if not has_requirement:
                    logger.warning(f"SAFETY GATE: Blocked {detected_intent} due to missing {required_field}")
                    agent_decision = {
                        "intent": "request_location",
                        "speech": "I need your location to help with that. Could you tell me where you are farming?",
                        "actions": []
                    }

            # 4. ANTI-ECHO CHECK
            # If agent repeats the user's exact words, it's a failure
            current_speech = agent_decision.get("speech", "").strip()
            if current_speech and message and current_speech.lower() == message.lower().strip():
                logger.warning("ANTI-ECHO: Agent echoed user input. Forcing fallback.")
                agent_decision["speech"] = "I'm listening. Could you give me more details?"
                agent_decision["actions"] = []
            
            try:
                with open("backend/trace_agent.log", "a") as f:
                     f.write(f"Decision received: {agent_decision}\n")
            except: pass

            # Initialize response
            speech = agent_decision.get("speech", "")
            if not speech:
                 # If decision came back with empty speech, we must error out
                 raise ValueError("LLM returned empty speech")

            actions_taken = []
            suggestions = []
            ui_updates = {}
            
            # Execute actions if any
            tool_results = {}
            if "actions" in agent_decision and agent_decision["actions"]:
                for action_spec in agent_decision["actions"]:
                    try:
                        action = AgentAction(
                            type=action_spec.get("type", "read"),
                            entity=action_spec.get("entity", ""),
                            params=action_spec.get("params", {})
                        )
                        
                        result = await self.execute_action(action, user_id, full_context)
                        actions_taken.append({
                            "action": asdict(action),
                            "result": result,
                            "success": result.get("success", True)
                        })
                        
                        # Collect results for synthesis
                        if result.get("success", True) and "result" in result:
                             tool_results[f"{action.type}_{action.entity}"] = result["result"]
                        
                        # Update UI if needed
                        if result.get("ui_update"):
                            ui_updates.update(result["ui_update"])
                            
                    except Exception as e:
                        logger.error(f"Action execution failed: {e}")
                        actions_taken.append({
                            "action": asdict(action),
                            "error": str(e),
                            "success": False
                        })

            # SYNTHESIS STEP: If we have tool results, generate a new speech response
            if tool_results:
                try:
                    synthesis_context = {
                        "intent": agent_decision.get("intent"),
                        "tool_results": tool_results,
                        "original_speech": speech
                    }
                    
                    synthesis = await llm_service.generate_response(
                        role="synthesizer",
                        context=synthesis_context,
                        user_query=message
                    )
                    
                    if "speech" in synthesis and synthesis["speech"]:
                        speech = synthesis["speech"]
                        logger.info(f"Synthesized new speech: {speech}")
                        
                except Exception as e:
                    logger.error(f"Synthesis failed: {e}")
                    # Keep original speech if synthesis fails
            
            # Generate suggestions
            if agent_decision.get("intent") != "general_chat":
                suggestions = await self.generate_suggestions(full_context)
            
            # Update memory with assistant response
            await self.memory.store_conversation(user_id, "assistant", speech)
            
            # Build final response
            response = AgentResponse(
                speech=speech,
                suggestions=suggestions,
                actions_taken=actions_taken,
                ui_updates=ui_updates,
                context_updates={},
                success=True
            )
            
            logger.info(f"Response generated: {len(actions_taken)} actions, {len(suggestions)} suggestions")
            
            # Log timing
            e2e_ms = (time.perf_counter() - start_time) * 1000
            logger.info(f"[TIMING] Agent E2E: {e2e_ms:.0f}ms")
            
            # Return dictionary for compatibility with router
            response_dict = response.to_dict()
            response_dict["timings"] = {"e2e_ms": e2e_ms}
            return response_dict
            
        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)
            # VOICE SAFETY: Return success=False so router throws 500
            return {
                "success": False,
                "speech": "", # Empty speech signals failure to router logic if success check missed
                "suggestions": [],
                "actions_taken": [],
                "ui_updates": {},
                "error": str(e)
            }
    
    async def _get_agent_decision(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Use LLM to understand intent and decide actions.
        Returns structured decision with intent, speech, and actions.
        """
        try:
            # Build agent context for LLM
            agent_context = {
                "user_message": message,
                "context": context,
                "conversation_history": context.get("conversation_history", []),
                "user_preferences": context.get("preferences", {})
            }
            
            # Get decision from LLM (using "agent" role)
            decision = await llm_service.generate_response(
                role="agent",
                context=agent_context,
                user_query=message
            )
            
            logger.debug(f"Agent decision: {decision}")
            return decision
            
        except Exception as e:
            logger.error(f"LLM decision failed: {e}")
            # NO FALLBACKS allowed - we must fail if LLM fails
            raise
    
    async def answer_query(
        self,
        query: str,
        context: Dict[str, Any]
    ) -> str:
        """
        Generate intelligent response to any farming question.
        Uses LLM with farming knowledge.
        """
        try:
            response = await llm_service.generate_response(
                role="query_answerer",
                context=context,
                user_query=query
            )
            return response.get("answer", response.get("speech", "I'm not sure about that."))
        except Exception as e:
            logger.error(f"Query answering failed: {e}")
            return "I'm having trouble answering that right now."
    
    async def generate_suggestions(
        self,
        context: Dict[str, Any]
    ) -> List[Suggestion]:
        """
        Generate proactive suggestions based on context.
        Considers weather, crops, season, tasks, etc.
        """
        suggestions = []
        
        try:
            # Get suggestions from tools based on context
            user_id = context.get("user_id")
            
            # Weather-based suggestions
            if "weather" in context:
                weather = context["weather"]
                if weather.get("rain_probability", 0) > 70:
                    suggestions.append(Suggestion(
                        text="High chance of rain today. Consider postponing irrigation.",
                        priority="medium",
                        reason="weather_alert"
                    ))
            
            # Crop-based suggestions
            if "selected_crops" in context:
                # Could suggest disease prevention, harvesting times, etc.
                pass
            
            # Task-based suggestions
            if "overdue_tasks" in context and context["overdue_tasks"]:
                count = len(context["overdue_tasks"])
                suggestions.append(Suggestion(
                    text=f"You have {count} overdue tasks. Would you like to review them?",
                    priority="high",
                    reason="overdue_tasks"
                ))
            
        except Exception as e:
            logger.error(f"Suggestion generation failed: {e}")
        
        return suggestions
    
    async def execute_action(
        self,
        action: AgentAction,
        user_id: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute any CRUD operation with full permissions.
        Routes to appropriate tool based on entity type.
        """
        try:
            logger.info(f"Executing action: {action.type} on {action.entity}")
            
            # Add user_id to params
            params = {**action.params, "user_id": user_id}
            
            # Route to appropriate tool
            tool_name = f"{action.type}_{action.entity}"
            
            if hasattr(self.tools, tool_name):
                tool_func = getattr(self.tools, tool_name)
                result = await tool_func(**params)
                
                logger.info(f"Action executed successfully: {tool_name}")
                return {
                    "success": True,
                    "result": result,
                    "ui_update": self._get_ui_update_for_action(action, result)
                }
            else:
                logger.warning(f"Tool not found: {tool_name}")
                return {
                    "success": False,
                    "error": f"Action {tool_name} not supported"
                }
                
        except Exception as e:
            logger.error(f"Action execution error: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_ui_update_for_action(
        self,
        action: AgentAction,
        result: Any
    ) -> Dict[str, Any]:
        """
        Determine what UI updates are needed based on the action.
        """
        ui_update = {}
        
        if action.entity == "crop":
            ui_update["refresh_crops"] = True
        elif action.entity == "task":
            ui_update["refresh_tasks"] = True
        elif action.entity == "profile":
            ui_update["refresh_profile"] = True
        
        return ui_update


# Global agent instance
farmvoice_agent = FarmVoiceAgent()
