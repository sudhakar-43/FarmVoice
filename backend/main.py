from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from web_scraper import get_pincode_data, get_location_data_from_coords, get_fallback_weather, get_market_prices_for_location
from crop_recommender import recommend_crops as get_crop_recommendations, check_crop_suitability
from notification_service import generate_all_notifications

load_dotenv()

app = FastAPI(title="FarmVoice API", version="1.0.0")

# CORS Configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Configuration
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

supabase: Client = create_client(supabase_url, supabase_key)

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class CropRecommendationRequest(BaseModel):
    soil_type: str
    climate: str
    season: str

class CropRecommendation(BaseModel):
    name: str
    suitability: int
    description: str
    benefits: List[str]

class DiseaseDiagnosisRequest(BaseModel):
    crop: str
    symptoms: str
    image_url: Optional[str] = None

class DiseaseDiagnosis(BaseModel):
    name: str
    severity: str
    description: str
    treatment: List[str]
    prevention: List[str]

class VoiceQuery(BaseModel):
    query: str

class VoiceResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = None

class FarmerProfile(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location_address: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    acres_of_land: Optional[float] = None
    location_permission: Optional[bool] = False
    microphone_permission: Optional[bool] = False
    onboarding_completed: Optional[bool] = False

class PincodeRequest(BaseModel):
    pincode: str

class CropNameRequest(BaseModel):
    crop_name: str
    pincode: Optional[str] = None

class CropSelectRequest(BaseModel):
    crop_name: Optional[str] = None
    name: Optional[str] = None
    crop_variety: Optional[str] = None
    planting_date: Optional[str] = None
    acres_allocated: Optional[float] = None
    suitability_score: Optional[int] = None
    is_suitable: Optional[bool] = True
    crop_details: Optional[dict] = None
    farming_guide: Optional[dict] = None
    disease_predictions: Optional[List[dict]] = None
    profit_estimation: Optional[dict] = None

# Helper Functions
def truncate_password(password: str, max_bytes: int = 72) -> str:
    """Truncate password to max_bytes to comply with bcrypt's 72-byte limit"""
    if not password:
        return password
    
    password_bytes = password.encode('utf-8')
    if len(password_bytes) <= max_bytes:
        return password
    
    # Truncate to max_bytes, ensuring we don't break UTF-8 sequences
    truncated_bytes = password_bytes[:max_bytes]
    
    # Find the last complete UTF-8 character
    while truncated_bytes:
        try:
            return truncated_bytes.decode('utf-8')
        except UnicodeDecodeError:
            # Remove the last byte and try again
            truncated_bytes = truncated_bytes[:-1]
    
    # Fallback: return empty string if all bytes are invalid
    return ""

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password with proper truncation handling"""
    if not plain_password or not hashed_password:
        return False
    
    try:
        # Truncate password to 72 bytes (bcrypt limit) before verification
        truncated_password = truncate_password(plain_password)
        if not truncated_password:
            return False
        return pwd_context.verify(truncated_password, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Hash password with proper truncation handling"""
    if not password:
        raise ValueError("Password cannot be empty")
    
    # Validate password length upfront (give user-friendly error)
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        # Truncate with warning
        truncated_password = truncate_password(password)
        if not truncated_password:
            raise ValueError("Password is too long and cannot be processed. Please use a password shorter than 72 characters.")
    else:
        truncated_password = password
    
    try:
        return pwd_context.hash(truncated_password)
    except Exception as e:
        raise ValueError(f"Password hashing failed: {str(e)}")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from Supabase
    try:
        response = supabase.table("users").select("*").eq("email", email).execute()
        if not response.data:
            raise credentials_exception
        return response.data[0]
    except Exception:
        raise credentials_exception

# Routes
@app.get("/")
async def root():
    return {"message": "FarmVoice API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    try:
        # Validate password length upfront
        password_bytes = user_data.password.encode('utf-8')
        if len(password_bytes) > 72:
            raise HTTPException(
                status_code=400, 
                detail="Password is too long. Please use a password with less than 72 characters."
            )
        
        if len(user_data.password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 6 characters long."
            )
        
        # Check if user exists
        existing = supabase.table("users").select("*").eq("email", user_data.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        try:
            hashed_password = get_password_hash(user_data.password)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        
        # Insert user into Supabase
        user_record = {
            "email": user_data.email,
            "password_hash": hashed_password,
            "name": user_data.name or user_data.email.split("@")[0],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = supabase.table("users").insert(user_record).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        user = result.data[0]
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"]}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    try:
        # Validate password length upfront
        password_bytes = user_data.password.encode('utf-8')
        if len(password_bytes) > 72:
            raise HTTPException(
                status_code=400,
                detail="Password is too long. Please use a password with less than 72 characters."
            )
        
        # Get user from Supabase
        response = supabase.table("users").select("*").eq("email", user_data.email).execute()
        
        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = response.data[0]
        
        # Verify password
        if not verify_password(user_data.password, user.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"]}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return current_user

@app.post("/api/crop/recommend", response_model=List[CropRecommendation])
async def recommend_crops(
    request: CropRecommendationRequest,
    current_user: dict = Depends(get_current_user)
):
    # AI-powered crop recommendation logic
    # This is a simplified version - in production, use ML models
    
    recommendations = []
    
    # Simple rule-based recommendations (replace with actual AI model)
    if request.soil_type == "loamy" and request.climate in ["tropical", "subtropical"]:
        recommendations = [
            {
                "name": "Rice",
                "suitability": 95,
                "description": "Excellent for your conditions. High yield potential with proper water management.",
                "benefits": ["High market demand", "Good water tolerance", "Stable prices", "Multiple varieties available"]
            },
            {
                "name": "Wheat",
                "suitability": 88,
                "description": "Well-suited for your region. Good profit margins and export potential.",
                "benefits": ["High nutritional value", "Multiple harvests", "Export potential", "Storage friendly"]
            },
            {
                "name": "Corn",
                "suitability": 82,
                "description": "Suitable with proper irrigation. Growing market demand for feed and industrial use.",
                "benefits": ["Versatile crop", "Animal feed market", "Industrial uses", "Fast growth"]
            }
        ]
    elif request.soil_type == "sandy" and request.climate == "arid":
        recommendations = [
            {
                "name": "Millet",
                "suitability": 90,
                "description": "Drought-resistant crop perfect for arid conditions.",
                "benefits": ["Drought resistant", "Low water requirement", "Nutritious", "Fast growing"]
            },
            {
                "name": "Sorghum",
                "suitability": 85,
                "description": "Excellent for dry climates with minimal water needs.",
                "benefits": ["Drought tolerant", "Multiple uses", "Good yield", "Low maintenance"]
            }
        ]
    else:
        recommendations = [
            {
                "name": "Soybean",
                "suitability": 75,
                "description": "Moderately suitable. Requires careful management and proper soil preparation.",
                "benefits": ["Protein-rich", "Soil improvement", "Export market", "Crop rotation friendly"]
            },
            {
                "name": "Cotton",
                "suitability": 70,
                "description": "Suitable with proper irrigation and pest management.",
                "benefits": ["High value", "Industrial demand", "Export potential", "Long shelf life"]
            }
        ]
    
    # Save recommendation to database
    try:
        supabase.table("crop_recommendations").insert({
            "user_id": current_user["id"],
            "soil_type": request.soil_type,
            "climate": request.climate,
            "season": request.season,
            "recommendations": recommendations,
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception:
        pass  # Don't fail if logging fails
    
    return recommendations

@app.post("/api/disease/diagnose", response_model=DiseaseDiagnosis)
async def diagnose_disease(
    request: DiseaseDiagnosisRequest,
    current_user: dict = Depends(get_current_user)
):
    # AI-powered disease diagnosis
    # In production, use image recognition models
    
    symptoms_lower = request.symptoms.lower()
    
    # Simple rule-based diagnosis (replace with actual AI model)
    if any(word in symptoms_lower for word in ["brown", "spot", "blight", "leaf"]):
        diagnosis = {
            "name": "Leaf Blight",
            "severity": "Moderate",
            "description": "Fungal disease affecting leaves, causing brown spots and wilting. Common in humid conditions.",
            "treatment": [
                "Remove and destroy affected leaves immediately",
                "Apply fungicide (Copper-based or Mancozeb) every 7-10 days",
                "Improve air circulation by pruning",
                "Avoid overhead watering",
                "Apply neem oil as organic alternative"
            ],
            "prevention": [
                "Use disease-resistant varieties",
                "Practice crop rotation",
                "Maintain proper spacing between plants",
                "Monitor regularly for early signs",
                "Keep field clean and weed-free"
            ]
        }
    elif any(word in symptoms_lower for word in ["white", "powdery", "mildew"]):
        diagnosis = {
            "name": "Powdery Mildew",
            "severity": "Low",
            "description": "White powdery growth on leaves and stems, common in humid conditions with poor air circulation.",
            "treatment": [
                "Apply sulfur-based fungicide",
                "Increase air circulation",
                "Reduce humidity if possible",
                "Remove severely affected parts",
                "Use baking soda solution (1 tsp per liter water)"
            ],
            "prevention": [
                "Plant in well-ventilated areas",
                "Avoid overcrowding",
                "Water at base, not leaves",
                "Use resistant varieties",
                "Maintain proper spacing"
            ]
        }
    else:
        diagnosis = {
            "name": "General Plant Stress",
            "severity": "Low",
            "description": "Symptoms suggest general plant stress. Monitor closely and ensure proper care.",
            "treatment": [
                "Ensure adequate watering (not too much or too little)",
                "Check soil pH and nutrients",
                "Provide proper sunlight",
                "Remove any damaged parts",
                "Apply balanced fertilizer"
            ],
            "prevention": [
                "Regular monitoring",
                "Proper irrigation schedule",
                "Balanced nutrition",
                "Pest control",
                "Optimal growing conditions"
            ]
        }
    
    # Save diagnosis to database
    try:
        supabase.table("disease_diagnoses").insert({
            "user_id": current_user["id"],
            "crop": request.crop,
            "symptoms": request.symptoms,
            "diagnosis": diagnosis,
            "image_url": request.image_url,
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception:
        pass
    
    return diagnosis

@app.get("/api/market/prices")
async def get_market_prices(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    pincode: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Get market prices based on location
    # If no location provided, use defaults or user profile location
    
    lat = latitude
    lon = longitude
    
    if not lat and not lon and pincode:
        # Get coords from pincode
        loc_data = await get_pincode_data(pincode)
        if loc_data:
            lat = loc_data.get("latitude")
            lon = loc_data.get("longitude")
    
    # If still no location, try to get from user profile
    if not lat or not lon:
        try:
            profile = supabase.table("farmer_profiles").select("*").eq("user_id", current_user["id"]).execute()
            if profile.data:
                lat = profile.data[0].get("latitude")
                lon = profile.data[0].get("longitude")
        except Exception:
            pass
            
    # Default to central India if still no location
    if not lat or not lon:
        lat = 20.5937
        lon = 78.9629
        
    # Fetch market prices using our scraper/generator
    prices = await get_market_prices_for_location(lat, lon)
    
    return prices

@app.post("/api/voice/query", response_model=VoiceResponse)
async def process_voice_query(
    request: VoiceQuery,
    current_user: dict = Depends(get_current_user)
):
    # Process voice query with Gemini AI
    try:
        import google.generativeai as genai
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            # Fallback to simple keyword matching if no key provided
            return await process_voice_query_fallback(request, current_user)
            
        genai.configure(api_key=api_key)
        
        # Set up the model
        model = genai.GenerativeModel('gemini-pro')
        
        # Context for the AI
        system_context = """
        You are FarmVoice, an intelligent AI assistant for farmers. 
        Your goal is to provide helpful, accurate, and practical advice on farming, crops, diseases, and market prices.
        Keep your responses concise (under 3-4 sentences) as they will be spoken out loud.
        If the user asks about app features, guide them:
        - "Crop Recommendation": for finding suitable crops.
        - "Disease Management": for diagnosing plant issues.
        - "Market Prices": for checking current crop prices.
        """
        
        chat = model.start_chat(history=[])
        response = chat.send_message(f"{system_context}\n\nUser Query: {request.query}")
        
        response_text = response.text
        
        # Generate suggestions based on response (simplified)
        suggestions = ["Ask another question", "Check related feature"]
        
        # Save query to database
        try:
            supabase.table("voice_queries").insert({
                "user_id": current_user["id"],
                "query": request.query,
                "response": response_text,
                "created_at": datetime.now(timezone.utc).isoformat()
            }).execute()
        except Exception:
            pass
        
        return {
            "response": response_text,
            "suggestions": suggestions
        }
        
    except Exception as e:
        print(f"Gemini Error: {e}")
        # Fallback on error
        return await process_voice_query_fallback(request, current_user)

async def process_voice_query_fallback(request: VoiceQuery, current_user: dict):
    # Original simple keyword matching logic
    query_lower = request.query.lower()
    
    response_text = ""
    suggestions = []
    
    if any(word in query_lower for word in ["crop", "recommend", "what to grow"]):
        response_text = "Based on your query, I recommend checking the Crop Recommendation feature. For best results, consider factors like soil type, climate, and water availability. Would you like me to help you with specific crop recommendations?"
        suggestions = ["Check crop recommendations", "View soil requirements"]
    elif any(word in query_lower for word in ["disease", "pest", "sick", "problem"]):
        response_text = "I can help you identify and manage crop diseases. Please describe the symptoms you're seeing, or use the Disease Management feature to get AI-powered diagnosis and treatment recommendations."
        suggestions = ["Open disease management", "Upload plant image"]
    elif any(word in query_lower for word in ["market", "price", "cost", "sell"]):
        response_text = "For current market prices and trends, I recommend checking the Market feature. It provides real-time price information for various crops. What specific crop prices are you interested in?"
        suggestions = ["View market prices", "Check price trends"]
    elif any(word in query_lower for word in ["hello", "hi", "hey"]):
        response_text = "Hello! I'm FarmVoice, your AI farming assistant. I can help you with crop recommendations, disease management, and market information. What would you like to know?"
        suggestions = ["Crop recommendations", "Disease help", "Market prices"]
    else:
        response_text = f"I understand you're asking about: {request.query}. I can help you with crop recommendations, disease management, and market prices. Could you be more specific about what you need?"
        suggestions = ["Crop help", "Disease diagnosis", "Market info"]
    
    # Save query to database
    try:
        supabase.table("voice_queries").insert({
            "user_id": current_user["id"],
            "query": request.query,
            "response": response_text,
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception:
        pass
    
    return {
        "response": response_text,
        "suggestions": suggestions
    }

# New Endpoints for Extended Features

@app.post("/api/farmer/profile")
async def create_or_update_farmer_profile(
    profile: FarmerProfile,
    current_user: dict = Depends(get_current_user)
):
    """Create or update farmer profile"""
    try:
        # Check if profile exists
        existing = supabase.table("farmer_profiles").select("*").eq("user_id", current_user["id"]).execute()
        
        profile_data = {
            "user_id": current_user["id"],
            "full_name": profile.full_name,
            "phone": profile.phone,
            "location_address": profile.location_address,
            "pincode": profile.pincode,
            "latitude": profile.latitude,
            "longitude": profile.longitude,
            "acres_of_land": profile.acres_of_land,
            "location_permission": profile.location_permission,
            "microphone_permission": profile.microphone_permission,
            "onboarding_completed": profile.onboarding_completed,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if existing.data:
            # Update existing profile
            result = supabase.table("farmer_profiles").update(profile_data).eq("user_id", current_user["id"]).execute()
        else:
            # Create new profile
            profile_data["created_at"] = datetime.now(timezone.utc).isoformat()
            result = supabase.table("farmer_profiles").insert(profile_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save profile")
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile update failed: {str(e)}")

@app.get("/api/farmer/profile")
async def get_farmer_profile(current_user: dict = Depends(get_current_user)):
    """Get farmer profile"""
    try:
        response = supabase.table("farmer_profiles").select("*").eq("user_id", current_user["id"]).execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")

@app.post("/api/crop/recommend-by-pincode")
async def recommend_crops_by_pincode(
    request: PincodeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive crop recommendations based on pincode with location, weather, soil, and crop data"""
    try:
        # Validate pincode
        if not request.pincode or len(request.pincode) != 6 or not request.pincode.isdigit():
            raise HTTPException(status_code=400, detail="Invalid pincode. Please provide a 6-digit pincode.")
        
        # Get comprehensive location data from pincode (web scraping from government/public sources)
        location_data = await get_pincode_data(request.pincode)
        
        # Validate location_data
        if not location_data or not isinstance(location_data, dict):
            raise HTTPException(status_code=500, detail="Failed to fetch location data. Please try again.")
        
        # Ensure required fields exist with defaults
        if "soil_type" not in location_data:
            location_data["soil_type"] = "loamy"
        if "climate" not in location_data:
            location_data["climate"] = "subtropical"
        if "weather" not in location_data:
            location_data["weather"] = get_fallback_weather(
                location_data.get("latitude", 20.5937),
                location_data.get("longitude", 78.9629)
            )
        
        # Get AI-powered crop recommendations
        try:
            recommendations = get_crop_recommendations(location_data, limit=10)
        except Exception as rec_error:
            import traceback
            print(f"Error in recommend_crops: {str(rec_error)}")
            print(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(rec_error)}")
        
        # Save to database (optional - don't fail if this fails)
        try:
            # Try to save with location_data, but don't include it if column doesn't exist
            insert_data = {
                "user_id": current_user["id"],
                "pincode": request.pincode,
                "soil_type": location_data.get("soil_type", ""),
                "climate": location_data.get("climate", ""),
                "season": location_data.get("weather", {}).get("season", "auto") if isinstance(location_data.get("weather"), dict) else "auto",
                "recommendations": recommendations,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            # Try to add location_data, but catch error if column doesn't exist
            try:
                insert_data["location_data"] = location_data
                supabase.table("crop_recommendations").insert(insert_data).execute()
            except Exception:
                # If location_data column doesn't exist, insert without it
                del insert_data["location_data"]
                supabase.table("crop_recommendations").insert(insert_data).execute()
        except Exception as db_error:
            # Log but don't fail if database logging fails
            print(f"Warning: Failed to save recommendation to database: {str(db_error)}")
        
        return {
            "pincode": request.pincode,
            "location": {
                "name": location_data.get("display_name", ""),
                "state": location_data.get("state", ""),
                "district": location_data.get("district", ""),
                "city": location_data.get("city", ""),
                "region": location_data.get("region", ""),
                "coordinates": {
                    "latitude": location_data.get("latitude", 0),
                    "longitude": location_data.get("longitude", 0)
                }
            },
            "soil": {
                "type": location_data.get("soil_type", ""),
                "details": location_data.get("soil_details", {})
            },
            "climate": location_data.get("climate", ""),
            "weather": location_data.get("weather", {}),
            "suitable_crops": location_data.get("suitable_crops", []),
            "recommendations": recommendations,
            "data_sources": {
                "location": "OpenStreetMap Nominatim (Free Public API)",
                "weather": "Open-Meteo (Free Public API)",
                "soil": "SoilGrids ISRIC (Free Public Data)",
                "crops": "Government Agricultural Data Patterns"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = str(e)
        print(f"Error getting crop recommendations: {error_detail}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {error_detail}")

@app.get("/api/location/pincode/{pincode}")
async def get_location_by_pincode(
    pincode: str,
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive location data by pincode (location, weather, soil)"""
    try:
        # Validate pincode
        if not pincode or len(pincode) != 6 or not pincode.isdigit():
            raise HTTPException(status_code=400, detail="Invalid pincode. Please provide a 6-digit pincode.")
        
        # Get comprehensive location data
        location_data = await get_pincode_data(pincode)
        
        if not location_data:
            raise HTTPException(status_code=404, detail="Location not found for this pincode.")
        
        return {
            "pincode": pincode,
            "location": {
                "name": location_data.get("display_name", ""),
                "state": location_data.get("state", ""),
                "district": location_data.get("district", ""),
                "city": location_data.get("city", ""),
                "region": location_data.get("region", ""),
                "coordinates": {
                    "latitude": location_data.get("latitude", 0),
                    "longitude": location_data.get("longitude", 0)
                }
            },
            "soil": {
                "type": location_data.get("soil_type", ""),
                "details": location_data.get("soil_details", {})
            },
            "climate": location_data.get("climate", ""),
            "weather": location_data.get("weather", {}),
            "suitable_crops": location_data.get("suitable_crops", []),
            "data_sources": {
                "location": "OpenStreetMap Nominatim (Free Public API)",
                "weather": "Open-Meteo (Free Public API)",
                "soil": "SoilGrids ISRIC (Free Public Data)"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch location data: {str(e)}")

@app.post("/api/crop/check-suitability")
async def check_crop_suitability_endpoint(
    request: CropNameRequest,
    current_user: dict = Depends(get_current_user)
):
    """Check if a crop is suitable for farmer's location with real-time data"""
    try:
        # Get farmer profile to get location
        profile_response = supabase.table("farmer_profiles").select("*").eq("user_id", current_user["id"]).execute()
        
        location_data = None
        pincode = None
        
        if profile_response.data:
            profile = profile_response.data[0]
            pincode = profile.get("pincode")
            
            # Get location data
            if profile.get("latitude") and profile.get("longitude"):
                location_data = await get_location_data_from_coords(
                    profile["latitude"],
                    profile["longitude"]
                )
            elif pincode:
                location_data = await get_pincode_data(pincode)
        
        # If no profile, try to get location from request if pincode provided
        if not location_data and request.pincode:
            location_data = await get_pincode_data(request.pincode)
            pincode = request.pincode
        
        # Fallback: use default location data
        if not location_data:
            location_data = {
                "soil_type": "loamy",
                "climate": "subtropical",
                "region": "central",
                "weather": get_fallback_weather(20.5937, 78.9629)
            }
        
        # Check crop suitability
        result = check_crop_suitability(request.crop_name, location_data)
        
        # Add location data and pincode to result
        result["location_data"] = location_data
        result["pincode"] = pincode
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check suitability: {str(e)}")

@app.post("/api/crop/select")
async def select_crop(
    request: CropSelectRequest,
    current_user: dict = Depends(get_current_user)
):
    """Select a crop and create dashboard"""
    try:
        # Resolve crop name
        crop_name = request.crop_name or request.name
        if not crop_name:
            raise HTTPException(status_code=400, detail="Crop name is required")

        crop_data = {
            "user_id": current_user["id"],
            "crop_name": crop_name,
            "crop_variety": request.crop_variety,
            "planting_date": request.planting_date,
            "acres_allocated": request.acres_allocated,
            "suitability_score": request.suitability_score,
            "is_suitable": request.is_suitable,
            "crop_details": request.crop_details or {},
            "farming_guide": request.farming_guide or {},
            "disease_predictions": request.disease_predictions or {},
            "profit_estimation": request.profit_estimation or {},
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = supabase.table("selected_crops").insert(crop_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to select crop")
        
        # Generate daily tasks for the crop
        await generate_daily_tasks(current_user["id"], result.data[0]["id"], crop_name, request.farming_guide)
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to select crop: {str(e)}")

async def generate_daily_tasks(user_id: str, crop_id: str, crop_name: str, farming_guide: dict):
    """Generate daily tasks for selected crop"""
    try:
        tasks = []
        today = datetime.now(timezone.utc).date()
        
        # Add initial tasks based on farming guide
        if farming_guide:
            # Planting task
            tasks.append({
                "user_id": user_id,
                "crop_id": crop_id,
                "task_name": f"Prepare field for {crop_name}",
                "task_description": "Prepare seedbed and ensure proper soil conditions",
                "task_type": "preparation",
                "scheduled_date": today.isoformat(),
                "priority": "high"
            })
            
            # Watering tasks (weekly for first month)
            for i in range(4):
                task_date = (today + timedelta(days=i*7)).isoformat()
                tasks.append({
                    "user_id": user_id,
                    "crop_id": crop_id,
                    "task_name": f"Water {crop_name} crop",
                    "task_description": farming_guide.get("watering", "Regular watering as per schedule"),
                    "task_type": "watering",
                    "scheduled_date": task_date,
                    "priority": "high"
                })
            
            # Fertilizer task
            tasks.append({
                "user_id": user_id,
                "crop_id": crop_id,
                "task_name": f"Apply fertilizer for {crop_name}",
                "task_description": farming_guide.get("fertilizer", "Apply recommended fertilizers"),
                "task_type": "fertilizing",
                "scheduled_date": (today + timedelta(days=30)).isoformat(),
                "priority": "medium"
            })
        
        # Insert tasks
        if tasks:
            supabase.table("daily_tasks").insert(tasks).execute()
    except Exception as e:
        print(f"Error generating tasks: {e}")

@app.get("/api/tasks")
async def get_daily_tasks(current_user: dict = Depends(get_current_user)):
    """Get daily tasks for farmer, including real-time weather-based tasks"""
    try:
        today = datetime.now(timezone.utc).date().isoformat()
        
        # 1. Fetch scheduled tasks from DB
        response = supabase.table("daily_tasks").select("*").eq("user_id", current_user["id"]).gte("scheduled_date", today).order("scheduled_date").execute()
        db_tasks = response.data or []
        
        # Rename keys to match frontend expectation (task_name -> task, scheduled_date -> date)
        formatted_db_tasks = []
        for t in db_tasks:
            formatted_db_tasks.append({
                "id": t.get("id"),
                "task": t.get("task_name"),
                "date": t.get("scheduled_date"),
                "status": t.get("status", "pending"),
                "priority": t.get("priority", "medium")
            })

        # 2. Fetch user location
        profile_response = supabase.table("farmer_profiles").select("latitude, longitude").eq("user_id", current_user["id"]).execute()
        
        realtime_tasks = []
        if profile_response.data:
            lat = profile_response.data[0].get("latitude")
            lon = profile_response.data[0].get("longitude")
            
            if lat and lon:
                # 3. Fetch weather
                try:
                    from web_scraper import get_weather_data
                    weather = await get_weather_data(lat, lon)
                    
                    # 4. Generate dynamic tasks
                    current_temp = weather.get("current", {}).get("temperature", 0)
                    condition = weather.get("current", {}).get("condition", "").lower()
                    humidity = weather.get("current", {}).get("humidity", 0)
                    wind_speed = weather.get("current", {}).get("wind_speed", 0)
                    
                    # Logic examples
                    if "rain" in condition or "drizzle" in condition or "thunderstorm" in condition:
                         realtime_tasks.append({
                            "id": 99901, # Temporary ID
                            "task": "🌧️ Rain detected: Delay watering today",
                            "date": today,
                            "status": "pending",
                            "priority": "high"
                         })
                         realtime_tasks.append({
                            "id": 99904,
                            "task": "Check drainage systems for overflow",
                            "date": today,
                            "status": "pending",
                            "priority": "high"
                         })
                    elif current_temp > 35:
                         realtime_tasks.append({
                            "id": 99902,
                            "task": "☀️ High heat alert: Ensure crops are well-watered",
                            "date": today,
                            "status": "pending",
                            "priority": "high"
                         })
                    
                    if humidity > 90:
                        realtime_tasks.append({
                            "id": 99903,
                            "task": "💧 High humidity: Check for fungal diseases",
                            "date": today,
                            "status": "pending",
                            "priority": "medium"
                        })
                        
                    if wind_speed > 20:
                        realtime_tasks.append({
                            "id": 99905,
                            "task": "💨 High winds: Secure loose equipment/supports",
                            "date": today,
                            "status": "pending",
                            "priority": "high"
                        })
                        
                except Exception as w_err:
                    print(f"Weather task generation failed: {w_err}")

        # Combine tasks (Realtime first)
        all_tasks = realtime_tasks + formatted_db_tasks
        return all_tasks

    except Exception as e:
        print(f"Error fetching tasks: {str(e)}")
        # Return empty list on error to avoid crashing frontend
        return []

@app.get("/api/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Get notifications for farmer"""
    try:
        # Generate new notifications
        await generate_all_notifications(current_user["id"], supabase)
        
        # Fetch notifications
        response = supabase.table("notifications").select("*").eq("user_id", current_user["id"]).eq("read", False).order("created_at", desc=True).limit(20).execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")

@app.get("/api/crops/selected")
async def get_selected_crops(current_user: dict = Depends(get_current_user)):
    """Get selected crops for farmer"""
    try:
        # Try to fetch selected crops
        response = supabase.table("selected_crops").select("*").eq("user_id", current_user["id"]).eq("status", "active").execute()
        
        # Return empty list if no data (this is valid)
        if not response.data:
            return []
        
        return response.data
    except Exception as e:
        import traceback
        error_detail = str(e)
        print(f"Error fetching selected crops: {error_detail}")
        print(traceback.format_exc())
        
        # Check if it's a table not found error
        error_lower = error_detail.lower()
        if "relation" in error_lower or "does not exist" in error_lower or "table" in error_lower:
            # Return empty list instead of error if table doesn't exist
            print("Warning: selected_crops table not found. Returning empty list.")
            return []
        
        # For other errors, return empty list to prevent frontend crashes
        print(f"Warning: Error fetching crops, returning empty list: {error_detail}")
        return []

@app.get("/api/weather")
async def get_weather(
    latitude: float,
    longitude: float,
    current_user: dict = Depends(get_current_user)
):
    """Get real-time weather data for a location"""
    try:
        from web_scraper import get_weather_data
        weather_data = await get_weather_data(latitude, longitude)
        return weather_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather data: {str(e)}")

@app.post("/api/disease/predict")
async def predict_disease(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Predict diseases for a crop using web scraping"""
    try:
        crop_name = request.get("crop_name")
        if not crop_name:
            raise HTTPException(status_code=400, detail="Crop name is required")
            
        from web_scraper import scrape_plant_diseases
        diseases = await scrape_plant_diseases(crop_name)
        
        return {"diseases": diseases}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to predict diseases: {str(e)}")

@app.get("/api/tasks")
async def get_daily_tasks(
    tab: str = "today",
    current_user: dict = Depends(get_current_user)
):
    """Get daily tasks based on tab (yesterday, today, tomorrow) with smart task generation"""
    try:
        # Get user profile for location-based weather data
        profile = None
        try:
            profile_response = supabase.table("farmer_profiles").select("*").eq("user_id", current_user["id"]).execute()
            if profile_response.data:
                profile = profile_response.data[0]
        except Exception:
            pass
        
        # Get weather data for smart task generation
        weather_data = None
        if profile and profile.get("latitude") and profile.get("longitude"):
            try:
                from web_scraper import get_weather_data
                weather_data = await get_weather_data(profile["latitude"], profile["longitude"])
            except Exception:
                pass
        
        # Fetch manual tasks from database
        tasks = []
        try:
            # Calculate date based on tab
            today = datetime.now(timezone.utc).date()
            if tab == "yesterday":
                target_date = today - timedelta(days=1)
            elif tab == "tomorrow":
                target_date = today + timedelta(days=1)
            else:  # today
                target_date = today
            
            # Fetch tasks from database
            response = supabase.table("daily_tasks").select("*").eq("user_id", current_user["id"]).eq("date", str(target_date)).execute()
            if response.data:
                tasks = response.data
        except Exception as e:
            print(f"Error fetching tasks from database: {e}")
        
        # Generate smart tasks based on weather (only for today)
        if tab == "today" and weather_data:
            smart_tasks = []
            current_weather = weather_data.get("current", {})
            
            # High wind warning - avoid spraying
            if current_weather.get("wind_speed", 0) > 15:
                smart_tasks.append({
                    "id": 1001,
                    "task": "task_avoid_spraying",
                    "date": str(today),
                    "status": "pending",
                    "priority": "high",
                    "source": "smart-weather",
                    "meta": {
                        "value": f"{current_weather.get('wind_speed', 0)} km/h"
                    }
                })
            
            # High humidity + warm temp = disease risk
            if current_weather.get("humidity", 0) > 80 and 25 < current_weather.get("temperature", 0) < 35:
                smart_tasks.append({
                    "id": 1002,
                    "task": "task_scout_disease",
                    "date": str(today),
                    "status": "pending",
                    "priority": "high",
                    "source": "smart-disease",
                    "meta": {
                        "value": "High Risk"
                    }
                })
            
            # Low precipitation - irrigation needed
            if current_weather.get("precipitation", 0) < 1 and current_weather.get("temperature", 0) > 30:
                smart_tasks.append({
                    "id": 1003,
                    "task": "task_check_irrigation",
                    "date": str(today),
                    "status": "pending",
                    "priority": "medium",
                    "source": "smart-weather",
                    "meta": {
                        "value": f"{current_weather.get('temperature', 0)}°C"
                    }
                })
            
            tasks.extend(smart_tasks)
        
        return tasks
    except Exception as e:
        print(f"Error in get_daily_tasks: {e}")
        return []

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics aggregated from user activity"""
    try:
        stats = {
            "crop_recommendations": 0,
            "crop_recommendations_change": "+0",
            "crop_recommendations_trend": "up",
            "disease_diagnoses": 0,
            "disease_diagnoses_change": "+0",
            "disease_diagnoses_trend": "up",
            "market_alerts": 0,
            "market_alerts_change": "+0",
            "market_alerts_trend": "up",
            "voice_queries": 0,
            "voice_queries_change": "+0",
            "voice_queries_trend": "up"
        }
        
        # Count crop recommendations (last 30 days)
        try:
            thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            response = supabase.table("crop_recommendations").select("*", count="exact").eq("user_id", current_user["id"]).gte("created_at", thirty_days_ago).execute()
            stats["crop_recommendations"] = str(response.count or 0)
            
            # Calculate trend (compare with previous 30 days)
            sixty_days_ago = (datetime.now(timezone.utc) - timedelta(days=60)).isoformat()
            prev_response = supabase.table("crop_recommendations").select("*", count="exact").eq("user_id", current_user["id"]).gte("created_at", sixty_days_ago).lt("created_at", thirty_days_ago).execute()
            prev_count = prev_response.count or 0
            current_count = response.count or 0
            change = current_count - prev_count
            stats["crop_recommendations_change"] = f"+{change}" if change >= 0 else str(change)
            stats["crop_recommendations_trend"] = "up" if change >= 0 else "down"
        except Exception as e:
            print(f"Error counting crop recommendations: {e}")
        
        # Count disease diagnoses (last 30 days)
        try:
            response = supabase.table("disease_diagnoses").select("*", count="exact").eq("user_id", current_user["id"]).gte("created_at", thirty_days_ago).execute()
            stats["disease_diagnoses"] = str(response.count or 0)
            
            prev_response = supabase.table("disease_diagnoses").select("*", count="exact").eq("user_id", current_user["id"]).gte("created_at", sixty_days_ago).lt("created_at", thirty_days_ago).execute()
            prev_count = prev_response.count or 0
            current_count = response.count or 0
            change = current_count - prev_count
            stats["disease_diagnoses_change"] = f"+{change}" if change >= 0 else str(change)
            stats["disease_diagnoses_trend"] = "up" if change >= 0 else "down"
        except Exception as e:
            print(f"Error counting disease diagnoses: {e}")
        
        # Count voice queries (last 30 days)
        try:
            response = supabase.table("voice_queries").select("*", count="exact").eq("user_id", current_user["id"]).gte("created_at", thirty_days_ago).execute()
            stats["voice_queries"] = str(response.count or 0)
            
            prev_response = supabase.table("voice_queries").select("*", count="exact").eq("user_id", current_user["id"]).gte("created_at", sixty_days_ago).lt("created_at", thirty_days_ago).execute()
            prev_count = prev_response.count or 0
            current_count = response.count or 0
            change = current_count - prev_count
            stats["voice_queries_change"] = f"+{change}" if change >= 0 else str(change)
            stats["voice_queries_trend"] = "up" if change >= 0 else "down"
        except Exception as e:
            print(f"Error counting voice queries: {e}")
        
        # Market alerts (placeholder - could be based on price changes)
        stats["market_alerts"] = "5"
        stats["market_alerts_change"] = "+2"
        stats["market_alerts_trend"] = "up"
        
        return stats
    except Exception as e:
        print(f"Error in get_dashboard_stats: {e}")
        return {
            "crop_recommendations": "0",
            "disease_diagnoses": "0",
            "market_alerts": "0",
            "voice_queries": "0"
        }

@app.get("/api/disease-risk-forecast")
async def get_disease_risk_forecast(current_user: dict = Depends(get_current_user)):
    """Get disease risk forecast based on current weather conditions"""
    try:
        # Get user profile for location
        profile = None
        try:
            profile_response = supabase.table("farmer_profiles").select("*").eq("user_id", current_user["id"]).execute()
            if profile_response.data:
                profile = profile_response.data[0]
        except Exception:
            pass
        
        # Get weather data
        weather_data = None
        if profile and profile.get("latitude") and profile.get("longitude"):
            try:
                from web_scraper import get_weather_data
                weather_data = await get_weather_data(profile["latitude"], profile["longitude"])
            except Exception:
                pass
        
        if not weather_data:
            return []
        
        # Generate risk forecast based on weather
        risks = []
        current = weather_data.get("current", {})
        
        # High humidity risk
        if current.get("humidity", 0) > 85:
            risks.append({
                "level": "High",
                "factor": "high_humidity_factor",
                "color": "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
            })
        
        # Warm night temperature risk
        if 20 < current.get("temperature", 0) < 30:
            risks.append({
                "level": "Moderate",
                "factor": "warm_night_factor",
                "color": "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
            })
        
        # High rainfall risk
        if current.get("precipitation", 0) > 10:
            risks.append({
                "level": "High",
                "factor": "heavy_rain_factor",
                "color": "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
            })
        
        return risks
    except Exception as e:
        print(f"Error in get_disease_risk_forecast: {e}")
        return []

@app.get("/api/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Get user notifications generated from various sources"""
    try:
        # Get user profile for context
        profile = None
        try:
            profile_response = supabase.table("farmer_profiles").select("*").eq("user_id", current_user["id"]).execute()
            if profile_response.data:
                profile = profile_response.data[0]
        except Exception:
            pass
        
        # Use notification service to generate all notifications
        notifications = await generate_all_notifications(current_user["id"], profile)
        
        return notifications
    except Exception as e:
        print(f"Error in get_notifications: {e}")
        return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

