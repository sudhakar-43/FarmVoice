import csv
import logging
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MarketService:
    """
    Service to fetch market prices.
    Uses local CSV database as a reliable source of 'cached' real data.
    """
    
    CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "market_data.csv")
    
    def __init__(self):
        self.prices = self._load_prices()

    def _load_prices(self) -> List[Dict[str, Any]]:
        prices = []
        if os.path.exists(self.CSV_PATH):
            try:
                with open(self.CSV_PATH, 'r') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        prices.append(row)
            except Exception as e:
                logger.error(f"Failed to load market CSV: {e}")
        return prices

    async def get_prices(self, state: Optional[str] = None, district: Optional[str] = None, crop: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get market prices filtered by state, district, and crop.
        """
        results = self.prices
        
        if state:
            results = [p for p in results if p['state'].lower() == state.lower()]
        
        if district:
            results = [p for p in results if p['district'].lower() == district.lower()]
            
        if crop:
            results = [p for p in results if crop.lower() in p['commodity'].lower()]
            
        # Add provenance
        for r in results:
            r['_provenance'] = 'local_csv'
            
        return results

    async def get_trends(self, commodity: str, district: str) -> Dict[str, Any]:
        """
        Compute price trends (simulated for now based on single data point).
        In a real system, this would analyze historical data.
        """
        prices = await self.get_prices(district=district, crop=commodity)
        if not prices:
            return {"trend": "stable", "change_percent": 0}
            
        # Simple logic: if price is high (> average), trend is up? 
        # Without history, we just return stable.
        return {"trend": "stable", "change_percent": 0}

market_service = MarketService()
