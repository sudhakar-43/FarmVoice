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
    PINCODE_API = "https://api.postalpincode.in/pincode/{}"
    NOMINATIM_API = "https://nominatim.openstreetmap.org/search"
    CACHE_FILE = "weather_cache.json"
    CACHE_TTL = 900  # 15 minutes for better performance
    PINCODE_CACHE_TTL = 86400  # 24 hours for pincode to coordinates

    def __init__(self):
        self.cache = self._load_cache()
        self.pincode_cache = {}  # In-memory cache for pincode coordinates

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

    async def get_coordinates_from_pincode(self, pincode: str) -> tuple:
        """
        Convert Indian pincode to lat/lon coordinates.
        Uses India Post API to get district/state, then Nominatim for geocoding.
        """
        cache_key = f"pincode_{pincode}"
        
        # Check pincode cache
        if cache_key in self.pincode_cache:
            cached = self.pincode_cache[cache_key]
            if (datetime.now().timestamp() - cached.get('timestamp', 0)) < self.PINCODE_CACHE_TTL:
                logger.info(f"Returning cached coordinates for pincode {pincode}")
                return cached['lat'], cached['lon']
        
        try:
            async with httpx.AsyncClient() as client:
                # Step 1: Get location info from India Post API
                response = await client.get(self.PINCODE_API.format(pincode), timeout=5.0)
                data = response.json()
                
                if not data or data[0].get('Status') != 'Success':
                    logger.warning(f"Invalid pincode: {pincode}")
                    raise ValueError(f"Invalid pincode: {pincode}")
                
                post_office = data[0]['PostOffice'][0]
                district = post_office.get('District', '')
                state = post_office.get('State', '')
                
                logger.info(f"Pincode {pincode} => District: {district}, State: {state}")
                
                # Step 2: Geocode using OpenStreetMap Nominatim
                geo_params = {
                    "q": f"{district}, {state}, India",
                    "format": "json",
                    "limit": 1
                }
                geo_response = await client.get(
                    self.NOMINATIM_API, 
                    params=geo_params,
                    headers={"User-Agent": "FarmVoice/1.0 (Agricultural App)"},
                    timeout=5.0
                )
                geo_data = geo_response.json()
                
                if geo_data:
                    lat = float(geo_data[0]['lat'])
                    lon = float(geo_data[0]['lon'])
                    
                    # Cache the result
                    self.pincode_cache[cache_key] = {
                        'lat': lat,
                        'lon': lon,
                        'district': district,
                        'state': state,
                        'timestamp': datetime.now().timestamp()
                    }
                    
                    logger.info(f"Pincode {pincode} coordinates: {lat}, {lon}")
                    return lat, lon
                
                raise ValueError(f"Could not geocode pincode: {pincode}")
                
        except Exception as e:
            # Return default India center coordinates
            return 20.59, 78.96

    async def get_coordinates(self, location: str) -> tuple:
        """
        Geocode a location name (city, town, etc.) to lat/lon.
        """
        try:
             async with httpx.AsyncClient() as client:
                geo_params = {
                    "q": f"{location}, India", # Bias towards India for this app
                    "format": "json",
                    "limit": 1
                }
                geo_response = await client.get(
                    self.NOMINATIM_API, 
                    params=geo_params,
                    headers={"User-Agent": "FarmVoice/1.0 (Agricultural App)"},
                    timeout=5.0
                )
                geo_data = geo_response.json()
                
                if geo_data:
                    lat = float(geo_data[0]['lat'])
                    lon = float(geo_data[0]['lon'])
                    logger.info(f"Geocoded '{location}' to {lat}, {lon}")
                    return lat, lon
                
                logger.warning(f"Could not geocode location: {location}")
                return 20.59, 78.96
        except Exception as e:
            logger.error(f"Geocoding error for {location}: {e}")
            return 20.59, 78.96

    async def reverse_geocode(self, lat: float, lon: float) -> Dict[str, str]:
        """
        Convert lat/lon to readable address (City, State, District).
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "format": "json",
                    "lat": lat,
                    "lon": lon,
                    "zoom": 10
                }
                # Nominatim endpoint for reverse already matches search but with different params or use /reverse
                # Note: The class defined NOMINATIM_API as .../search. We need .../reverse
                reverse_url = "https://nominatim.openstreetmap.org/reverse"
                
                response = await client.get(
                    reverse_url, 
                    params=params, 
                    headers={"User-Agent": "FarmVoice/1.0 (Agricultural App)"},
                    timeout=5.0
                )
                data = response.json()
                
                if not data or "address" not in data:
                    return {}

                address = data["address"]
                
                # Extract most relevant parts
                city = address.get("city") or address.get("town") or address.get("village") or address.get("county") or ""
                state = address.get("state", "")
                district = address.get("state_district", "")
                
                location_name = f"{city}, {state}".strip(", ")
                
                logger.info(f"Reverse geocoded {lat},{lon} to: {location_name}")
                
                return {
                    "location_name": location_name,
                    "city": city,
                    "state": state,
                    "district": district
                }
                
        except Exception as e:
            logger.error(f"Reverse geocoding failed: {e}")
            return {}

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
                "current": ["temperature_2m", "relative_humidity_2m", "precipitation", "rain", "wind_speed_10m", "is_day"],
                "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "rain_sum", "wind_speed_10m_max", "sunrise", "sunset", "precipitation_probability_max"],
                "hourly": ["temperature_2m", "relative_humidity_2m", "precipitation_probability", "wind_speed_10m", "is_day"],
                "timezone": "auto",
                "forecast_days": 5,
                "forecast_hours": 24
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
        hourly = raw_data.get('hourly', {})
        
        # Get today's sunrise/sunset
        sunrise = daily.get('sunrise', ['06:00'])[0] if daily.get('sunrise') else '06:00'
        sunset = daily.get('sunset', ['18:00'])[0] if daily.get('sunset') else '18:00'
        is_day = current.get('is_day', 1) == 1
        
        # Process hourly (next 24 hours)
        hourly_forecast = []
        for i, time in enumerate(hourly.get('time', [])[:24]):
            hourly_forecast.append({
                "time": time,
                "temperature": hourly.get('temperature_2m', [])[i] if i < len(hourly.get('temperature_2m', [])) else 25,
                "humidity": hourly.get('relative_humidity_2m', [])[i] if i < len(hourly.get('relative_humidity_2m', [])) else 60,
                "precipitation_prob": hourly.get('precipitation_probability', [])[i] if i < len(hourly.get('precipitation_probability', [])) else 0,
                "wind_speed": hourly.get('wind_speed_10m', [])[i] if i < len(hourly.get('wind_speed_10m', [])) else 5,
                "is_day": hourly.get('is_day', [])[i] == 1 if i < len(hourly.get('is_day', [])) else True
            })
        
        return {
            "current": {
                "temp_c": current.get('temperature_2m'),
                "humidity": current.get('relative_humidity_2m'),
                "precip_mm": current.get('precipitation'),
                "wind_kph": current.get('wind_speed_10m'),
                "is_day": is_day
            },
            "sunrise": sunrise,
            "sunset": sunset,
            "is_night": not is_day,
            "hourly_forecast": hourly_forecast,
            "forecast": [
                {
                    "date": date,
                    "max_temp": daily['temperature_2m_max'][i],
                    "min_temp": daily['temperature_2m_min'][i],
                    "precip_mm": daily['precipitation_sum'][i],
                    "wind_max_kph": daily['wind_speed_10m_max'][i],
                    "rain_probability": daily.get('precipitation_probability_max', [])[i] if i < len(daily.get('precipitation_probability_max', [])) else 0
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
