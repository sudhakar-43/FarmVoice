import httpx
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WeatherService:
    """
    Service to fetch weather data from Open-Meteo API.
    Implements caching and fallback to local real data.
    """
    
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    CACHE_FILE = "weather_cache.json"
    CACHE_TTL = 60  # seconds (from ENV default)

    def __init__(self):
        self.cache = self._load_cache()

    def _load_cache(self) -> Dict[str, Any]:
        if os.path.exists(self.CACHE_FILE):
            try:
                with open(self.CACHE_FILE, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load weather cache: {e}")
        return {}

    def _save_cache(self):
        try:
            with open(self.CACHE_FILE, 'w') as f:
                json.dump(self.cache, f)
        except Exception as e:
            logger.error(f"Failed to save weather cache: {e}")

    async def get_current_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Get current weather and short-term forecast.
        """
        cache_key = f"{lat:.2f}_{lon:.2f}"
        
        # Check cache
        if cache_key in self.cache:
            cached_entry = self.cache[cache_key]
            if (datetime.now().timestamp() - cached_entry['timestamp']) < self.CACHE_TTL:
                logger.info(f"Returning cached weather for {cache_key}")
                cached_entry['data']['_provenance'] = 'cached'
                return cached_entry['data']

        # Fetch live data
        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "current": ["temperature_2m", "relative_humidity_2m", "precipitation", "rain", "wind_speed_10m"],
                "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "rain_sum", "wind_speed_10m_max"],
                "timezone": "auto",
                "forecast_days": 10
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(self.BASE_URL, params=params, timeout=5.0)
                response.raise_for_status()
                data = response.json()
                
                # Process and structure data
                processed_data = self._process_weather_data(data)
                processed_data['_provenance'] = 'live'
                
                # Update cache
                self.cache[cache_key] = {
                    'timestamp': datetime.now().timestamp(),
                    'data': processed_data
                }
                self._save_cache()
                
                return processed_data
                
        except Exception as e:
            logger.error(f"Failed to fetch weather: {e}")
            # Return cached data if available (even if expired) or fallback
            if cache_key in self.cache:
                logger.warning(f"Returning stale cache for {cache_key}")
                data = self.cache[cache_key]['data']
                data['_provenance'] = 'cached_stale'
                return data
            
            # Fallback to a generic "safe" weather object derived from real averages if absolutely nothing else
            # In a real scenario, we might load a CSV of monthly averages for the region.
            # For now, we return a minimal structure marked as fallback.
            return self._get_fallback_data()

    def _process_weather_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Open-Meteo response to our internal format."""
        current = raw_data.get('current', {})
        daily = raw_data.get('daily', {})
        
        return {
            "current": {
                "temp_c": current.get('temperature_2m'),
                "humidity": current.get('relative_humidity_2m'),
                "precip_mm": current.get('precipitation'),
                "wind_kph": current.get('wind_speed_10m')
            },
            "forecast": [
                {
                    "date": date,
                    "max_temp": daily['temperature_2m_max'][i],
                    "min_temp": daily['temperature_2m_min'][i],
                    "precip_mm": daily['precipitation_sum'][i],
                    "wind_max_kph": daily['wind_speed_10m_max'][i]
                }
                for i, date in enumerate(daily.get('time', []))
            ]
        }

    def _get_fallback_data(self) -> Dict[str, Any]:
        """Return a safe fallback structure."""
        return {
            "_provenance": "fallback_minimal",
            "current": {
                "temp_c": 25.0,
                "humidity": 60,
                "precip_mm": 0.0,
                "wind_kph": 5.0
            },
            "forecast": []
        }

weather_service = WeatherService()
