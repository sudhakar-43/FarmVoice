"""
Canvas builder for FarmVoice voice service
Generates canvas JSON specifications for UI rendering
"""

from typing import Dict, Any, List, Optional

def build_canvas(
    query: str,
    tool_results: Dict[str, Any],
    crop_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Build canvas specification based on query and tool results
    Returns canvas_spec JSON
    """
    query_lower = query.lower()
    
    # Determine canvas type based on query
    if any(word in query_lower for word in ["best crop", "recommend", "suitable", "grow"]):
        return build_crop_recommendation_canvas(tool_results, crop_context)
    
    elif any(word in query_lower for word in ["weather", "rain", "temperature", "forecast"]):
        return build_weather_canvas(tool_results)
    
    elif any(word in query_lower for word in ["market", "price", "sell", "mandi"]):
        return build_market_canvas(tool_results, crop_context)
    
    elif any(word in query_lower for word in ["fertilizer", "nutrient", "npk"]):
        return build_fertilizer_canvas(tool_results, crop_context)
    
    else:
        return build_minimal_canvas(query, tool_results)

def build_minimal_canvas(query: str, tool_results: Dict[str, Any]) -> Dict[str, Any]:
    """Build minimal KPI canvas for quick display"""
    return {
        "layout": "single",
        "widgets": [
            {
                "id": "status",
                "type": "kpi",
                "title": "Status",
                "value": "Processing",
                "subtitle": "Analyzing your query..."
            }
        ],
        "actions": []
    }

def build_crop_recommendation_canvas(tool_results: Dict[str, Any], crop: Optional[str]) -> Dict[str, Any]:
    """Build canvas for crop recommendations"""
    widgets = []
    
    # Best crop KPI
    best_crop = crop or "Rice"
    suitability = 85
    
    widgets.append({
        "id": "best_crop",
        "type": "kpi",
        "title": "Best Crop",
        "value": best_crop,
        "subtitle": f"Suitability: {suitability}%"
    })
    
    # Weather data for 7-day rainfall
    weather_result = tool_results.get("weather", {})
    weather_data = weather_result.get("data", {})
    
    if weather_data:
        # Extract 7-day rainfall data
        forecast = weather_data.get("forecast", {})
        
        widgets.append({
            "id": "rain_7day",
            "type": "chart.line",
            "title": "7-Day Rainfall Forecast (mm)",
            "data": {
                "x": ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
                "y": [5, 12, 8, 3, 0, 2, 15]  # Mock data - would come from forecast
            }
        })
    
    # Fertilizer recommendations
    fertilizer_result = tool_results.get("fertilizer", {})
    fertilizer_data = fertilizer_result.get("data", [])
    
    if fertilizer_data:
        items = []
        for fert in fertilizer_data[:3]:  # Top 3
            items.append({
                "name": fert.get("name", ""),
                "dose": fert.get("dose", ""),
                "reason": fert.get("reason", "")
            })
        
        widgets.append({
            "id": "fertilizers",
            "type": "card.list",
            "title": "Recommended Fertilizers",
            "items": items
        })
    
    return {
        "layout": "grid",
        "widgets": widgets,
        "actions": [
            {"id": "save_plan", "label": "Save Plan"},
            {"id": "view_details", "label": "View Details"}
        ]
    }

def build_weather_canvas(tool_results: Dict[str, Any]) -> Dict[str, Any]:
    """Build canvas for weather information"""
    widgets = []
    
    weather_result = tool_results.get("weather", {})
    weather_data = weather_result.get("data", {})
    current = weather_data.get("current", {})
    forecast = weather_data.get("forecast", {})
    
    # Current temperature KPI
    temp = current.get("temperature", 25)
    condition = current.get("condition", "Moderate")
    
    widgets.append({
        "id": "current_temp",
        "type": "kpi",
        "title": "Current Temperature",
        "value": f"{temp}°C",
        "subtitle": condition
    })
    
    # Humidity KPI
    humidity = current.get("humidity", 60)
    widgets.append({
        "id": "humidity",
        "type": "kpi",
        "title": "Humidity",
        "value": f"{humidity}%",
        "subtitle": "Current level"
    })
    
    # 7-day forecast chart
    widgets.append({
        "id": "temp_forecast",
        "type": "chart.line",
        "title": "7-Day Temperature Forecast",
        "data": {
            "x": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "y": [28, 30, 29, 27, 26, 28, 29]
        }
    })
    
    # Weather alerts
    alerts = []
    if current.get("precipitation", 0) > 10:
        alerts.append({
            "name": "Heavy Rain Alert",
            "dose": "Expected today",
            "reason": "Ensure proper drainage"
        })
    
    if temp > 35:
        alerts.append({
            "name": "Heat Alert",
            "dose": f"{temp}°C",
            "reason": "Ensure adequate irrigation"
        })
    
    if alerts:
        widgets.append({
            "id": "weather_alerts",
            "type": "card.list",
            "title": "Weather Alerts",
            "items": alerts
        })
    
    return {
        "layout": "grid",
        "widgets": widgets,
        "actions": []
    }

def build_market_canvas(tool_results: Dict[str, Any], crop: Optional[str]) -> Dict[str, Any]:
    """Build canvas for market prices"""
    widgets = []
    
    market_result = tool_results.get("market", {})
    market_data = market_result.get("data", [])
    
    if market_data:
        # Filter by crop if specified
        if crop:
            filtered_data = [
                item for item in market_data
                if crop.lower() in item.get("commodity", "").lower()
            ]
            if filtered_data:
                market_data = filtered_data
        
        # Best price KPI
        if market_data:
            best_price_item = max(market_data, key=lambda x: x.get("avg_price", 0))
            
            widgets.append({
                "id": "best_price",
                "type": "kpi",
                "title": f"Best Price - {best_price_item.get('commodity', 'Crop')}",
                "value": f"₹{best_price_item.get('avg_price', 0)}/Q",
                "subtitle": best_price_item.get("market", "Local Market")
            })
        
        # Market prices list
        items = []
        for item in market_data[:5]:  # Top 5
            items.append({
                "name": item.get("commodity", ""),
                "dose": f"₹{item.get('avg_price', 0)}/Quintal",
                "reason": f"{item.get('market', '')} - {item.get('district', '')}"
            })
        
        if items:
            widgets.append({
                "id": "market_prices",
                "type": "card.list",
                "title": "Market Prices",
                "items": items
            })
        
        # Price trend chart (mock data)
        widgets.append({
            "id": "price_trend",
            "type": "chart.line",
            "title": "Price Trend (Last 7 Days)",
            "data": {
                "x": ["D-7", "D-6", "D-5", "D-4", "D-3", "D-2", "Today"],
                "y": [4200, 4300, 4250, 4400, 4350, 4500, 4450]
            }
        })
    else:
        widgets.append({
            "id": "no_data",
            "type": "kpi",
            "title": "Market Data",
            "value": "Unavailable",
            "subtitle": "Check back later"
        })
    
    return {
        "layout": "grid",
        "widgets": widgets,
        "actions": [
            {"id": "refresh_prices", "label": "Refresh Prices"}
        ]
    }

def build_fertilizer_canvas(tool_results: Dict[str, Any], crop: Optional[str]) -> Dict[str, Any]:
    """Build canvas for fertilizer recommendations"""
    widgets = []
    
    fertilizer_result = tool_results.get("fertilizer", {})
    fertilizer_data = fertilizer_result.get("data", [])
    
    if fertilizer_data:
        # NPK summary KPI
        total_n = sum(
            float(f.get("dose", "0").split()[0])
            for f in fertilizer_data
            if "urea" in f.get("name", "").lower()
        )
        
        widgets.append({
            "id": "npk_summary",
            "type": "kpi",
            "title": "NPK Recommendation",
            "value": f"{int(total_n * 0.46)}:60:40",
            "subtitle": f"For {crop or 'your crop'}"
        })
        
        # Fertilizer list with safety notes
        items = []
        for fert in fertilizer_data:
            items.append({
                "name": fert.get("name", ""),
                "dose": fert.get("dose", ""),
                "reason": fert.get("timing", "") + " - " + fert.get("reason", "")
            })
        
        widgets.append({
            "id": "fertilizer_schedule",
            "type": "card.list",
            "title": "Fertilizer Schedule",
            "items": items
        })
        
        # Safety notes
        safety_items = []
        for fert in fertilizer_data:
            if "safety_note" in fert:
                safety_items.append({
                    "name": fert.get("name", ""),
                    "dose": "Safety",
                    "reason": fert.get("safety_note", "")
                })
        
        if safety_items:
            widgets.append({
                "id": "safety_notes",
                "type": "card.list",
                "title": "⚠️ Safety Guidelines",
                "items": safety_items
            })
    else:
        widgets.append({
            "id": "no_recommendations",
            "type": "kpi",
            "title": "Fertilizer Data",
            "value": "Unavailable",
            "subtitle": "Provide crop details"
        })
    
    return {
        "layout": "grid",
        "widgets": widgets,
        "actions": [
            {"id": "save_schedule", "label": "Save Schedule"}
        ]
    }

def build_error_canvas(error_message: str) -> Dict[str, Any]:
    """Build canvas for error states"""
    return {
        "layout": "single",
        "widgets": [
            {
                "id": "error",
                "type": "kpi",
                "title": "Error",
                "value": "Unable to process",
                "subtitle": error_message
            }
        ],
        "actions": []
    }

def build_failsafe_canvas() -> Dict[str, Any]:
    """Build minimal canvas for failsafe mode"""
    return {
        "layout": "single",
        "widgets": [
            {
                "id": "failsafe",
                "type": "kpi",
                "title": "Processing",
                "value": "Please wait",
                "subtitle": "Taking longer than expected..."
            }
        ],
        "actions": []
    }
