# FarmVoice Backend API

Python FastAPI backend with Supabase integration for the FarmVoice farming assistant application.

## Features

- User authentication (register/login) with JWT tokens
- Crop recommendation API
- Disease diagnosis API
- Market prices API
- Voice assistant query processing
- Supabase database integration

## Setup

### 1. Set Up Virtual Environment (Recommended)

**Windows:**
```bash
cd backend
setup_venv.bat
```

**Linux/Mac:**
```bash
cd backend
chmod +x setup_venv.sh
./setup_venv.sh
```

**Manual Setup:**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your:
   - Project URL
   - Anon key
   - Service role key (optional, for admin operations)

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your Supabase credentials:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
JWT_SECRET_KEY=your_secret_key_here_change_in_production
CORS_ORIGINS=http://localhost:3000
```

### 5. Set Up Database Schema

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Run the SQL from `supabase_schema.sql` to create tables

### 6. Run the Server

Make sure your virtual environment is activated, then:

```bash
# Development
uvicorn main:app --reload --port 8000

# Or using Python
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (requires auth)

### Features

- `POST /api/crop/recommend` - Get crop recommendations (requires auth)
- `POST /api/disease/diagnose` - Diagnose crop disease (requires auth)
- `GET /api/market/prices` - Get market prices (requires auth)
- `POST /api/voice/query` - Process voice query (requires auth)

### Health Check

- `GET /` - API info
- `GET /health` - Health check

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Optional |
| `JWT_SECRET_KEY` | Secret key for JWT tokens | Yes |
| `JWT_ALGORITHM` | JWT algorithm (default: HS256) | No |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | Yes |

## Database Schema

The database includes the following tables:
- `users` - User accounts
- `crop_recommendations` - Crop recommendation history
- `disease_diagnoses` - Disease diagnosis history
- `voice_queries` - Voice assistant queries
- `market_prices` - Market price data

See `supabase_schema.sql` for full schema details.

