"""
New Features Router - Crop Calendar, Profit Calculator, Nearby Mandis, 
Government Schemes, Analytics, and Farming Tips
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from datetime import datetime, timedelta
import random

router = APIRouter()

# ==================== CROP CALENDAR ====================
@router.get("/api/crop-calendar")
async def get_crop_calendar(
    month: Optional[int] = None,
    year: Optional[int] = None
):
    """Get crop calendar with farming activities"""
    now = datetime.now()
    target_month = month or now.month
    target_year = year or now.year
    
    # Generate calendar events based on season
    events = []
    
    # Define activities by crop
    crop_activities = {
        "Rice": [
            {"type": "sowing", "day": 5, "color": "green"},
            {"type": "watering", "day": 10, "color": "blue"},
            {"type": "fertilizing", "day": 15, "color": "orange"},
            {"type": "pest_check", "day": 20, "color": "red"},
            {"type": "harvest", "day": 28, "color": "gold"},
        ],
        "Wheat": [
            {"type": "sowing", "day": 3, "color": "green"},
            {"type": "watering", "day": 8, "color": "blue"},
            {"type": "fertilizing", "day": 12, "color": "orange"},
            {"type": "watering", "day": 18, "color": "blue"},
            {"type": "harvest", "day": 25, "color": "gold"},
        ],
        "Tomato": [
            {"type": "transplanting", "day": 2, "color": "green"},
            {"type": "watering", "day": 5, "color": "blue"},
            {"type": "pruning", "day": 10, "color": "purple"},
            {"type": "fertilizing", "day": 15, "color": "orange"},
            {"type": "harvest", "day": 22, "color": "gold"},
        ],
    }
    
    # Generate events for each crop
    for crop, activities in crop_activities.items():
        for activity in activities:
            events.append({
                "id": f"{crop}_{activity['type']}_{activity['day']}",
                "title": f"{activity['type'].replace('_', ' ').title()} - {crop}",
                "date": f"{target_year}-{target_month:02d}-{activity['day']:02d}",
                "crop": crop,
                "type": activity["type"],
                "color": activity["color"],
                "description": f"Time to {activity['type'].replace('_', ' ')} your {crop} crop."
            })
    
    # Next 7 days highlights
    upcoming = []
    for i in range(7):
        day = now + timedelta(days=i)
        day_events = [e for e in events if e["date"] == day.strftime("%Y-%m-%d")]
        if day_events:
            upcoming.extend(day_events)
    
    return {
        "month": target_month,
        "year": target_year,
        "events": sorted(events, key=lambda x: x["date"]),
        "upcoming_week": upcoming[:5],
        "season": "Rabi" if target_month in [10, 11, 12, 1, 2, 3] else "Kharif"
    }


# ==================== PROFIT CALCULATOR ====================
@router.post("/api/profit-calculator")
async def calculate_profit(
    crop_name: str,
    acres: float,
    expected_yield_per_acre: Optional[float] = None
):
    """Calculate expected profit for a crop"""
    
    # Crop data (yield per acre in quintals, costs, prices)
    crop_data = {
        "rice": {"yield": 25, "cost_per_acre": 35000, "price_per_quintal": 2200},
        "wheat": {"yield": 20, "cost_per_acre": 28000, "price_per_quintal": 2400},
        "cotton": {"yield": 8, "cost_per_acre": 45000, "price_per_quintal": 6500},
        "sugarcane": {"yield": 350, "cost_per_acre": 55000, "price_per_quintal": 350},
        "maize": {"yield": 30, "cost_per_acre": 25000, "price_per_quintal": 2000},
        "soybean": {"yield": 12, "cost_per_acre": 30000, "price_per_quintal": 4500},
        "groundnut": {"yield": 15, "cost_per_acre": 38000, "price_per_quintal": 5500},
        "tomato": {"yield": 100, "cost_per_acre": 60000, "price_per_quintal": 1500},
        "potato": {"yield": 80, "cost_per_acre": 50000, "price_per_quintal": 1200},
        "onion": {"yield": 60, "cost_per_acre": 45000, "price_per_quintal": 2000},
    }
    
    crop_key = crop_name.lower()
    if crop_key not in crop_data:
        # Default values for unknown crops
        data = {"yield": 20, "cost_per_acre": 30000, "price_per_quintal": 2500}
    else:
        data = crop_data[crop_key]
    
    yield_per_acre = expected_yield_per_acre or data["yield"]
    total_yield = yield_per_acre * acres
    total_cost = data["cost_per_acre"] * acres
    revenue = total_yield * data["price_per_quintal"]
    profit = revenue - total_cost
    profit_margin = (profit / revenue * 100) if revenue > 0 else 0
    
    return {
        "crop": crop_name,
        "acres": acres,
        "yield_per_acre": yield_per_acre,
        "total_yield_quintals": round(total_yield, 2),
        "cost_breakdown": {
            "seeds": round(total_cost * 0.15, 2),
            "fertilizers": round(total_cost * 0.25, 2),
            "pesticides": round(total_cost * 0.10, 2),
            "labor": round(total_cost * 0.30, 2),
            "irrigation": round(total_cost * 0.12, 2),
            "other": round(total_cost * 0.08, 2),
        },
        "total_cost": round(total_cost, 2),
        "price_per_quintal": data["price_per_quintal"],
        "expected_revenue": round(revenue, 2),
        "expected_profit": round(profit, 2),
        "profit_margin_percent": round(profit_margin, 1),
        "is_profitable": profit > 0,
        "recommendation": "Good investment!" if profit_margin > 20 else "Consider other crops" if profit_margin < 10 else "Moderate returns expected"
    }


# ==================== NEARBY MANDIS ====================
@router.get("/api/nearby-mandis")
async def get_nearby_mandis(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    pincode: Optional[str] = None
):
    """Get nearby agricultural markets/mandis"""
    
    # Sample mandis data (would be fetched from real API in production)
    mandis = [
        {
            "id": "m1",
            "name": "Azadpur Mandi",
            "type": "Wholesale",
            "distance_km": 5.2,
            "address": "Azadpur, North Delhi, Delhi 110033",
            "phone": "+91 11 2720 1234",
            "timing": "4:00 AM - 2:00 PM",
            "commodities": ["Vegetables", "Fruits"],
            "today_arrivals": 2500,
            "rating": 4.2,
        },
        {
            "id": "m2",
            "name": "Ghazipur Mandi",
            "type": "Wholesale",
            "distance_km": 8.5,
            "address": "Ghazipur, East Delhi, Delhi 110096",
            "phone": "+91 11 2650 5678",
            "timing": "5:00 AM - 3:00 PM",
            "commodities": ["Vegetables", "Flowers"],
            "today_arrivals": 1800,
            "rating": 4.0,
        },
        {
            "id": "m3",
            "name": "Okhla Mandi",
            "type": "Wholesale",
            "distance_km": 12.3,
            "address": "Okhla, South Delhi, Delhi 110020",
            "phone": "+91 11 2684 9012",
            "timing": "6:00 AM - 4:00 PM",
            "commodities": ["Grains", "Pulses", "Vegetables"],
            "today_arrivals": 1200,
            "rating": 3.8,
        },
        {
            "id": "m4",
            "name": "Narela Grain Market",
            "type": "Grain Market",
            "distance_km": 15.7,
            "address": "Narela, North Delhi, Delhi 110040",
            "phone": "+91 11 2756 3456",
            "timing": "8:00 AM - 6:00 PM",
            "commodities": ["Wheat", "Rice", "Pulses"],
            "today_arrivals": 800,
            "rating": 4.1,
        },
        {
            "id": "m5",
            "name": "Najafgarh Mandi",
            "type": "Wholesale",
            "distance_km": 22.1,
            "address": "Najafgarh, South West Delhi, Delhi 110043",
            "phone": "+91 11 2501 7890",
            "timing": "5:00 AM - 2:00 PM",
            "commodities": ["Vegetables", "Grains"],
            "today_arrivals": 950,
            "rating": 3.9,
        },
    ]
    
    return {
        "mandis": mandis,
        "total_count": len(mandis),
        "search_location": {
            "latitude": latitude or 28.6139,
            "longitude": longitude or 77.2090,
            "pincode": pincode
        },
        "last_updated": datetime.now().isoformat()
    }


# ==================== GOVERNMENT SCHEMES ====================
@router.get("/api/govt-schemes")
async def get_govt_schemes(
    state: Optional[str] = None,
    crop_type: Optional[str] = None
):
    """Get relevant government schemes for farmers"""
    
    schemes = [
        {
            "id": "pm-kisan",
            "name": "PM-KISAN Samman Nidhi",
            "ministry": "Ministry of Agriculture",
            "description": "Direct income support of ₹6,000 per year to farmer families",
            "benefits": ["₹6,000/year in 3 installments", "Direct bank transfer", "No middlemen"],
            "eligibility": ["Small and marginal farmers", "Land ownership documents required"],
            "apply_link": "https://pmkisan.gov.in/",
            "status": "Active",
            "color": "green",
            "icon": "money"
        },
        {
            "id": "pm-fasal",
            "name": "PM Fasal Bima Yojana",
            "ministry": "Ministry of Agriculture",
            "description": "Crop insurance scheme to protect farmers against crop loss",
            "benefits": ["Low premium (2% for Kharif, 1.5% for Rabi)", "Full claim for crop damage", "Natural calamity coverage"],
            "eligibility": ["All farmers growing notified crops", "Loanee and non-loanee farmers"],
            "apply_link": "https://pmfby.gov.in/",
            "status": "Active",
            "color": "blue",
            "icon": "shield"
        },
        {
            "id": "soil-health",
            "name": "Soil Health Card Scheme",
            "ministry": "Ministry of Agriculture",
            "description": "Free soil testing and recommendation for balanced fertilizer use",
            "benefits": ["Free soil testing", "Nutrient recommendations", "Reduces fertilizer cost by 10-15%"],
            "eligibility": ["All farmers", "Apply at nearest agriculture office"],
            "apply_link": "https://soilhealth.dac.gov.in/",
            "status": "Active",
            "color": "brown",
            "icon": "soil"
        },
        {
            "id": "kcc",
            "name": "Kisan Credit Card (KCC)",
            "ministry": "Ministry of Finance",
            "description": "Easy credit access for farming needs at low interest",
            "benefits": ["Low interest rate (4%)", "Flexible repayment", "Credit up to ₹3 lakh"],
            "eligibility": ["All farmers, sharecroppers, tenant farmers"],
            "apply_link": "https://www.nabard.org/",
            "status": "Active",
            "color": "purple",
            "icon": "credit-card"
        },
        {
            "id": "e-nam",
            "name": "e-NAM (National Agriculture Market)",
            "ministry": "Ministry of Agriculture",
            "description": "Online trading platform for agricultural commodities",
            "benefits": ["Better price discovery", "Transparent auction", "Pan-India market access"],
            "eligibility": ["All farmers with Aadhaar", "Register through local mandi"],
            "apply_link": "https://enam.gov.in/",
            "status": "Active",
            "color": "orange",
            "icon": "market"
        },
        {
            "id": "pkvy",
            "name": "Paramparagat Krishi Vikas Yojana",
            "ministry": "Ministry of Agriculture",
            "description": "Promote organic farming with financial assistance",
            "benefits": ["₹50,000/hectare over 3 years", "Organic certification support", "Marketing assistance"],
            "eligibility": ["Farmers willing to adopt organic farming", "Form cluster of 50+ farmers"],
            "apply_link": "https://pgsindia-ncof.gov.in/",
            "status": "Active",
            "color": "teal",
            "icon": "leaf"
        },
    ]
    
    return {
        "schemes": schemes,
        "total_count": len(schemes),
        "filters": {
            "state": state,
            "crop_type": crop_type
        },
        "last_updated": datetime.now().isoformat()
    }


# ==================== FARMING ANALYTICS ====================
@router.get("/api/analytics")
async def get_farming_analytics(
    period: Optional[str] = "month"  # week, month, year
):
    """Get farming analytics and statistics"""
    
    # Generate sample analytics data
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    current_month = datetime.now().month
    
    # Revenue and expense data
    monthly_data = []
    for i in range(6):
        month_idx = (current_month - 6 + i) % 12
        monthly_data.append({
            "month": months[month_idx],
            "revenue": random.randint(30000, 80000),
            "expenses": random.randint(15000, 40000),
        })
    
    # Add profit calculation
    for data in monthly_data:
        data["profit"] = data["revenue"] - data["expenses"]
    
    # Crop performance
    crop_performance = [
        {"crop": "Rice", "yield": 92, "target": 100, "status": "good"},
        {"crop": "Wheat", "yield": 78, "target": 100, "status": "moderate"},
        {"crop": "Tomato", "yield": 105, "target": 100, "status": "excellent"},
        {"crop": "Cotton", "yield": 65, "target": 100, "status": "below_target"},
    ]
    
    return {
        "summary": {
            "total_revenue": sum(d["revenue"] for d in monthly_data),
            "total_expenses": sum(d["expenses"] for d in monthly_data),
            "total_profit": sum(d["profit"] for d in monthly_data),
            "avg_monthly_profit": round(sum(d["profit"] for d in monthly_data) / len(monthly_data), 2),
            "best_month": max(monthly_data, key=lambda x: x["profit"])["month"],
        },
        "monthly_data": monthly_data,
        "crop_performance": crop_performance,
        "insights": [
            "Your tomato crop is performing 5% above target!",
            "Consider investing more in cotton - prices are rising",
            "Water usage optimized - 15% reduction this month",
        ],
        "period": period,
        "generated_at": datetime.now().isoformat()
    }


# ==================== FARMING TIPS ====================
@router.get("/api/farming-tips")
async def get_farming_tips(
    crop: Optional[str] = None,
    season: Optional[str] = None
):
    """Get personalized daily farming tips"""
    
    tips = [
        {
            "id": "tip1",
            "title": "Water Early Morning",
            "content": "Water your crops between 6-8 AM to reduce evaporation and allow plants to absorb moisture before the heat of the day.",
            "category": "irrigation",
            "icon": "💧",
            "priority": "high"
        },
        {
            "id": "tip2",
            "title": "Check for Pests Weekly",
            "content": "Inspect the undersides of leaves for pest eggs and early infestations. Early detection prevents major damage.",
            "category": "pest_management",
            "icon": "🐛",
            "priority": "medium"
        },
        {
            "id": "tip3",
            "title": "Mulching Benefits",
            "content": "Apply organic mulch around plants to retain soil moisture, regulate temperature, and suppress weeds naturally.",
            "category": "soil_management",
            "icon": "🌿",
            "priority": "medium"
        },
        {
            "id": "tip4",
            "title": "Crop Rotation",
            "content": "Rotate crops each season to prevent soil depletion and reduce pest/disease buildup in the soil.",
            "category": "planning",
            "icon": "🔄",
            "priority": "high"
        },
        {
            "id": "tip5",
            "title": "Weather Alert",
            "content": "Check weather forecast before applying fertilizers or pesticides. Rain can wash away applications.",
            "category": "weather",
            "icon": "🌦️",
            "priority": "high"
        },
        {
            "id": "tip6", 
            "title": "Soil pH Testing",
            "content": "Test your soil pH annually. Most crops prefer pH 6.0-7.0. Adjust with lime or sulfur as needed.",
            "category": "soil_management",
            "icon": "🧪",
            "priority": "low"
        },
    ]
    
    # Get tip of the day (rotates daily)
    day_of_year = datetime.now().timetuple().tm_yday
    tip_of_day = tips[day_of_year % len(tips)]
    
    return {
        "tip_of_day": tip_of_day,
        "all_tips": tips,
        "categories": ["irrigation", "pest_management", "soil_management", "planning", "weather"],
        "filters": {
            "crop": crop,
            "season": season
        },
        "date": datetime.now().strftime("%Y-%m-%d")
    }
