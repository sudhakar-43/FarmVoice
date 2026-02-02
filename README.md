# FarmVoice Pro

AI-powered agricultural assistant with voice interaction, crop recommendations, disease diagnosis, and real-time market insights.

## Features

- **Voice Assistant** - Natural language interaction for farming queries
- **Crop Recommendations** - AI-powered personalized crop suggestions based on soil, climate, and location
- **Disease Diagnosis** - Upload plant images for instant disease detection and treatment advice
- **Market Prices** - Real-time commodity prices and market trends
- **Weather Integration** - Location-based weather forecasts and alerts
- **Task Management** - Daily farming task tracking with health index

## Tech Stack

| Component | Technology                                     |
| --------- | ---------------------------------------------- |
| Frontend  | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend   | FastAPI, Python 3.11+                          |
| AI/ML     | Google Gemini API, Ollama (local LLM)          |
| Database  | Supabase (PostgreSQL)                          |
| Voice     | Web Speech API, faster-whisper (STT), TTS      |

## Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/farmvoicepro.git
cd farmvoicepro

# Frontend setup
npm install
npm run dev

# Backend setup (new terminal)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Access the app at `http://localhost:3000` and API docs at `http://localhost:8000/docs`

## Project Structure

```
farmvoicePro/
├── app/              # Next.js pages and routes
├── components/       # React components
├── backend/          # FastAPI backend
│   ├── main.py       # Main API application
│   ├── routers/      # API route handlers
│   ├── services/     # Business logic
│   └── models/       # Data models
├── lib/              # Shared utilities
└── public/           # Static assets
```

## Environment Variables

See `setup.md` for detailed environment configuration.

## License

MIT License
