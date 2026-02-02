# FarmVoice Pro - Setup Guide

Complete setup instructions for development and deployment.

## Prerequisites

- **Node.js** 18.17+ (LTS recommended)
- **Python** 3.11+
- **Git**
- **Supabase** account (for database)
- **Google AI Studio** account (for Gemini API)

## Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at `http://localhost:3000`

## Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend API runs at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

## Environment Variables

### Backend (.env in /backend)

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Optional: Ollama (local LLM)
OLLAMA_HOST=http://localhost:11434
```

### Frontend (.env.local in root)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Database Setup

1. Create a Supabase project
2. Run the schema from `backend/supabase_schema.sql`
3. Update `.env` with your Supabase credentials

## Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend build test
npm run build
```

## Troubleshooting

| Issue               | Solution                                         |
| ------------------- | ------------------------------------------------ |
| CORS errors         | Ensure backend URL matches `NEXT_PUBLIC_API_URL` |
| Database connection | Verify Supabase credentials in `.env`            |
| Voice not working   | Check browser microphone permissions             |
| Build errors        | Clear `.next` folder and rebuild                 |
