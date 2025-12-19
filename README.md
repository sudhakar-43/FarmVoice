# 🌾 FarmVoice - AI-Powered Farming Assistant

> **Smart Agriculture Technology for Indian Farmers**  
> Personalized crop recommendations, disease diagnosis, and market intelligence powered by AI and real-time data

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://github.com/sudhakar-43/FarmVoice)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)](https://fastapi.tiangolo.com/)

---

## 🎯 Overview

FarmVoice is an intelligent farming assistant that helps farmers make data-driven decisions using AI-powered recommendations, real-time weather data, disease diagnosis, and market price tracking. Built with modern web technologies and designed for ease of use.

### ✨ Key Features

- 🌱 **Smart Crop Recommendations** - Location-based suggestions with suitability scoring
- 🔬 **Disease Diagnosis** - Identify crop diseases with treatment recommendations
- 💰 **Market Price Tracking** - Real-time prices from nearby mandis
- 🎤 **Voice Assistant** - Natural language queries in multiple languages
- ☀️ **Weather Integration** - Live weather data and forecasts
- 📊 **Dashboard Analytics** - Track tasks, health metrics, and insights
- 🌍 **Location-Aware** - Personalized recommendations based on your location

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Supabase account (free tier)

### Installation

```bash
# Clone the repository
git clone https://github.com/sudhakar-43/FarmVoice.git
cd FarmVoice

# Install frontend dependencies
npm install

# Setup backend
cd backend
python -m venv venv
.\venv\Scripts\Activate    # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### Configuration

Create `backend/.env`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET_KEY=your_jwt_secret
CORS_ORIGINS=http://localhost:3000
```

Create `.env.local` in root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Run the Application

```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend
npm run dev
```

Visit `http://localhost:3000` 🎉

---

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Frontend   │ ───▶ │   Backend    │ ───▶ │  Database   │
│  Next.js    │ HTTP │   FastAPI    │      │  Supabase   │
│  React 18   │ ◀─── │   Python     │ ◀─── │  PostgreSQL │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │   Data Sources   │
                  ├──────────────────┤
                  │ Open-Meteo       │ Weather
                  │ SoilGrids        │ Soil Data
                  │ Agmarknet        │ Market Prices
                  │ PlantVillage     │ Disease DB
                  └──────────────────┘
