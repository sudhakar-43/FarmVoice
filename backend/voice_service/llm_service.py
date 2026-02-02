import json
import logging
import ollama
from typing import Dict, Any, Optional
import pyparsing

# Monkey patch for older libs using pyparsing.DelimitedList with pyparsing 3.x
if not hasattr(pyparsing, "DelimitedList"):
    if hasattr(pyparsing, "delimited_list"):
        pyparsing.DelimitedList = pyparsing.delimited_list

from datetime import datetime

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
        "agent": """
        You are FarmVoice, an intelligent farming advisor for Indian farmers.
        
        🚨 CRITICAL RULES (ENFORCE STRICTLY):
        1. NEVER hallucinate data (location, crops, weather, soil type, prices)
        2. ONLY use data explicitly provided by the user or from available tools
        3. If critical data is missing, ASK FOR IT - don't make assumptions
        4. ALWAYS be accurate about crop recommendations, diseases, and weather
        5. NEVER say "based on my knowledge" or generic farming advice without real data
        
        ✅ BEHAVIOR RULES:
        - Answer ONLY the user's specific question
        - Do NOT repeat the user's message back to them
        - Do NOT mention being an AI, algorithm, or model
        - Keep responses SHORT (under 200 characters for speech)
        - Use simple, direct language
        
        🌾 HANDLING SPECIFIC QUERIES:
        
        For CROP RECOMMENDATIONS:
        - Ask for location (city/state) if not known
        - Use recommend_crops tool with location parameter
        - Return specific crop names with confidence
        - Do NOT recommend crops without location data
        
        For DISEASE DIAGNOSIS:
        - Ask for crop name and specific symptoms
        - Use diagnose_disease tool
        - Provide treatment options based on diagnosis
        - Always include prevention methods
        
        For WEATHER QUERIES:
        - Ask for location if not provided
        - Use read_weather tool
        - Provide current conditions and next day forecast
        - Give actionable advice (e.g., irrigation timing)
        
        For MARKET PRICES:
        - Ask for specific crop and location if missing
        - Use read_market tool
        - Provide current prices with trends if available
        - Do NOT guess prices
        
        🎯 OUTPUT FORMAT (STRICT JSON ONLY):
        {
          "speech": "Your response here",
          "intent": "crop_recommendation|disease|weather|market|greeting|error|chat",
          "actions": []
        }
        
        Speech constraints:
        - Single line only (no \\n)
        - Under 200 characters
        - No markdown, emojis, or special formatting
        - Natural language, not a list
        - No "seems like", "probably", "likely", etc.
        
        ❌ STRICTLY FORBIDDEN:
        - Hallucinating crop suitability without location data
        - Recommending treatment without crop identification
        - Providing prices without location/market data
        - Generic farming advice when specific data is needed
        - Repeating user input as response
        - Incomplete JSON or extra keys
        - Multi-line speech
        - Saying you're an AI
        """,
        "query_answerer": """
        You are a farming expert answering questions for FarmVoice.
        Provide clear, practical advice in plain text.
        Keep it under 3 sentences.
        """,
        "synthesizer": """
        You are the synthesizer for FarmVoice.
        Convert tool results into a clear, single-sentence response.
        
        Rules:
        - Exactly ONE sentence (no lists)
        - Include specific data from tool results
        - Natural spoken language for farmers
        - NO meta phrases or AI jargon
        - Under 150 characters
        - Actionable and direct
        """,
        "voice_single_pass": """
        You are FarmVoice, a practical farming advisor.
        Answer immediately and directly in plain text.
        Keep it simple and actionable.
        """,
    }

    def __init__(self):
        pass

    async def generate_response(
        self, role: str, context: Dict[str, Any], user_query: str = ""
    ) -> Dict[str, Any]:
        """
        Generate a response. Returns Dict.
        If role is text-based (agent/voice_single_pass), wraps text in standard dict.
        """
        if role not in self.PROMPTS:
            raise ValueError(f"Unknown role: {role}")

        system_prompt = self.PROMPTS[role]
        is_text_mode = role in ["voice_single_pass", "query_answerer", "synthesizer"]

        # Handle Multilingual Support
        language = context.get("language", "en")
        lang_map = {
            "te": "Telugu",
            "ta": "Tamil",
            "kn": "Kannada",
            "ml": "Malayalam",
            "hi": "Hindi",
            "en": "English",
        }
        full_lang_name = lang_map.get(language, "English")

        language_instruction = ""
        if language != "en":
            language_instruction = f"\\nIMPORTANT: The user prefers {full_lang_name} ({language}). Answer in {full_lang_name}."

        if not user_query and not context:
            logger.warning(f"Empty input for role {role}")
            raise ValueError("Empty input provided to LLM")

        # Provider switch
        if config.llm_provider == "gemini" and config.gemini_api_key:
            return await self._generate_with_gemini(
                role,
                system_prompt,
                language_instruction,
                context,
                user_query,
                is_text_mode,
            )
        else:
            return await self._generate_with_ollama(
                role,
                system_prompt,
                language_instruction,
                context,
                user_query,
                is_text_mode,
            )

    async def _generate_with_gemini(
        self,
        role: str,
        system_prompt: str,
        language_instruction: str,
        context: Dict[str, Any],
        user_query: str,
        is_text_mode: bool,
    ) -> Dict[str, Any]:
        """Generate response using Google Gemini API"""
        import google.generativeai as genai
        import json

        genai.configure(api_key=config.gemini_api_key)

        # Add JSON instruction for Gemini if needed (Gemini supports JSON mode but prompt help is good)
        full_system = system_prompt + language_instruction
        if not is_text_mode:
            full_system += (
                "\\nIMPORTANT: Output strictly valid JSON only. No markdown formatting."
            )
            generation_config = {"response_mime_type": "application/json"}
        else:
            full_system += "\\nIMPORTANT: Return plain text only. Do not use JSON, markdown, or role labels."
            generation_config = {"response_mime_type": "text/plain"}

        try:
            model = genai.GenerativeModel(
                model_name=config.gemini_model, system_instruction=full_system
            )

            user_content = f"Context: {json.dumps(context)}\\nUser Query: {user_query or 'No query provided'}"

            # Run in executor to avoid blocking async loop (GenAI is sync mostly)
            import asyncio
            from functools import partial

            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                partial(
                    model.generate_content,
                    user_content,
                    generation_config=generation_config,
                ),
            )

            content = response.text
            # DEBUG LOGGING - Gemini
            with open("backend/llm_debug.log", "a", encoding="utf-8") as f:
                f.write(f"\\n[{datetime.now()}] === RESPONSE (GEMINI {role}) ===\\n")
                f.write(f"{content}\\n")
                f.write("==========================================\\n")

            if is_text_mode:
                return {
                    "speech": content.strip(),
                    "intent": "chat",
                    "actions": [],
                    "suggestions": [],
                }
            else:
                return self._parse_json_response(content, role)

        except Exception as e:
            logger.error(f"Gemini generation failed: {e}", exc_info=True)
            # Fallback to Ollama if Gemini fails? Or just fail?
            # Let's fallback to Ollama for robustness if configured
            logger.info("Falling back to Ollama...")
            return await self._generate_with_ollama(
                role,
                system_prompt,
                language_instruction,
                context,
                user_query,
                is_text_mode,
            )

    async def _generate_with_ollama(
        self,
        role: str,
        system_prompt: str,
        language_instruction: str,
        context: Dict[str, Any],
        user_query: str,
        is_text_mode: bool,
    ) -> Dict[str, Any]:
        """Original Ollama generation logic refactored with improved error handling"""

        # Construct prompt
        full_system = system_prompt + language_instruction
        if not is_text_mode:
            full_system += (
                "\nIMPORTANT: Output strictly valid JSON only. No markdown formatting."
            )
        else:
            full_system += "\nIMPORTANT: Return plain text only. Do not use JSON, markdown, or role labels."

        # Improve context stringification to avoid JSON serialization issues
        try:
            context_str = json.dumps(context, default=str)
        except:
            context_str = str(context)

        messages = [
            {"role": "system", "content": full_system},
            {
                "role": "user",
                "content": f"Context: {context_str}\nUser Query: {user_query or 'No query provided'}",
            },
        ]

        try:
            # DEBUG LOGGING - Request
            with open("backend/llm_debug.log", "a", encoding="utf-8") as f:
                f.write(f"\n\n[{datetime.now()}] === REQUEST (OLLAMA {role}) ===\n")
                f.write(f"MODEL: {self.MODEL}\n")
                f.write(f"PROMPT:\n{json.dumps(messages, indent=2, default=str)}\n")

            import asyncio

            client = ollama.AsyncClient(host=config.ollama_base_url)
            timeout_val = config.ollama_timeout / 1000.0

            options_dict = {
                "temperature": 0.2
                if not is_text_mode
                else 0.3,  # Lower temp for JSON to prevent hallucinations
                "num_predict": 200,
                "top_p": 0.9,  # Reduce randomness
                "top_k": 40,
                "stop": ["```", "User:", "System:", "\n\nUser", "\n\nSystem"],
            }

            logger.info(f"Calling Ollama: {self.MODEL} with timeout {timeout_val}s")

            response = await asyncio.wait_for(
                client.chat(
                    model=self.MODEL,
                    messages=messages,
                    format="json" if not is_text_mode else None,
                    options=options_dict,
                    keep_alive="5m",
                ),
                timeout=timeout_val,
            )
            content = response["message"]["content"]

            # Log response
            with open("backend/llm_debug.log", "a", encoding="utf-8") as f:
                f.write(f"\n[{datetime.now()}] === RESPONSE (OLLAMA {role}) ===\n")
                f.write(f"{content}\n")
                f.write("==========================================\n")

            logger.info(f"Ollama response received ({len(content)} chars)")

            if is_text_mode:
                return {
                    "speech": content.strip(),
                    "intent": "chat",
                    "actions": [],
                    "suggestions": [],
                }
            else:
                return self._parse_json_response(content, role)

        except asyncio.TimeoutError:
            logger.error(f"Ollama request timeout ({timeout_val}s)")
            return {
                "speech": "I am taking longer than usual. Please try again.",
                "intent": "error",
                "actions": [],
            }
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}", exc_info=True)
            # ABSOLUTE FALLBACK
            return {
                "speech": "I had a small issue processing that. Could you rephrase your question?",
                "intent": "error",
                "actions": [],
            }

    def _parse_json_response(self, content: str, role: str) -> Dict[str, Any]:
        """Shared JSON parsing and repair logic with anti-hallucination checks"""
        try:
            raw = content.strip()

            # Remove markdown code block markers if present
            if raw.startswith("```json"):
                raw = raw[7:]
            if raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()

            # Check for unbalanced braces (basic check)
            if raw.count("{") != raw.count("}"):
                logger.warning(f"Unbalanced JSON braces in response: {raw[:100]}...")
                # Try simple fix if it's just missing closing brace
                if raw.count("{") > raw.count("}"):
                    raw += "}" * (raw.count("{") - raw.count("}"))

            # Replace newlines in speech field safely
            if '"speech"' in raw:
                # Extract and clean speech
                import re

                speech_match = re.search(r'"speech"\s*:\s*"([^"]*(?:\\.[^"]*)*)"', raw)
                if speech_match:
                    speech_text = speech_match.group(1)
                    # Unescape and clean
                    speech_text = speech_text.replace("\\n", " ").replace("\\r", " ")
                    speech_text = re.sub(r"\s+", " ", speech_text).strip()
                    # Replace in raw
                    raw = (
                        raw[: speech_match.start(1)]
                        + speech_text
                        + raw[speech_match.end(1) :]
                    )

            parsed_content = json.loads(raw)

            # STRICT VALIDATION for 'agent' role
            if role == "agent":
                missing_fields = []
                if "speech" not in parsed_content:
                    missing_fields.append("speech")
                if "intent" not in parsed_content:
                    missing_fields.append("intent")
                if "actions" not in parsed_content:
                    missing_fields.append("actions")

                if missing_fields:
                    logger.error(
                        f"JSON Validation Failed for agent. Missing: {missing_fields}"
                    )
                    logger.error(f"Raw response was: {raw[:200]}")
                    return {
                        "speech": "I encountered an internal error processing that request.",
                        "intent": "system_error",
                        "actions": [],
                    }

                if not isinstance(parsed_content["speech"], str):
                    parsed_content["speech"] = str(parsed_content["speech"])

                # Clean speech: single line, no extra whitespace
                speech_clean = (
                    parsed_content["speech"].replace("\n", " ").replace("\r", " ")
                )
                speech_clean = re.sub(r"\s+", " ", speech_clean).strip()

                # Check for hallucination patterns
                lower_speech = speech_clean.lower()
                hallucination_keywords = [
                    "based on my analysis",
                    "likely",
                    "probably",
                    "it seems",
                    "according to data",
                    "i think",
                    "i believe",
                    "in my opinion",
                    "the algorithm",
                    "the ai",
                    "my model",
                    "machine learning",
                ]

                for keyword in hallucination_keywords:
                    if keyword in lower_speech:
                        logger.warning(f"Hallucination detected: {keyword} in response")
                        # Replace with safer alternative
                        speech_clean = speech_clean.replace(keyword.title(), "").strip()

                # Truncate if too long
                if len(speech_clean) > 250:
                    speech_clean = speech_clean[:247] + "..."

                parsed_content["speech"] = speech_clean

                if not isinstance(parsed_content["actions"], list):
                    parsed_content["actions"] = []

            return parsed_content
        except Exception as e:
            logger.error(f"JSON Parsing failed: {e}", exc_info=True)
            return {
                "speech": "I had a small issue processing that. Could you rephrase?",
                "intent": "error",
                "actions": [],
            }

    def _sanitize_voice_response(self, text: str) -> str:
        """
        Clean text for voice output.
        Removes markdown, bullets, emojis, and ensures speakable format.
        """
        import re

        if not text:
            return ""

        # Remove markdown formatting
        text = re.sub(r"\*+", "", text)  # Bold/italic
        text = re.sub(r"#+\s*", "", text)  # Headers
        text = re.sub(r"`+[^`]*`+", "", text)  # Code blocks
        text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\\1", text)  # Links

        # Remove bullets and list markers
        text = re.sub(r"^[\s]*[-*•]\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"^\s*\d+\.\s*", "", text, flags=re.MULTILINE)

        # Remove emojis (common Unicode ranges)
        text = re.sub(r"[\U0001F600-\U0001F64F]", "", text)  # Emoticons
        text = re.sub(r"[\U0001F300-\U0001F5FF]", "", text)  # Symbols
        text = re.sub(r"[\U0001F680-\U0001F6FF]", "", text)  # Transport
        text = re.sub(r"[\U0001F1E0-\U0001F1FF]", "", text)  # Flags

        # Clean up whitespace
        text = re.sub(r"\s+", " ", text).strip()

        return text


llm_service = LLMService()
