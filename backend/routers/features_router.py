"""
Features Router - Crop Calendar, Profit Calculator, Nearby Mandis,
Government Schemes, Analytics, and Farming Tips.

All endpoints now return REAL data based on the authenticated user's
profile, selected crops, location, and live market/weather data.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date
import os
import json
import logging
import httpx

from jose import jwt
from supabase import create_client, Client

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# ── Shared helpers ──────────────────────────────────────────────────
CROPS_JSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "crops.json"
)
_crops_db: Dict[str, Any] = {}


def _load_crops_db() -> Dict[str, Any]:
    global _crops_db
    if not _crops_db and os.path.exists(CROPS_JSON_PATH):
        with open(CROPS_JSON_PATH, "r") as f:
            _crops_db = json.load(f)
    return _crops_db


def _get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    return create_client(url, key)


def _get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        phone_number = payload.get("sub")
        if not phone_number:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        sb = _get_supabase()
        res = sb.table("users").select("*").eq("phone_number", phone_number).execute()
        if not res.data:
            raise HTTPException(status_code=401, detail="User not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")


def _get_user_profile(user_id: str, sb: Client) -> Dict[str, Any]:
    res = sb.table("farmer_profiles").select("*").eq("user_id", user_id).execute()
    return res.data[0] if res.data else {}


def _get_selected_crops(user_id: str, sb: Client) -> List[Dict[str, Any]]:
    res = (
        sb.table("selected_crops")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "active")
        .execute()
    )
    return res.data or []


# Crop lifecycle stage templates (days from planting)
LIFECYCLE_STAGES = {
    "default": [
        {"type": "sowing", "day": 0, "color": "green"},
        {"type": "watering", "day": 7, "color": "blue"},
        {"type": "fertilizing", "day": 21, "color": "orange"},
        {"type": "watering", "day": 28, "color": "blue"},
        {"type": "pest_check", "day": 35, "color": "red"},
        {"type": "watering", "day": 42, "color": "blue"},
        {"type": "fertilizing", "day": 60, "color": "orange"},
        {"type": "watering", "day": 70, "color": "blue"},
        {"type": "pest_check", "day": 80, "color": "red"},
        {"type": "pre_harvest", "day": -14, "color": "purple"},
        {"type": "harvest", "day": 0, "color": "gold"},
    ],
    "rice": [
        {"type": "nursery_prep", "day": 0, "color": "green"},
        {"type": "transplanting", "day": 21, "color": "green"},
        {"type": "watering", "day": 28, "color": "blue"},
        {"type": "fertilizing", "day": 30, "color": "orange"},
        {"type": "pest_check", "day": 45, "color": "red"},
        {"type": "watering", "day": 50, "color": "blue"},
        {"type": "fertilizing", "day": 60, "color": "orange"},
        {"type": "watering", "day": 75, "color": "blue"},
        {"type": "pest_check", "day": 90, "color": "red"},
        {"type": "pre_harvest", "day": 110, "color": "purple"},
        {"type": "harvest", "day": 130, "color": "gold"},
    ],
    "wheat": [
        {"type": "sowing", "day": 0, "color": "green"},
        {"type": "watering", "day": 21, "color": "blue"},
        {"type": "fertilizing", "day": 25, "color": "orange"},
        {"type": "watering", "day": 42, "color": "blue"},
        {"type": "pest_check", "day": 50, "color": "red"},
        {"type": "fertilizing", "day": 55, "color": "orange"},
        {"type": "watering", "day": 70, "color": "blue"},
        {"type": "pre_harvest", "day": 100, "color": "purple"},
        {"type": "harvest", "day": 120, "color": "gold"},
    ],
    "tomato": [
        {"type": "transplanting", "day": 0, "color": "green"},
        {"type": "watering", "day": 3, "color": "blue"},
        {"type": "staking", "day": 14, "color": "purple"},
        {"type": "fertilizing", "day": 21, "color": "orange"},
        {"type": "pruning", "day": 28, "color": "purple"},
        {"type": "pest_check", "day": 35, "color": "red"},
        {"type": "watering", "day": 40, "color": "blue"},
        {"type": "fertilizing", "day": 45, "color": "orange"},
        {"type": "harvest", "day": 70, "color": "gold"},
        {"type": "harvest", "day": 84, "color": "gold"},
    ],
    "cotton": [
        {"type": "sowing", "day": 0, "color": "green"},
        {"type": "thinning", "day": 15, "color": "purple"},
        {"type": "fertilizing", "day": 25, "color": "orange"},
        {"type": "watering", "day": 30, "color": "blue"},
        {"type": "pest_check", "day": 45, "color": "red"},
        {"type": "fertilizing", "day": 60, "color": "orange"},
        {"type": "watering", "day": 75, "color": "blue"},
        {"type": "pest_check", "day": 90, "color": "red"},
        {"type": "defoliation", "day": 140, "color": "purple"},
        {"type": "harvest", "day": 160, "color": "gold"},
    ],
}


# ==================== CROP CALENDAR ====================
@router.get("/api/crop-calendar")
async def get_crop_calendar(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: dict = Depends(_get_current_user),
):
    """Get crop calendar based on user's actual selected crops and planting dates."""
    now = datetime.now()
    target_month = month or now.month
    target_year = year or now.year

    sb = _get_supabase()
    user_id = current_user["id"]
    crops = _get_selected_crops(user_id, sb)

    if not crops:
        return {
            "month": target_month,
            "year": target_year,
            "events": [],
            "upcoming_week": [],
            "season": "Rabi" if target_month in [10, 11, 12, 1, 2, 3] else "Kharif",
            "message": "No crops selected. Add crops to see your farming calendar.",
        }

    crops_db = _load_crops_db()
    events = []

    for crop in crops:
        crop_name = crop.get("crop_name", "")
        planting_str = crop.get("planting_date") or crop.get("created_at", "")
        if not planting_str:
            continue

        try:
            planting_date = datetime.fromisoformat(
                planting_str.replace("Z", "+00:00")
            ).date()
        except (ValueError, AttributeError):
            try:
                planting_date = datetime.strptime(planting_str[:10], "%Y-%m-%d").date()
            except Exception:
                continue

        # Get growth duration from crops.json
        crop_info = crops_db.get(crop_name, {})
        growth_days_range = crop_info.get("growth_days", [90, 120])
        avg_growth = int(sum(growth_days_range) / len(growth_days_range))

        # Choose lifecycle template
        crop_key = crop_name.lower()
        stages = LIFECYCLE_STAGES.get(crop_key, LIFECYCLE_STAGES["default"])

        for stage in stages:
            day_offset = stage["day"]
            # Handle harvest-relative days (negative means before harvest)
            if stage["type"] == "harvest" and day_offset == 0:
                event_date = planting_date + timedelta(days=avg_growth)
            elif stage["type"] == "pre_harvest":
                event_date = planting_date + timedelta(days=avg_growth - 14)
            else:
                event_date = planting_date + timedelta(days=day_offset)

            # Only include events for the target month
            if event_date.month == target_month and event_date.year == target_year:
                events.append(
                    {
                        "id": f"{crop_name}_{stage['type']}_{event_date.day}",
                        "title": f"{stage['type'].replace('_', ' ').title()} - {crop_name}",
                        "date": event_date.isoformat(),
                        "crop": crop_name,
                        "type": stage["type"],
                        "color": stage["color"],
                        "description": f"Time to {stage['type'].replace('_', ' ')} your {crop_name} crop (planted {planting_date.isoformat()}).",
                    }
                )

    # Next 7 days
    upcoming = []
    for i in range(7):
        day = (now + timedelta(days=i)).date()
        day_events = [e for e in events if e["date"] == day.isoformat()]
        upcoming.extend(day_events)

    return {
        "month": target_month,
        "year": target_year,
        "events": sorted(events, key=lambda x: x["date"]),
        "upcoming_week": upcoming[:5],
        "season": "Rabi" if target_month in [10, 11, 12, 1, 2, 3] else "Kharif",
    }