```

---

## 💻 Technology Stack

### Frontend

- **Framework:** Next.js 14 with React 18
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Icons:** React Icons

### Backend

- **Framework:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT with bcrypt
- **Data Fetching:** HTTPX, BeautifulSoup4
- **AI Integration:** Google Gemini API

### Data Sources (Free APIs)

- **Weather:** Open-Meteo
- **Soil Data:** SoilGrids (ISRIC)
- **Market Prices:** Agmarknet (Web Scraping)
- **Disease Database:** PlantVillage
- **Location:** OpenStreetMap Nominatim

---

## 📱 Features in Detail

### 1. Crop Recommendation System

- Location-based analysis using pincode
- Soil type and climate matching
- Suitability scoring (0-100%)
- Profit estimation per acre
- Seasonal recommendations
- 12+ crop varieties supported

### 2. Disease Management

- Symptom-based diagnosis
- 30+ common crop diseases
- Treatment recommendations
- Severity assessment
- Preventive measures
- Image-based identification (planned)

### 3. Market Intelligence

- Real-time mandi prices
- Nearby market yards
- Price trend analysis
- Crop-specific pricing
- Distance-based sorting

### 4. Voice Assistant

#### Classic Mode

- Natural language processing
- Multi-language support (English, Telugu, Hindi)
- Context-aware responses
- Voice input/output via browser Speech APIs
- Query suggestions

#### **NEW: Real-Time Voice Assistant** 🎤

Advanced voice interaction with WebSocket-powered real-time communication:

- **Real-time Voice Streaming**: Continuous audio streaming for instant feedback
- **WebSocket Architecture**: Low-latency bidirectional communication
- **Three Operation Modes**:
  - **Local Mode**: Offline-capable with local STT/TTS/LLM models
  - **Hybrid Mode**: Local voice processing + cloud AI (recommended)
  - **Cloud Mode**: Full cloud integration for best quality
- **Visual Canvas Responses**: Rich, structured AI responses with interactive elements
- **Auto-Reconnection**: Reliable connection with automatic recovery
- **Audio Level Indicator**: Real-time visual feedback while speaking
- **Multi-format Support**: Adaptive audio codec selection

**Technical Details**:

- STT: Faster-Whisper (local) or cloud services
- TTS: Piper TTS (local) or cloud services
- LLM: Gemini AI or local Llama models
- Protocol: WebSocket (ws:// or wss://)
- Audio: Multiple codec support (Opus, WebM, etc.)

**Setup**: See [Voice Assistant Runbook](docs/VOICE_ASSISTANT_RUNBOOK.md)

### 5. Weather Dashboard

- Current conditions
- 7-day forecast
- Temperature, humidity, rainfall
- Wind speed and direction
- Weather alerts

---

## 📊 Supported Crops

| Crop     | Season     | Avg. Profit/Acre | Water Need |
| -------- | ---------- | ---------------- | ---------- |
| Cotton   | Kharif     | ₹70,000          | Moderate   |
| Rice     | Kharif     | ₹45,000          | High       |
| Chili    | Rabi       | ₹1,10,000        | Moderate   |
| Tomato   | Year-round | ₹1,20,000        | Moderate   |
| Wheat    | Rabi       | ₹35,000          | Low        |
| Corn     | Kharif     | ₹40,000          | Moderate   |
| Turmeric | Kharif     | ₹1,50,000        | High       |
| Onion    | Rabi       | ₹1,00,000        | Moderate   |

_+ 4 more crops available_

---

## 🗂️ Project Structure

```
FarmVoice/
├── app/                    # Next.js pages & routing
│   ├── home/              # Dashboard pages
│   └── page.tsx           # Login page
├── components/            # React components (20 files)
│   ├── CropSelection.tsx
│   ├── DiseaseManagement.tsx
│   ├── VoiceAssistant.tsx
│   └── ...
├── backend/               # FastAPI backend
│   ├── main.py           # API server
│   ├── crop_recommender.py
│   ├── web_scraper.py
│   └── requirements.txt
├── lib/                   # Utilities & API client
├── public/               # Static assets
└── styles/               # Global styles
```

---

## 🔐 Security Features

- JWT-based authentication
- Bcrypt password hashing
- CORS protection
- Input validation (Pydantic)
- SQL injection prevention
- Environment variable secrets
- Secure API endpoints

---

## 🚀 Deployment

### Frontend (Vercel)

```bash
npm i -g vercel
vercel --prod
```

### Backend (Railway)

```bash
npm i -g @railway/cli
railway login
railway up
```

### Environment Variables

Configure these on your hosting platform:

- `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET_KEY`
- `NEXT_PUBLIC_API_URL`, `CORS_ORIGINS`

---

## 📸 Screenshots

### Dashboard

![Dashboard](public/logo.png)

### Crop Recommendation

_Smart recommendations based on your location and soil type_

### Disease Diagnosis

_Identify and treat crop diseases with AI assistance_

### Voice Assistant

_Natural language queries for farming advice_

---

## 🛣️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Offline mode support
- [ ] Advanced image recognition for diseases
- [ ] Government scheme integration
- [ ] Community farmer forums
- [ ] SMS alerts for weather warnings
- [ ] 50+ crop varieties
- [ ] Regional language expansion

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

**Free Data Providers:**

- OpenStreetMap Foundation
- ISRIC World Soil Information (SoilGrids)
- Open-Meteo
- PlantVillage
- Government of India (Agmarknet)

**Technologies:**

- Next.js Team
- FastAPI Team
- Supabase Team
- Vercel

---

## 📞 Contact & Support

- **Developer:** Sudhakar Babu
- **Email:** sudhakarbabu595@gmail.com
- **GitHub:** [@sudhakar-43](https://github.com/sudhakar-43)
- **Repository:** [FarmVoice](https://github.com/sudhakar-43/FarmVoice)

---

## 🌟 Show Your Support

If this project helped you, please give it a ⭐️!

---

**Built with ❤️ for Indian Farmers**

_Empowering agriculture through technology_
