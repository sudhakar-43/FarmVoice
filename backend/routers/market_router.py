from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from services.market_service import market_service
from voice_service.llm_service import llm_service

router = APIRouter()

class MarketRequest(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    crop: Optional[str] = None
    filter_updated: Optional[str] = "today" # today, 7d, 30d

@router.post("/api/market")
async def get_market_data(request: MarketRequest):
    """
    Get market prices and analysis.
    """
    # 1. Get Prices
    prices = await market_service.get_prices(request.state, request.district, request.crop)
    
    # 2. Get Trends (for top items)
    trends = {}
    if prices:
        top_crop = prices[0]['commodity']
        trends = await market_service.get_trends(top_crop, request.district or "")
        
    # 3. LLM Analysis (Optional, can be triggered by UI or Voice)
    # For this endpoint, we might just return data, but let's add a short summary if requested
    # summary = await llm_service.generate_response("market", {"prices": prices[:3], "trends": trends})
    
    return {
        "prices": prices,
        "trends": trends,
        # "analysis": summary
    }