# ==================== PROFIT CALCULATOR ====================
@router.post("/api/profit-calculator")
async def calculate_profit(
    crop_name: str,
    acres: float,
    expected_yield_per_acre: Optional[float] = None,
    current_user: dict = Depends(_get_current_user),
):
    """Calculate profit using real market prices + curated cost data."""
    from services.market_service import market_service

    sb = _get_supabase()
    profile = _get_user_profile(current_user["id"], sb)
    state = profile.get("state") or profile.get("region", "")

    # Get real market price for the crop
    prices = await market_service.get_prices(state=state, crop=crop_name)
    real_price_per_quintal = None
    if prices:
        avg_prices = [p.get("avg_price", 0) for p in prices if p.get("avg_price")]
        if avg_prices:
            real_price_per_quintal = int(sum(avg_prices) / len(avg_prices))

    # Curated cost data from crops.json knowledge
    crop_economics = {
        "rice": {"yield": 25, "cost_per_acre": 35000, "fallback_price": 2200},
        "wheat": {"yield": 20, "cost_per_acre": 28000, "fallback_price": 2400},
        "cotton": {"yield": 8, "cost_per_acre": 45000, "fallback_price": 6500},
        "sugarcane": {"yield": 350, "cost_per_acre": 55000, "fallback_price": 350},
        "maize": {"yield": 30, "cost_per_acre": 25000, "fallback_price": 2000},
        "soybean": {"yield": 12, "cost_per_acre": 30000, "fallback_price": 4500},
        "groundnut": {"yield": 15, "cost_per_acre": 38000, "fallback_price": 5500},
        "tomato": {"yield": 100, "cost_per_acre": 60000, "fallback_price": 1500},
        "potato": {"yield": 80, "cost_per_acre": 50000, "fallback_price": 1200},
        "onion": {"yield": 60, "cost_per_acre": 45000, "fallback_price": 2000},
        "chilli": {"yield": 15, "cost_per_acre": 50000, "fallback_price": 18000},
    }

    crop_key = crop_name.lower()
    econ = crop_economics.get(
        crop_key, {"yield": 20, "cost_per_acre": 30000, "fallback_price": 2500}
    )

    price_per_quintal = real_price_per_quintal or econ["fallback_price"]
    price_source = (
        "Live Market Data"
        if real_price_per_quintal
        else "Estimated (Market data unavailable)"
    )

    yield_per_acre = expected_yield_per_acre or econ["yield"]
    total_yield = yield_per_acre * acres
    total_cost = econ["cost_per_acre"] * acres
    revenue = total_yield * price_per_quintal
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
        "price_per_quintal": price_per_quintal,
        "price_source": price_source,
        "expected_revenue": round(revenue, 2),
        "expected_profit": round(profit, 2),
        "profit_margin_percent": round(profit_margin, 1),
        "is_profitable": profit > 0,
        "recommendation": (
            "Good investment!"
            if profit_margin > 20
            else "Consider other crops"
            if profit_margin < 10
            else "Moderate returns expected"
        ),
    }


