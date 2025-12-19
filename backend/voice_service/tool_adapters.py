import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

from services.weather_service import weather_service
from services.soil_service import soil_service
from services.market_service import market_service
from services.task_engine import task_engine
from services.disease_engine import disease_engine

# Re-exporting for compatibility if needed, but better to use services directly
# This file now acts as a bridge for the planner's execute_tools_parallel

async def execute_tools_parallel(tool_calls: List[Dict[str, Any]], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute multiple tool calls in parallel.
    """
    results = {}
    tasks = []
    tool_names = []
    
    for tool_call in tool_calls:
        tool_name = tool_call.get("name")
        tool_args = tool_call.get("args", {})
        
        # Merge context into args if missing
        lat = tool_args.get("lat") or context.get("lat", 20.59)
        lon = tool_args.get("lon") or context.get("lon", 78.96)
        
        if tool_name == "get_weather":
            tasks.append(weather_service.get_current_weather(lat, lon))
            tool_names.append("weather")
            
        elif tool_name == "get_soil":
            tasks.append(soil_service.get_soil_data(lat, lon, tool_args.get("state")))
            tool_names.append("soil")
            
        elif tool_name == "get_market_prices":
            tasks.append(market_service.get_prices(
                state=tool_args.get("state"), 
                district=tool_args.get("district"), 
                crop=tool_args.get("crop")
            ))
            tool_names.append("market")
            
        elif tool_name == "generate_plan":
            # This is a special tool call for the 10-day plan
            tasks.append(task_engine.generate_plan(context, {"name": context.get("active_crop")}))
            tool_names.append("plan")
            
        elif tool_name == "check_disease_risk":
            # Need weather and soil first, but for parallel execution we might need to fetch them inside or assume they are passed
            # For simplicity, we'll fetch them again (cached) inside the wrapper or here
            # But wait, execute_tools_parallel is generic. 
            # Let's create a wrapper coroutine for disease risk
            async def _disease_wrapper(c, l, lo):
                w = await weather_service.get_current_weather(l, lo)
                s = await soil_service.get_soil_data(l, lo)
                return disease_engine.calculate_risk(c, w, s)
                
            tasks.append(_disease_wrapper(tool_args.get("crop", "Rice"), lat, lon))
            tool_names.append("disease_risk")

    if tasks:
        task_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for name, result in zip(tool_names, task_results):
            if isinstance(result, Exception):
                results[name] = {"error": str(result)}
            else:
                results[name] = result
                
    return results
