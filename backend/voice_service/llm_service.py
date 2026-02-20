"""
Optimized LLM Service for FarmVoice
Optimizations:
- Response caching with semantic similarity
- Reduced context window for faster inference
- Optimized model parameters for speed
- Parallel intent detection
- Model warming on startup
"""

import json
import logging
import time
import asyncio
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

# Try to import ollama
try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    ollama = None

# Try to import pyparsing with fallback
try:
    import pyparsing
    if not hasattr(pyparsing, "DelimitedList"):
        if hasattr(pyparsing, "delimited_list"):
            pyparsing.DelimitedList = pyparsing.delimited_list
except ImportError:
    pass

from .config import config
from .cache_manager import cache_manager

logger = logging.getLogger(__name__)


class OptimizedLLMService:
    """
    Optimized LLM service with:
    - Response caching
    - Reduced context windows
    - Optimized model parameters
    - Fast-path for simple queries
    """

    # Optimized prompts with reduced token count
    PROMPTS = {
        "agent": """You are FarmVoice, a farming advisor for Indian farmers.

RULES:
1. NEVER hallucinate data - only use provided information
2. If data is missing, ASK for it
3. Keep responses under 150 characters for speech
4. Use simple, direct language

OUTPUT FORMAT (JSON only):
{
  "speech": "Your response",
  "intent": "crop_recommendation|disease|weather|market|greeting|error|chat",
  "actions": []
}

Speech: Single line, under 150 chars, no markdown/emojis.""",

        "query_answerer": """You are a farming expert. Provide clear, practical advice.
Keep it under 2 sentences. Be direct and actionable.""",

        "synthesizer": """Convert tool results into one clear sentence.
Include specific data. Use simple language. Under 100 characters.""",

        "voice_single_pass": """You are FarmVoice. Answer immediately and directly.
Keep it simple and actionable. Under 150 characters.""",
    }

    # Fast responses for common queries (bypass LLM entirely)
    FAST_RESPONSES = {
        "greeting": {
            "speech": "Hello! How can I help you today?",
            "intent": "greeting",
            "actions": []
        },
        "help": {
            "speech": "I can help with weather, crop recommendations, disease diagnosis, and market prices. Just ask!",
            "intent": "help",
            "actions": []
        },
        "weather_check": {
            "speech": "Let me check the weather for you.",
            "intent": "weather_check",
            "actions": [{"type": "read", "entity": "weather", "params": {}}]
        },
        "market_prices": {
            "speech": "Let me get the current market prices.",
            "intent": "market_prices",
            "actions": [{"type": "read", "entity": "market", "params": {}}]
        },
        "goodbye": {
            "speech": "Goodbye! Have a great day!",
            "intent": "greeting",
            "actions": []
        },
    }

    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="llm_worker")
        self.model_name = config.local_llm_model
        self.response_cache: Dict[str, Any] = {}
        self.max_cache_size = 500
        self._model_warmed = False

    def _generate_cache_key(self, role: str, context: Dict, query: str) -> str:
        """Generate cache key for LLM response"""
        # Use only essential context for cache key
        cache_context = {
            "role": role,
            "query": query.lower().strip(),
            "location": context.get("location", ""),
            "crop": context.get("active_crop", ""),
        }
        key_data = json.dumps(cache_context, sort_keys=True, default=str)
        return hashlib.md5(key_data.encode()).hexdigest()

    def _get_cached_response(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached LLM response"""
        # Check in-memory cache first
        if cache_key in self.response_cache:
            return self.response_cache[cache_key]
        
        # Check semantic cache
        return cache_manager.get_semantic_cached(cache_key)

    def _cache_response(self, cache_key: str, response: Dict[str, Any], ttl: int = 600):
        """Cache LLM response"""
        # In-memory cache (LRU)
        if len(self.response_cache) >= self.max_cache_size:
            # Remove oldest entry
            oldest_key = next(iter(self.response_cache))
            del self.response_cache[oldest_key]
        
        self.response_cache[cache_key] = response
        
        # Semantic cache
        cache_manager.set_semantic_cached(cache_key, response, ttl)

    def get_fast_response(self, intent: str) -> Optional[Dict[str, Any]]:
        """Get pre-defined response for common intents"""
        return self.FAST_RESPONSES.get(intent)

    async def generate_response(
        self, role: str, context: Dict[str, Any], user_query: str = ""
    ) -> Dict[str, Any]:
        """
        Generate a response with caching and optimization.
        Returns Dict with speech, intent, actions.
        """
        start_time = time.perf_counter()
        
        if role not in self.PROMPTS:
            raise ValueError(f"Unknown role: {role}")

        # Check cache first
        cache_key = self._generate_cache_key(role, context, user_query)
        cached = self._get_cached_response(cache_key)
        if cached:
            elapsed = (time.perf_counter() - start_time) * 1000
            logger.info(f"[LLM] Cache hit in {elapsed:.0f}ms")
            cached["_cached"] = True
            cached["_cache_time_ms"] = elapsed
            return cached

        system_prompt = self.PROMPTS[role]
        is_text_mode = role in ["voice_single_pass", "query_answerer", "synthesizer"]

        # Language handling
        language = context.get("language", "en")
        lang_map = {
            "te": "Telugu", "ta": "Tamil", "kn": "Kannada",
            "ml": "Malayalam", "hi": "Hindi", "en": "English",
        }
        full_lang_name = lang_map.get(language, "English")
        language_instruction = ""
        if language != "en":
            language_instruction = f"\nRespond in {full_lang_name}."

        # Provider selection
        if config.llm_provider == "gemini" and config.gemini_api_key:
            response = await self._generate_with_gemini(
                role, system_prompt, language_instruction,
                context, user_query, is_text_mode
            )
        else:
            response = await self._generate_with_ollama(
                role, system_prompt, language_instruction,
                context, user_query, is_text_mode
            )

        # Cache the response
        if response and response.get("speech"):
            self._cache_response(cache_key, response)

        elapsed = (time.perf_counter() - start_time) * 1000
        response["_latency_ms"] = elapsed
        logger.info(f"[LLM] Generated response in {elapsed:.0f}ms")

        return response

    async def _generate_with_gemini(
        self, role: str, system_prompt: str, language_instruction: str,
        context: Dict[str, Any], user_query: str, is_text_mode: bool
    ) -> Dict[str, Any]:
        """Generate response using Google Gemini API (optimized)"""
        try:
            import google.generativeai as genai
            genai.configure(api_key=config.gemini_api_key)

            full_system = system_prompt + language_instruction
            if not is_text_mode:
                full_system += "\nOutput strictly valid JSON only."
                generation_config = {"response_mime_type": "application/json"}
            else:
                full_system += "\nReturn plain text only."
                generation_config = {"response_mime_type": "text/plain"}

            model = genai.GenerativeModel(
                model_name=config.gemini_model,
                system_instruction=full_system
            )

            # Optimized context - only essential info
            optimized_context = self._optimize_context(context)
            user_content = f"Context: {json.dumps(optimized_context, default=str)}\nQuery: {user_query or 'No query'}"

            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: model.generate_content(
                    user_content,
                    generation_config=generation_config,
                    request_options={"timeout": 10000}  # 10s timeout
                )
            )

            content = response.text

            if is_text_mode:
                return {"speech": content.strip(), "intent": "chat", "actions": []}
            else:
                return self._parse_json_response(content, role)

        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            # Fallback to Ollama
            return await self._generate_with_ollama(
                role, system_prompt, language_instruction,
                context, user_query, is_text_mode
            )

    async def _generate_with_ollama(
        self, role: str, system_prompt: str, language_instruction: str,
        context: Dict[str, Any], user_query: str, is_text_mode: bool
    ) -> Dict[str, Any]:
        """Generate response using Ollama (optimized)"""
        if not OLLAMA_AVAILABLE:
            return self._get_fallback_response(role)

        full_system = system_prompt + language_instruction
        if not is_text_mode:
            full_system += "\nOutput strictly valid JSON only."

        # Optimized context - reduce token count
        optimized_context = self._optimize_context(context)

        messages = [
            {"role": "system", "content": full_system},
            {"role": "user", "content": f"Context: {json.dumps(optimized_context, default=str)}\nQuery: {user_query or 'No query'}"},
        ]

        try:
            client = ollama.AsyncClient(host=config.ollama_base_url)
            timeout_val = 10  # Reduced timeout for faster failure

            # Optimized model parameters for speed
            options_dict = {
                "temperature": 0.1,  # Lower for more deterministic output
                "num_predict": 150,  # Reduced max tokens
                "top_p": 0.85,
                "top_k": 20,  # Reduced for faster sampling
                "stop": ["```", "User:", "System:"],
            }

            response = await asyncio.wait_for(
                client.chat(
                    model=self.model_name,
                    messages=messages,
                    format="json" if not is_text_mode else None,
                    options=options_dict,
                    keep_alive="2m",  # Shorter keep-alive
                ),
                timeout=timeout_val,
            )

            content = response["message"]["content"]

            if is_text_mode:
                return {"speech": content.strip(), "intent": "chat", "actions": []}
            else:
                return self._parse_json_response(content, role)

        except asyncio.TimeoutError:
            logger.error(f"Ollama request timeout ({timeout_val}s)")
            return self._get_fallback_response(role)
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            return self._get_fallback_response(role)

    def _optimize_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimize context by keeping only essential fields.
        Reduces token count for faster inference.
        """
        optimized = {}
        
        # Essential fields only
        essential_fields = [
            "location", "city", "state", "lat", "lon",
            "active_crop", "selected_crops", "soil_type",
            "weather", "user_id", "language"
        ]
        
        for field in essential_fields:
            if field in context:
                optimized[field] = context[field]
        
        # Limit conversation history to last 2 exchanges
        if "conversation_history" in context:
            history = context["conversation_history"]
            if isinstance(history, list) and len(history) > 4:
                optimized["conversation_history"] = history[-4:]
            else:
                optimized["conversation_history"] = history
        
        # Simplify user profile
        if "user_profile" in context:
            profile = context["user_profile"]
            optimized["user_profile"] = {
                k: v for k, v in profile.items()
                if k in ["name", "location", "preferred_crop"]
            }
        
        return optimized

    def _parse_json_response(self, content: str, role: str) -> Dict[str, Any]:
        """Parse and validate JSON response"""
        try:
            raw = content.strip()

            # Remove markdown code blocks
            if raw.startswith("```json"):
                raw = raw[7:]
            if raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()

            # Fix unbalanced braces
            if raw.count("{") != raw.count("}"):
                if raw.count("{") > raw.count("}"):
                    raw += "}" * (raw.count("{") - raw.count("}"))

            parsed = json.loads(raw)

            # Validate required fields for agent role
            if role == "agent":
                if "speech" not in parsed:
                    parsed["speech"] = "I need more information to help with that."
                if "intent" not in parsed:
                    parsed["intent"] = "chat"
                if "actions" not in parsed:
                    parsed["actions"] = []

                # Clean speech
                speech = str(parsed["speech"]).replace("\n", " ").strip()
                if len(speech) > 150:
                    speech = speech[:147] + "..."
                parsed["speech"] = speech

            return parsed

        except Exception as e:
            logger.error(f"JSON parsing failed: {e}")
            return self._get_fallback_response(role)

    def _get_fallback_response(self, role: str) -> Dict[str, Any]:
        """Get fallback response when LLM fails"""
        fallbacks = {
            "agent": {
                "speech": "I had trouble processing that. Could you rephrase?",
                "intent": "error",
                "actions": []
            },
            "query_answerer": {
                "speech": "I'm having trouble answering that right now.",
                "intent": "error",
                "actions": []
            },
            "synthesizer": {
                "speech": "Here's what I found.",
                "intent": "chat",
                "actions": []
            },
        }
        return fallbacks.get(role, fallbacks["agent"])

    def warm_up_model(self):
        """Warm up LLM model with dummy request"""
        try:
            # Send a simple request to warm up the model
            asyncio.create_task(self.generate_response(
                role="agent",
                context={"language": "en"},
                user_query="Hello"
            ))
            self._model_warmed = True
            logger.info("[LLM] Model warm-up initiated")
            return True
        except Exception as e:
            logger.error(f"[LLM] Warm-up failed: {e}")
            return False

    def get_stats(self) -> dict:
        """Get LLM service statistics"""
        return {
            "model_name": self.model_name,
            "ollama_available": OLLAMA_AVAILABLE,
            "cache_size": len(self.response_cache),
            "max_cache_size": self.max_cache_size,
            "model_warmed": self._model_warmed,
            "provider": config.llm_provider,
        }

    def clear_cache(self):
        """Clear response cache"""
        self.response_cache.clear()


# Global LLM service instance
llm_service = OptimizedLLMService()
