import json
import logging
import ollama
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

from .config import config

class LLMService:
    """
    Service to interact with local Ollama instance.
    Supports multiple roles: planner, tasks, market, disease, ui.
    Enforces JSON output.
    """
    
    @property
    def MODEL(self):
        return config.local_llm_model
    
    PROMPTS = {
        "planner": """
        You are the 'Planner' role for FarmVoice.
        Your goal is to understand the user's intent and decide the next action.
        Input: User query and current context.
        Output: JSON with {"intent": "...", "next_step": "...", "speech": "..."}
        Intents: "plan_tasks", "market_prices", "disease_check", "weather_check", "general_chat".
        Keep speech concise (under 2 sentences).
        """,
        
        "tasks": """
        You are the 'Tasks' role.
        Input: A list of farming tasks for the next 10 days.
        Output: JSON with {"speech": "...", "summary": "..."}
        Summarize the key tasks for the user in natural language.
        Focus on immediate actions (Today/Tomorrow).
        """,
        
        "market": """
        You are the 'Market' role.
        Input: Market price data and trends.
        Output: JSON with {"speech": "...", "analysis": "..."}
        Highlight the best prices and any significant trends.
        Suggest the best time to sell if data permits.
        """,
        
        "disease": """
        You are the 'Disease' role.
        Input: Disease risk score and factors.
        Output: JSON with {"speech": "...", "advice": "..."}
        Convert the risk score into actionable advice. 
        Be cautious and safety-oriented.
        """,
        
        "ui": """
        You are the 'UI' role.
        Input: Data to be displayed.
        Output: JSON with {"canvas_spec": {...}}
        Generate a canvas specification for the frontend.
        Widgets: kpi, lane.board, chart.line, card.list, table.
        Layout: grid.
        """
    }

    def __init__(self):
        pass

    async def generate_response(self, role: str, context: Dict[str, Any], user_query: str = "") -> Dict[str, Any]:
        """
        Generate a response using the specified role.
        """
        if role not in self.PROMPTS:
            raise ValueError(f"Unknown role: {role}")
            
        system_prompt = self.PROMPTS[role]
        
        # Construct the full prompt
        messages = [
            {'role': 'system', 'content': system_prompt + "\nIMPORTANT: Output strictly valid JSON only. No markdown formatting."},
            {'role': 'user', 'content': f"Context: {json.dumps(context)}\nUser Query: {user_query}"}
        ]
        
        try:
            response = ollama.chat(model=self.MODEL, messages=messages, format='json')
            content = response['message']['content']
            
            # Parse JSON
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                logger.error(f"Failed to parse LLM JSON response: {content}")
                return {"error": "Invalid JSON from LLM", "raw": content}
                
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            return {"error": str(e)}

llm_service = LLMService()
