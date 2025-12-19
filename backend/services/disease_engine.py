import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class DiseaseEngine:
    """
    Deterministic engine for disease risk calculation.
    """
    
    def calculate_risk(self, crop: str, weather: Dict[str, Any], soil: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate disease risk score based on inputs.
        Returns: {score: int, level: str, factors: List[str]}
        """
        score = 0
        factors = []
        
        # 1. Humidity Factor (Rain + RH)
        current_weather = weather.get('current', {})
        humidity = current_weather.get('humidity', 50)
        precip = current_weather.get('precip_mm', 0)
        
        if humidity > 80 or precip > 5:
            score += 3
            factors.append("High humidity/rain")
        elif humidity > 60:
            score += 1
            
        # 2. Temperature Factor
        temp = current_weather.get('temp_c', 25)
        if 20 <= temp <= 30: # Ideal for many fungi
            score += 2
            factors.append("Optimal fungal temp")
            
        # 3. Soil Factor
        ph = soil.get('ph', 7.0)
        if ph < 5.5 or ph > 8.0:
            score += 1
            factors.append("Soil pH stress")
            
        # Determine Level
        if score >= 5:
            level = "High"
        elif score >= 3:
            level = "Medium"
        else:
            level = "Low"
            
        return {
            "score": score,
            "level": level,
            "factors": factors,
            "advice": self._get_advice(level, crop)
        }

    def _get_advice(self, level: str, crop: str) -> str:
        if level == "High":
            return f"High risk of fungal diseases in {crop}. Monitor closely and consider preventative spray."
        elif level == "Medium":
            return f"Moderate disease risk. Keep {crop} field clean and ensure good drainage."
        else:
            return "Low disease risk currently. Continue routine monitoring."

disease_engine = DiseaseEngine()