# ==================== NEARBY MANDIS ====================
@router.get("/api/nearby-mandis")
async def get_nearby_mandis(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    pincode: Optional[str] = None,
    current_user: dict = Depends(_get_current_user),
):
    """Get nearby mandis using data.gov.in API filtered by user's state/district."""
    sb = _get_supabase()
    profile = _get_user_profile(current_user["id"], sb)

    user_state = profile.get("state", "")
    user_district = profile.get("district", "")
    user_lat = latitude or profile.get("latitude")
    user_lon = longitude or profile.get("longitude")

    # Try data.gov.in for real mandi data
    mandis = []
    DATA_GOV_API_KEY = os.getenv(
        "DATA_GOV_API_KEY", "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"
    )

    try:
        params = {
            "api-key": DATA_GOV_API_KEY,
            "format": "json",
            "limit": 20,
        }
        if user_state:
            params["filters[state]"] = user_state.title()
        if user_district:
            params["filters[district]"] = user_district.title()

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070",
                params=params,
            )
            if resp.status_code == 200:
                data = resp.json()
                records = data.get("records", [])
                # Extract unique markets
                seen_markets = set()
                for r in records:
                    market_name = r.get("market", "")
                    if market_name and market_name not in seen_markets:
                        seen_markets.add(market_name)
                        mandis.append(
                            {
                                "id": f"m_{len(mandis) + 1}",
                                "name": market_name,
                                "type": "APMC Mandi",
                                "district": r.get("district", ""),
                                "state": r.get("state", ""),
                                "commodities": [r.get("commodity", "")],
                                "timing": "6:00 AM - 4:00 PM",
                                "source": "data.gov.in",
                            }
                        )
    except Exception as e:
        logger.warning(f"Mandi API fetch failed: {e}")

    # Fallback: curated mandis by state
    if not mandis:
        state_mandis = {
            "Andhra Pradesh": [
                {
                    "name": "Guntur Mandi",
                    "district": "Guntur",
                    "commodities": ["Chilli", "Cotton", "Tobacco"],
                },
                {
                    "name": "Kurnool Market Yard",
                    "district": "Kurnool",
                    "commodities": ["Groundnut", "Rice", "Cotton"],
                },
                {
                    "name": "Vijayawada Rythu Bazaar",
                    "district": "Krishna",
                    "commodities": ["Vegetables", "Fruits"],
                },
            ],
            "Telangana": [
                {
                    "name": "Hyderabad Bowenpally",
                    "district": "Hyderabad",
                    "commodities": ["Vegetables", "Fruits"],
                },
                {
                    "name": "Warangal Market Yard",
                    "district": "Warangal",
                    "commodities": ["Chilli", "Cotton"],
                },
                {
                    "name": "Karimnagar Mandi",
                    "district": "Karimnagar",
                    "commodities": ["Maize", "Rice"],
                },
            ],
            "Tamil Nadu": [
                {
                    "name": "Koyambedu Market",
                    "district": "Chennai",
                    "commodities": ["Vegetables", "Fruits"],
                },
                {
                    "name": "Thanjavur Mandi",
                    "district": "Thanjavur",
                    "commodities": ["Rice", "Paddy"],
                },
            ],
            "Maharashtra": [
                {
                    "name": "Lasalgaon Onion Market",
                    "district": "Nashik",
                    "commodities": ["Onion"],
                },
                {
                    "name": "Pune Market Yard",
                    "district": "Pune",
                    "commodities": ["Vegetables", "Fruits"],
                },
                {
                    "name": "Nagpur Cotton Market",
                    "district": "Nagpur",
                    "commodities": ["Cotton", "Oranges"],
                },
            ],
            "Punjab": [
                {
                    "name": "Amritsar Grain Market",
                    "district": "Amritsar",
                    "commodities": ["Wheat", "Rice"],
                },
                {
                    "name": "Ludhiana Mandi",
                    "district": "Ludhiana",
                    "commodities": ["Wheat", "Vegetables"],
                },
            ],
        }

        state_key = user_state or "Andhra Pradesh"
        # Find matching state
        matched = None
        for k in state_mandis:
            if state_key.lower() in k.lower():
                matched = k
                break
        if not matched:
            matched = "Andhra Pradesh"

        for i, m in enumerate(state_mandis[matched]):
            mandis.append(
                {
                    "id": f"m_{i + 1}",
                    "name": m["name"],
                    "type": "APMC Mandi",
                    "district": m["district"],
                    "state": matched,
                    "commodities": m["commodities"],
                    "timing": "6:00 AM - 4:00 PM",
                    "source": "Curated Directory",
                }
            )

    return {
        "mandis": mandis,
        "total_count": len(mandis),
        "search_location": {
            "latitude": user_lat,
            "longitude": user_lon,
            "state": user_state,
            "district": user_district,
            "pincode": pincode,
        },
        "last_updated": datetime.now().isoformat(),
    }


