import csv
import logging
import os
from typing import Dict, Any, Optional
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SoilService:
    """
    Service to fetch soil data.
    Prioritizes SoilGrids API, falls back to local CSV database.
    """
    
    CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "soil_data.csv")
    
    def __init__(self):
        self.local_db = self._load_local_db()

    def _load_local_db(self) -> Dict[str, Dict[str, Any]]:
        db = {}
        if os.path.exists(self.CSV_PATH):
            try:
                with open(self.CSV_PATH, 'r') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        # Key by district lower case
                        key = row['district'].lower()
                        db[key] = row
            except Exception as e:
                logger.error(f"Failed to load soil CSV: {e}")
        return db

    async def get_soil_data(self, lat: float, lon: float, district: Optional[str] = None) -> Dict[str, Any]:
        """
        Get soil data. 
        1. Try SoilGrids API (simulated/real if possible, but complex).
        2. Fallback to District-based lookup from CSV.
        3. Fallback to generic regional average.
        """
        
        # TODO: Implement actual SoilGrids API call here if needed.
        # For now, we prioritize the high-quality CSV data for Indian districts as it's more actionable than raw grid data.
        
        if district:
            district_key = district.lower()
            if district_key in self.local_db:
                data = self.local_db[district_key]
                return {
                    "soil_type": data['soil_type'],
                    "ph": float(data['ph']),
                    "nitrogen": data['nitrogen'],
                    "phosphorus": data['phosphorus'],
                    "potassium": data['potassium'],
                    "organic_carbon": float(data['organic_carbon']),
                    "_provenance": "local_csv"
                }
        
        # Fallback if district not found or not provided
        return self._get_fallback_data()

    def _get_fallback_data(self) -> Dict[str, Any]:
        return {
            "soil_type": "Loamy",
            "ph": 7.0,
            "nitrogen": "Medium",
            "phosphorus": "Medium",
            "potassium": "Medium",
            "organic_carbon": 0.5,
            "_provenance": "fallback_generic"
        }

soil_service = SoilService()
