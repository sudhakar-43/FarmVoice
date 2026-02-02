"""
FarmVoice Agent Memory System
Persistent memory for conversation continuity and personalization
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import os
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


class AgentMemory:
    """
    Three-tier memory system:
    - Short-term: Current conversation (in-memory, clears on session end)
    - Working: Active task state (persists across messages in same session)
    - Long-term: User preferences and history (permanent in database)
    """
    
    def __init__(self):
        self.supabase: Optional[Client] = None
        if SUPABASE_URL and SUPABASE_KEY:
            self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.short_term_memory: Dict[str, List[Dict]] = {}  # user_id -> messages
        logger.info("Agent Memory initialized")
    
    async def store_conversation(
        self,
        user_id: str,
        role: str,
        content: str
    ) -> None:
        """
        Store a message in conversation history.
        Stores in both short-term (memory) and long-term (database).
        """
        try:
            message = {
                "role": role,
                "content": content,
                "timestamp": datetime.now().isoformat()
            }
            
            # Store in short-term memory
            if user_id not in self.short_term_memory:
                self.short_term_memory[user_id] = []
            self.short_term_memory[user_id].append(message)
            
            # Keep only last 20 messages in memory
            if len(self.short_term_memory[user_id]) > 20:
                self.short_term_memory[user_id] = self.short_term_memory[user_id][-20:]
            
            # Store in long-term (database)
            if self.supabase:
                await self._update_long_term_memory(user_id)
                
        except Exception as e:
            logger.error(f"Failed to store conversation: {e}")
    
    async def get_conversation_history(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, str]]:
        """
        Get recent conversation history for context.
        """
        try:
            # First try short-term memory
            if user_id in self.short_term_memory:
                return self.short_term_memory[user_id][-limit:]
            
            # Fallback to database
            if self.supabase:
                result = self.supabase.table("agent_memory").select("conversation_history").eq("user_id", user_id).execute()
                
                if result.data and len(result.data) > 0:
                    history = result.data[0].get("conversation_history", [])
                    # Load into short-term memory
                    self.short_term_memory[user_id] = history[-20:]
                    return history[-limit:]
            
            return []
            
        except Exception as e:
            logger.error(f"Failed to get conversation history: {e}")
            return []
    
    async def store_preference(
        self,
        user_id: str,
        key: str,
        value: Any
    ) -> None:
        """
        Store a user preference permanently.
        """
        try:
            if not self.supabase:
                logger.warning("Supabase not configured, cannot store preference")
                return
            
            # Get existing preferences
            result = self.supabase.table("agent_memory").select("preferences").eq("user_id", user_id).execute()
            
            preferences = {}
            if result.data and len(result.data) > 0:
                preferences = result.data[0].get("preferences", {})
            
            # Update preference
            preferences[key] = value
            
            # Upsert
            self.supabase.table("agent_memory").upsert({
                "user_id": user_id,
                "preferences": preferences,
                "last_interaction": datetime.now().isoformat()
            }).execute()
            
            logger.info(f"Stored preference {key} for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to store preference: {e}")
    
    async def get_preferences(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Get all user preferences.
        """
        try:
            if not self.supabase:
                return {}
            
            result = self.supabase.table("agent_memory").select("preferences").eq("user_id", user_id).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0].get("preferences", {})
            
            return {}
            
        except Exception as e:
            logger.error(f"Failed to get preferences: {e}")
            return {}
    
    async def get_context(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Get complete context for the user including history and preferences.
        """
        try:
            conversation_history = await self.get_conversation_history(user_id)
            preferences = await self.get_preferences(user_id)
            
            # Get working context from database
            working_context = {}
            if self.supabase:
                result = self.supabase.table("agent_memory").select("context").eq("user_id", user_id).execute()
                if result.data and len(result.data) > 0:
                    working_context = result.data[0].get("context", {})
            
            # Get user profile
            user_profile = {}
            if self.supabase:
                try:
                    profile_res = self.supabase.table("farmer_profiles").select("*").eq("user_id", user_id).execute()
                    if profile_res.data:
                        user_profile = profile_res.data[0]
                except Exception as e:
                    logger.error(f"Failed to fetch user profile for context: {e}")

            return {
                "conversation_history": conversation_history,
                "preferences": preferences,
                "working_context": working_context,
                "user_profile": user_profile
            }
            
        except Exception as e:
            logger.error(f"Failed to get context: {e}")
            return {
                "conversation_history": [],
                "preferences": {},
                "working_context": {}
            }
    
    async def update_working_context(
        self,
        user_id: str,
        updates: Dict[str, Any]
    ) -> None:
        """
        Update working context (temporary state within a session).
        """
        try:
            if not self.supabase:
                return
            
            # Get existing context
            result = self.supabase.table("agent_memory").select("context").eq("user_id", user_id).execute()
            
            context = {}
            if result.data and len(result.data) > 0:
                context = result.data[0].get("context", {})
            
            # Merge updates
            context.update(updates)
            
            # Save
            self.supabase.table("agent_memory").upsert({
                "user_id": user_id,
                "context": context,
                "last_interaction": datetime.now().isoformat()
            }).execute()
            
        except Exception as e:
            logger.error(f"Failed to update working context: {e}")
    
    async def clear_session(
        self,
        user_id: str
    ) -> None:
        """
        Clear short-term memory for user (end session).
        """
        try:
            if user_id in self.short_term_memory:
                del self.short_term_memory[user_id]
            
            logger.info(f"Cleared session for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to clear session: {e}")
    
    async def _update_long_term_memory(
        self,
        user_id: str
    ) -> None:
        """
        Update database with current conversation history.
        """
        try:
            if not self.supabase or user_id not in self.short_term_memory:
                return
            
            conversation_history = self.short_term_memory[user_id]
            
            self.supabase.table("agent_memory").upsert({
                "user_id": user_id,
                "conversation_history": conversation_history,
                "last_interaction": datetime.now().isoformat()
            }).execute()
            
        except Exception as e:
            logger.error(f"Failed to update long-term memory: {e}")