# ==================== GOVERNMENT SCHEMES ====================

# Curated scheme data -- these are real government schemes with accurate info
GOVT_SCHEMES = [
    {
        "id": "pm-kisan",
        "name": "PM-KISAN Samman Nidhi",
        "ministry": "Ministry of Agriculture",
        "description": "Direct income support of Rs.6,000 per year to farmer families",
        "benefits": [
            "Rs.6,000/year in 3 installments",
            "Direct bank transfer",
            "No middlemen",
        ],
        "eligibility": [
            "Small and marginal farmers",
            "Land ownership documents required",
        ],
        "apply_link": "https://pmkisan.gov.in/",
        "status": "Active",
        "color": "green",
        "icon": "money",
        "applicable_states": [],
        "applicable_crops": [],
        "max_land_acres": None,
    },
    {
        "id": "pm-fasal",
        "name": "PM Fasal Bima Yojana",
        "ministry": "Ministry of Agriculture",
        "description": "Crop insurance scheme to protect farmers against crop loss",
        "benefits": [
            "Low premium (2% for Kharif, 1.5% for Rabi)",
            "Full claim for crop damage",
            "Natural calamity coverage",
        ],
        "eligibility": [
            "All farmers growing notified crops",
            "Loanee and non-loanee farmers",
        ],
        "apply_link": "https://pmfby.gov.in/",
        "status": "Active",
        "color": "blue",
        "icon": "shield",
        "applicable_states": [],
        "applicable_crops": [],
        "max_land_acres": None,
    },
    {
        "id": "soil-health",
        "name": "Soil Health Card Scheme",
        "ministry": "Ministry of Agriculture",
        "description": "Free soil testing and recommendation for balanced fertilizer use",
        "benefits": [
            "Free soil testing",
            "Nutrient recommendations",
            "Reduces fertilizer cost by 10-15%",
        ],
        "eligibility": ["All farmers", "Apply at nearest agriculture office"],
        "apply_link": "https://soilhealth.dac.gov.in/",
        "status": "Active",
        "color": "brown",
        "icon": "soil",
        "applicable_states": [],
        "applicable_crops": [],
        "max_land_acres": None,
    },
    {
        "id": "kcc",
        "name": "Kisan Credit Card (KCC)",
        "ministry": "Ministry of Finance",
        "description": "Easy credit access for farming needs at low interest",
        "benefits": [
            "Low interest rate (4%)",
            "Flexible repayment",
            "Credit up to Rs.3 lakh",
        ],
        "eligibility": ["All farmers, sharecroppers, tenant farmers"],
        "apply_link": "https://www.nabard.org/",
        "status": "Active",
        "color": "purple",
        "icon": "credit-card",
        "applicable_states": [],
        "applicable_crops": [],
        "max_land_acres": None,
    },
    {
        "id": "e-nam",
        "name": "e-NAM (National Agriculture Market)",
        "ministry": "Ministry of Agriculture",
        "description": "Online trading platform for agricultural commodities",
        "benefits": [
            "Better price discovery",
            "Transparent auction",
            "Pan-India market access",
        ],
        "eligibility": ["All farmers with Aadhaar", "Register through local mandi"],
        "apply_link": "https://enam.gov.in/",
        "status": "Active",
        "color": "orange",
        "icon": "market",
        "applicable_states": [],
        "applicable_crops": [],
        "max_land_acres": None,
    },
    {
        "id": "pkvy",
        "name": "Paramparagat Krishi Vikas Yojana",
        "ministry": "Ministry of Agriculture",
        "description": "Promote organic farming with financial assistance",
        "benefits": [
            "Rs.50,000/hectare over 3 years",
            "Organic certification support",
            "Marketing assistance",
        ],
        "eligibility": [
            "Farmers willing to adopt organic farming",
            "Form cluster of 50+ farmers",
        ],
        "apply_link": "https://pgsindia-ncof.gov.in/",
        "status": "Active",
        "color": "teal",
        "icon": "leaf",
        "applicable_states": [],
        "applicable_crops": [],
        "max_land_acres": None,
    },
]


