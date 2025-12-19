import time
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from .config import config
from .observability import metrics_collector, TimingContext, StageTimings, RequestMetrics
from .llm_service import llm_service
from .tool_adapters import execute_tools_parallel
from .canvas_builder import build_failsafe_canvas # Keeping failsafe builder
from .tts_service import tts_service

class VoicePlanner:
    """Orchestrates the complete voice processing pipeline using multi-role LLMs"""
    
    async def process_query(
        self,
        query: str,
        context: Dict[str, Any],
        emit_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Process a voice query through the complete pipeline
        """
        start_time = time.perf_counter()
        timings = StageTimings()
        
        try:
            # Step 1: Planner Role - Understand Intent
            with TimingContext("plan") as plan_timer:
                planner_response = await llm_service.generate_response("planner", context, query)
                timings.plan_ms = plan_timer.get_duration_ms()
            
            if "error" in planner_response:
                 return await self._handle_failsafe(query, context, timings, "Planner failed")

            intent = planner_response.get("intent", "general_chat")
            speech_intro = planner_response.get("speech", "")
            
            # Emit partial speech if available (optional, maybe wait for full response)
            # if emit_callback and speech_intro:
            #     await emit_callback({"type": "transcript_partial", "text": speech_intro})

            # Step 2: Execute Tools based on Intent
            tool_calls = []
            if intent == "plan_tasks":
                tool_calls.append({"name": "generate_plan", "args": {}})
            elif intent == "market_prices":
                tool_calls.append({"name": "get_market_prices", "args": {"crop": context.get("active_crop")}})
            elif intent == "disease_check":
                tool_calls.append({"name": "check_disease_risk", "args": {"crop": context.get("active_crop")}})
            elif intent == "weather_check":
                tool_calls.append({"name": "get_weather", "args": {}})
            
            tool_results = {}
            if tool_calls:
                with TimingContext("tools") as tools_timer:
                    tool_results = await execute_tools_parallel(tool_calls, context)
                    timings.tools_ms = tools_timer.get_duration_ms()
                
                if emit_callback:
                    for name, res in tool_results.items():
                        await emit_callback({"type": "tool_result", "tool": name, "result": res})

            # Step 3: Specialist Role - Generate Content
            specialist_response = {}
            role_to_call = None
            role_input = {}
            
            if intent == "plan_tasks" and "plan" in tool_results:
                role_to_call = "tasks"
                role_input = tool_results["plan"]
            elif intent == "market_prices" and "market" in tool_results:
                role_to_call = "market"
                role_input = {"prices": tool_results["market"]}
            elif intent == "disease_check" and "disease_risk" in tool_results:
                role_to_call = "disease"
                role_input = tool_results["disease_risk"]
            
            if role_to_call:
                with TimingContext("synthesis") as synth_timer:
                    specialist_response = await llm_service.generate_response(role_to_call, role_input)
                    timings.synth_ms = synth_timer.get_duration_ms()
            else:
                # General chat or no tools needed
                specialist_response = {"speech": speech_intro or "I can help with that."}

            # Step 4: UI Role - Generate Canvas
            with TimingContext("ui") as ui_timer:
                ui_input = {
                    "intent": intent,
                    "tool_results": tool_results,
                    "specialist_summary": specialist_response
                }
                ui_response = await llm_service.generate_response("ui", ui_input)
                # Fallback if UI role fails or returns empty
                if "error" in ui_response:
                    ui_response = {"canvas_spec": {"layout": "simple", "widgets": []}}

            # Combine final speech
            final_speech = specialist_response.get("speech", speech_intro)
            if specialist_response.get("summary"):
                final_speech += " " + specialist_response.get("summary")
            elif specialist_response.get("advice"):
                final_speech += " " + specialist_response.get("advice")
            elif specialist_response.get("analysis"):
                final_speech += " " + specialist_response.get("analysis")

            # Step 5: Final Response Construction
            timings.e2e_ms = (time.perf_counter() - start_time) * 1000
            
            # Record metrics
            request_metrics = RequestMetrics(
                timestamp=datetime.now(timezone.utc).isoformat(),
                mode=config.voice_mode,
                stages=timings,
                cached=any(r.get("_provenance", "").startswith("cached") or r.get("_provenance", "").startswith("local") for r in tool_results.values()),
                failsafe=False,
                tool_results={name: True for name in tool_results}
            )
            metrics_collector.record_request(request_metrics)

            return {
                "success": True,
                "speech": final_speech,
                "canvas_spec": ui_response.get("canvas_spec", {}),
                "ui": {},
                "timings": timings.to_dict(),
                "cached": request_metrics.cached,
                "tool_results": tool_results
            }

        except Exception as e:
            metrics_collector.log_event("WARN", f"Pipeline error: {str(e)}")
            return await self._handle_failsafe(query, context, timings, str(e))

    async def _handle_failsafe(self, query, context, timings, reason):
        # ... (keep existing failsafe logic or simplify)
        metrics_collector.log_event("FAILSAFE", f"Failsafe triggered: {reason}")
        return {
            "success": False,
            "speech": "I'm having trouble connecting right now. Please try again.",
            "canvas_spec": build_failsafe_canvas(),
            "timings": timings.to_dict(),
            "failsafe": True
        }

    async def process_theme_command(self, theme: str) -> Dict[str, Any]:
        # ... (keep existing)
        return {
            "success": True,
            "speech": f"Switching to {theme} theme.",
            "ui": {"theme": theme},
            "canvas_spec": {}
        }

voice_planner = VoicePlanner()
