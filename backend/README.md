# FarmVoice Backend API

FastAPI backend for the FarmVoice farming assistant application.

## Features

- RESTful API with FastAPI
- JWT authentication
- Crop recommendation engine
- Disease diagnosis system
- Market price tracking (web scraping)
- Weather data integration
- Voice query processing

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
.\venv\Scripts\Activate    # Windows
# source venv/bin/activate  # Linux/Mac
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Create `.env` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET_KEY=your_jwt_secret
CORS_ORIGINS=http://localhost:3000
```

### 4. Setup Database

Run the SQL schema in your Supabase SQL Editor:

```bash
# Execute supabase_schema.sql in Supabase dashboard
```

### 5. Run Server

```bash
python main.py
```

API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── main.py                 # FastAPI application & routes
├── crop_recommender.py     # Crop recommendation logic
├── web_scraper.py          # Data fetching & scraping
├── notification_service.py # Task & notification management
├── requirements.txt        # Python dependencies
├── supabase_schema.sql     # Database schema
└── tests/                  # Unit tests
```

## Key Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/crops/recommend` - Get crop recommendations
- `POST /api/disease/predict` - Disease diagnosis
- `GET /api/market/prices` - Market prices
- `POST /api/voice/query` - Voice assistant queries
- `GET /api/weather` - Weather data

## Testing

```bash
pytest tests/
```

## Deployment

### Railway

```bash
railway up
```

### Render

- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## License

MIT