@router.get("/api/govt-schemes")
async def get_govt_schemes(
    state: Optional[str] = None,
    crop_type: Optional[str] = None,
    current_user: dict = Depends(_get_current_user),
):
    """Get relevant government schemes, filtered by user profile."""
    sb = _get_supabase()
    profile = _get_user_profile(current_user["id"], sb)
    crops = _get_selected_crops(current_user["id"], sb)

    user_state = state or profile.get("state", "")
    user_crops = [c.get("crop_name", "").lower() for c in crops]
    user_land = profile.get("total_acres") or profile.get("land_size")

    # Filter / annotate schemes with eligibility info
    result_schemes = []
    for scheme in GOVT_SCHEMES:
        s = dict(scheme)

        # Check eligibility indicators
        eligible = True
        reasons = []

        if s["max_land_acres"] and user_land:
            try:
                if float(user_land) > s["max_land_acres"]:
                    eligible = False
                    reasons.append(f"Land exceeds {s['max_land_acres']} acres limit")
            except (ValueError, TypeError):
                pass

        if s["applicable_states"] and user_state:
            if user_state.lower() not in [st.lower() for st in s["applicable_states"]]:
                eligible = False
                reasons.append(f"Not available in {user_state}")

        s["eligible"] = eligible
        s["eligibility_notes"] = reasons if reasons else ["You appear eligible"]

        # Remove internal filter fields from response
        del s["applicable_states"]
        del s["applicable_crops"]
        del s["max_land_acres"]

        result_schemes.append(s)

    return {
        "schemes": result_schemes,
        "total_count": len(result_schemes),
        "eligible_count": sum(1 for s in result_schemes if s["eligible"]),
        "filters": {"state": user_state, "crop_type": crop_type},
        "last_updated": datetime.now().isoformat(),
    }


