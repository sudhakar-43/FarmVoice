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

    CSV_PATH = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "data", "soil_data.csv"
    )

    def __init__(self):
        self.local_db = self._load_local_db()

    def _load_local_db(self) -> Dict[str, Dict[str, Any]]:
        db = {}
        if os.path.exists(self.CSV_PATH):
            try:
                with open(self.CSV_PATH, "r") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        # Key by district lower case
                        key = row["district"].lower()
                        db[key] = row
            except Exception as e:
                logger.error(f"Failed to load soil CSV: {e}")
        return db

    async def get_soil_data(
        self, lat: float, lon: float, district: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get soil data.
        1. Try district-based lookup from CSV (high-quality curated data for Indian districts).
        2. Try SoilGrids ISRIC REST API for lat/lon based data.
        3. Fallback to generic regional average.
        """

        # Priority 1: District-based CSV lookup (best quality for Indian regions)
        if district:
            district_key = district.lower()
            if district_key in self.local_db:
                data = self.local_db[district_key]
                return {
                    "soil_type": data["soil_type"],
                    "ph": float(data["ph"]),
                    "nitrogen": data["nitrogen"],
                    "phosphorus": data["phosphorus"],
                    "potassium": data["potassium"],
                    "organic_carbon": float(data["organic_carbon"]),
                    "_provenance": "local_csv",
                }

        # Priority 2: SoilGrids ISRIC API (lat/lon based)
        if lat and lon:
            soilgrids_data = await self._fetch_soilgrids(lat, lon)
            if soilgrids_data:
                return soilgrids_data

        # Priority 3: Fallback if nothing else works
        return self._get_fallback_data()

    async def _fetch_soilgrids(
        self, lat: float, lon: float
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch soil properties from the ISRIC SoilGrids REST API.
        See: https://rest.isric.org/soilgrids/v2.0/docs

        Returns parsed soil data or None on failure.
        """
        base_url = "https://rest.isric.org/soilgrids/v2.0/properties/query"

        # Request key soil properties at 0-30cm depth
        params = {
            "lon": lon,
            "lat": lat,
            "property": ["phh2o", "soc", "nitrogen", "clay", "sand", "silt"],
            "depth": "0-30cm",
            "value": "mean",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(base_url, params=params)

                if response.status_code != 200:
                    logger.warning(
                        f"SoilGrids API returned status {response.status_code}"
                    )
                    return None

                data = response.json()
                properties = data.get("properties", {}).get("layers", [])

                if not properties:
                    logger.warning("SoilGrids API returned no layers")
                    return None

                # Parse the layers into a structured response
                soil_props: Dict[str, Any] = {}
                for layer in properties:
                    name = layer.get("name", "")
                    depths = layer.get("depths", [])
                    if depths:
                        values = depths[0].get("values", {})
                        mean_val = values.get("mean")
                        if mean_val is not None:
                            soil_props[name] = mean_val

                # Map SoilGrids properties to our schema
                # phh2o is in pH*10 units, soc in dg/kg, nitrogen in cg/kg
                ph_raw = soil_props.get("phh2o")
                soc_raw = soil_props.get("soc")
                nitrogen_raw = soil_props.get("nitrogen")
                clay = soil_props.get("clay", 0)
                sand = soil_props.get("sand", 0)
                silt = soil_props.get("silt", 0)

                # Derive soil type from texture
                soil_type = self._classify_soil_texture(clay, sand, silt)

                ph = round(ph_raw / 10.0, 1) if ph_raw else 7.0
                organic_carbon = (
                    round(soc_raw / 10.0, 2) if soc_raw else 0.5
                )  # dg/kg -> g/kg

                # Classify nitrogen level
                nitrogen_level = "Medium"
                if nitrogen_raw is not None:
                    n_gkg = nitrogen_raw / 100.0  # cg/kg -> g/kg
                    if n_gkg < 0.5:
                        nitrogen_level = "Low"
                    elif n_gkg > 1.5:
                        nitrogen_level = "High"

                return {
                    "soil_type": soil_type,
                    "ph": ph,
                    "nitrogen": nitrogen_level,
                    "phosphorus": "Medium",  # Not available from SoilGrids free tier
                    "potassium": "Medium",  # Not available from SoilGrids free tier
                    "organic_carbon": organic_carbon,
                    "_provenance": "soilgrids_api",
                }

        except httpx.TimeoutException:
            logger.warning("SoilGrids API request timed out")
            return None
        except Exception as e:
            logger.error(f"SoilGrids API error: {e}")
            return None

    @staticmethod
    def _classify_soil_texture(clay: float, sand: float, silt: float) -> str:
        """Classify soil texture based on USDA texture triangle (simplified)."""
        # Values from SoilGrids are in g/kg, convert to percentages
        total = clay + sand + silt
        if total == 0:
            return "Loamy"

        clay_pct = (clay / total) * 100
        sand_pct = (sand / total) * 100

        if clay_pct > 40:
            return "Clayey"
        elif sand_pct > 65:
            return "Sandy"
        elif clay_pct > 25 and sand_pct < 50:
            return "Clay Loam"
        elif sand_pct > 50:
            return "Sandy Loam"
        else:
            return "Loamy"

    def _get_fallback_data(self) -> Dict[str, Any]:
        return {
            "soil_type": "Loamy",
            "ph": 7.0,
            "nitrogen": "Medium",
            "phosphorus": "Medium",
            "potassium": "Medium",
            "organic_carbon": 0.5,
            "_provenance": "fallback_generic",
        }


soil_service = SoilService()