# ==================== FARMING ANALYTICS ====================
@router.get("/api/analytics")
async def get_farming_analytics(
    period: Optional[str] = "month", current_user: dict = Depends(_get_current_user)
):
    """Get real farming analytics from Supabase tables."""
    sb = _get_supabase()
    user_id = current_user["id"]
    now = datetime.now()

    # Determine date range
    if period == "week":
        start_date = (now - timedelta(days=7)).isoformat()
        num_periods = 7
    elif period == "year":
        start_date = (now - timedelta(days=365)).isoformat()
        num_periods = 12
    else:  # month
        start_date = (now - timedelta(days=180)).isoformat()
        num_periods = 6

    # 1. Task completion data (monthly breakdown)
    months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ]
    monthly_data = []

    for i in range(num_periods):
        if period == "week":
            day = now - timedelta(days=num_periods - 1 - i)
            label = day.strftime("%a")
            period_start = day.replace(hour=0, minute=0, second=0).isoformat()
            period_end = day.replace(hour=23, minute=59, second=59).isoformat()
        else:
            month_offset = num_periods - 1 - i
            target = now - timedelta(days=month_offset * 30)
            label = months[target.month - 1]
            period_start = target.replace(day=1, hour=0, minute=0, second=0).isoformat()
            next_month = target.replace(day=28) + timedelta(days=4)
            period_end = (
                (next_month.replace(day=1) - timedelta(days=1))
                .replace(hour=23, minute=59, second=59)
                .isoformat()
            )

        # Count tasks for this period
        try:
            total_res = (
                sb.table("daily_tasks")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .gte("scheduled_date", period_start[:10])
                .lte("scheduled_date", period_end[:10])
                .execute()
            )
            completed_res = (
                sb.table("daily_tasks")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .eq("completed", True)
                .gte("scheduled_date", period_start[:10])
                .lte("scheduled_date", period_end[:10])
                .execute()
            )

            total_tasks = total_res.count or 0
            completed_tasks = completed_res.count or 0
            completion_rate = int(
                (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            )
        except Exception:
            total_tasks = 0
            completed_tasks = 0
            completion_rate = 0

        monthly_data.append(
            {
                "month": label,
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "completion_rate": completion_rate,
            }
        )

    # 2. Crop performance from selected_crops
    crops = _get_selected_crops(user_id, sb)
    crop_performance = []
    for c in crops:
        crop_name = c.get("crop_name", "Unknown")
        score = c.get("suitability_score") or c.get("health_score") or 0
        try:
            score = int(float(score))
        except (ValueError, TypeError):
            score = 0

        status = (
            "excellent"
            if score >= 85
            else "good"
            if score >= 60
            else "moderate"
            if score >= 40
            else "below_target"
        )
        crop_performance.append(
            {
                "crop": crop_name,
                "yield": score,
                "target": 100,
                "status": status,
            }
        )

    # 3. Activity counts
    try:
        rec_res = (
            sb.table("crop_recommendations")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .gte("created_at", start_date)
            .execute()
        )
        recommendations_count = rec_res.count or 0
    except Exception:
        recommendations_count = 0

    try:
        diag_res = (
            sb.table("disease_diagnoses")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .gte("created_at", start_date)
            .execute()
        )
        diagnoses_count = diag_res.count or 0
    except Exception:
        diagnoses_count = 0

    # 4. Generate real insights
    insights = []
    if crop_performance:
        best_crop = max(crop_performance, key=lambda x: x["yield"])
        if best_crop["yield"] >= 80:
            insights.append(
                f"Your {best_crop['crop']} crop has a strong suitability score of {best_crop['yield']}%."
            )
    if monthly_data:
        recent = monthly_data[-1]
        if recent["completion_rate"] >= 80:
            insights.append(
                f"Great work! You completed {recent['completion_rate']}% of tasks this period."
            )
        elif recent["completion_rate"] < 50 and recent["total_tasks"] > 0:
            insights.append(
                f"Task completion is at {recent['completion_rate']}%. Try to complete more daily tasks for better crop health."
            )
    if recommendations_count > 0:
        insights.append(
            f"You've received {recommendations_count} crop recommendations this period."
        )
    if not insights:
        insights.append(
            "Start completing tasks and adding crops to see personalized insights."
        )

    total_completed = sum(d["completed_tasks"] for d in monthly_data)
    total_tasks_all = sum(d["total_tasks"] for d in monthly_data)

    return {
        "summary": {
            "total_tasks": total_tasks_all,
            "completed_tasks": total_completed,
            "overall_completion_rate": int(
                (total_completed / total_tasks_all * 100) if total_tasks_all > 0 else 0
            ),
            "crops_active": len(crop_performance),
            "recommendations": recommendations_count,
            "diagnoses": diagnoses_count,
        },
        "monthly_data": monthly_data,
        "crop_performance": crop_performance,
        "insights": insights,
        "period": period,
        "generated_at": datetime.now().isoformat(),
    }


# ==================== FARMING TIPS ====================

# Tip generation cache: {user_id: {"tips": [...], "generated_at": datetime}}
_tips_cache: Dict[str, Dict] = {}


@router.get("/api/farming-tips")
async def get_farming_tips(
    crop: Optional[str] = None,
    season: Optional[str] = None,
    current_user: dict = Depends(_get_current_user),
):
    """Get personalized farming tips. Uses LLM for personalization with static fallback."""
    sb = _get_supabase()
    user_id = current_user["id"]
    profile = _get_user_profile(user_id, sb)
    crops = _get_selected_crops(user_id, sb)

    crop_names = [c.get("crop_name", "") for c in crops]
    user_state = profile.get("state", "")

    now = datetime.now()
    current_month = now.month
    current_season = (
        "Rabi"
        if current_month in [10, 11, 12, 1, 2, 3]
        else "Kharif"
        if current_month in [6, 7, 8, 9]
        else "Zaid"
    )

    # Check cache (24h TTL)
    cache_key = user_id
    if cache_key in _tips_cache:
        cached = _tips_cache[cache_key]
        age = (now - cached["generated_at"]).total_seconds()
        if age < 86400:  # 24 hours
            return cached["result"]

    # Try LLM-generated tips
    generated_tips = []
    try:
        from voice_service.llm_service import llm_service

        context = {
            "crops": crop_names,
            "season": current_season,
            "state": user_state,
            "month": now.strftime("%B"),
        }
        prompt = (
            f"Generate exactly 4 practical farming tips for an Indian farmer in {user_state or 'India'} "
            f"growing {', '.join(crop_names) if crop_names else 'general crops'} during {current_season} season ({now.strftime('%B')}). "
            f"Each tip should be 1-2 sentences, actionable, and specific to the crop/season. "
            f"Return plain text with tips separated by newlines. No numbering, no bullets, no markdown."
        )
        result = await llm_service.generate_response(
            role="query_answerer",
            context=context,
            user_query=prompt,
        )
        tip_text = result.get("speech", "")
        if tip_text:
            lines = [
                l.strip()
                for l in tip_text.split("\n")
                if l.strip() and len(l.strip()) > 10
            ]
            categories = [
                "irrigation",
                "pest_management",
                "soil_management",
                "planning",
                "weather",
                "harvest",
            ]
            for i, line in enumerate(lines[:6]):
                # Strip leading numbers/bullets
                clean = line.lstrip("0123456789.-) ").strip()
                if clean:
                    generated_tips.append(
                        {
                            "id": f"ai_tip_{i + 1}",
                            "title": clean[:60] + ("..." if len(clean) > 60 else ""),
                            "content": clean,
                            "category": categories[i % len(categories)],
                            "priority": "high" if i < 2 else "medium",
                            "source": "AI Generated",
                        }
                    )
    except Exception as e:
        logger.warning(f"LLM tip generation failed: {e}")

    # Static fallback tips (always included as backup)
    static_tips = [
        {
            "id": "tip1",
            "title": "Water Early Morning",
            "content": "Water your crops between 6-8 AM to reduce evaporation and allow plants to absorb moisture before the heat of the day.",
            "category": "irrigation",
            "priority": "high",
            "source": "Best Practice",
        },
        {
            "id": "tip2",
            "title": "Check for Pests Weekly",
            "content": "Inspect the undersides of leaves for pest eggs and early infestations. Early detection prevents major damage.",
            "category": "pest_management",
            "priority": "medium",
            "source": "Best Practice",
        },
        {
            "id": "tip3",
            "title": "Mulching Benefits",
            "content": "Apply organic mulch around plants to retain soil moisture, regulate temperature, and suppress weeds naturally.",
            "category": "soil_management",
            "priority": "medium",
            "source": "Best Practice",
        },
        {
            "id": "tip4",
            "title": "Crop Rotation",
            "content": "Rotate crops each season to prevent soil depletion and reduce pest/disease buildup in the soil.",
            "category": "planning",
            "priority": "high",
            "source": "Best Practice",
        },
        {
            "id": "tip5",
            "title": "Weather Alert Check",
            "content": "Check weather forecast before applying fertilizers or pesticides. Rain can wash away applications.",
            "category": "weather",
            "priority": "high",
            "source": "Best Practice",
        },
        {
            "id": "tip6",
            "title": "Soil pH Testing",
            "content": "Test your soil pH annually. Most crops prefer pH 6.0-7.0. Adjust with lime or sulfur as needed.",
            "category": "soil_management",
            "priority": "low",
            "source": "Best Practice",
        },
    ]

    # Use AI tips if available, otherwise static
    all_tips = generated_tips if generated_tips else static_tips

    # Tip of the day
    day_of_year = now.timetuple().tm_yday
    tip_of_day = all_tips[day_of_year % len(all_tips)]

    result = {
        "tip_of_day": tip_of_day,
        "all_tips": all_tips,
        "categories": [
            "irrigation",
            "pest_management",
            "soil_management",
            "planning",
            "weather",
        ],
        "personalized": bool(generated_tips),
        "user_crops": crop_names,
        "season": current_season,
        "filters": {"crop": crop, "season": season},
        "date": now.strftime("%Y-%m-%d"),
    }

    # Cache
    _tips_cache[cache_key] = {"result": result, "generated_at": now}

    return result
