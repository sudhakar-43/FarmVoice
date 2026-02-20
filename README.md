<div align="center">

# 🌾 FarmVoice

### AI-Powered Voice Assistant for Smart Farming

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*Empowering farmers with intelligent, voice-driven agricultural insights*

[Getting Started](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🚀 Overview

**FarmVoice** is a comprehensive AI-powered agricultural assistant that combines natural language voice interaction with cutting-edge machine learning to provide farmers with personalized crop recommendations, disease diagnosis, real-time market prices, and weather insights—all through simple voice commands.

Built with a modern tech stack, FarmVoice bridges the gap between advanced agricultural technology and accessibility, making smart farming tools available to farmers regardless of technical expertise.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎤 **Voice Assistant** | Natural language interaction for hands-free farming queries |
| 🌱 **Crop Recommendations** | AI-powered suggestions based on soil type, climate, and location |
| 🔬 **Disease Diagnosis** | Upload plant images for instant disease detection and treatment advice |
| 📈 **Market Prices** | Real-time commodity prices and market trend analysis |
| 🌦️ **Weather Integration** | Location-based forecasts and agricultural weather alerts |
| ✅ **Task Management** | Daily farming task tracking with farm health index |
| 📊 **Analytics Dashboard** | Visual insights on crop performance and farm metrics |
| 🌐 **Multi-language Support** | Accessible to farmers in regional languages |

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 with React 19
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS 3.4
- **3D Graphics:** Three.js with React Three Fiber
- **Animations:** Framer Motion
- **Charts:** Recharts

### Backend
- **Framework:** FastAPI 0.115
- **Language:** Python 3.11+
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT with Supabase Auth

### AI/ML
- **Primary LLM:** Google Gemini API
- **Fallback LLM:** Ollama (local deployment)
- **Voice:** Web Speech API + faster-whisper (STT)

---

## 📦 Quick Start

### Prerequisites

- Node.js 18.17+ (v24.13.0 recommended)
- Python 3.11+ (3.12.10 recommended)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/sudhakar-43/FarmVoice.git
cd FarmVoice

# Install frontend dependencies
npm install

# Set up backend virtual environment
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Install Python dependencies
pip install -r requirements.txt
```

### Environment Configuration

Create `.env` files in both root and backend directories:

**Root `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend `.env`:**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
GEMINI_API_KEY=your_gemini_api_key
OLLAMA_BASE_URL=http://localhost:11434
```

### Running the Application

```bash
# Terminal 1: Start the frontend
npm run dev

# Terminal 2: Start the backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

🌐 **Frontend:** http://localhost:3000  
📡 **API Docs:** http://localhost:8000/docs

---

## 📁 Project Structure

```
FarmVoice/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Dashboard views
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── voice/            # Voice interaction components
│   └── charts/           # Data visualization
├── backend/              # FastAPI backend
│   ├── main.py          # Application entry point
│   ├── routers/         # API route handlers
│   ├── services/        # Business logic layer
│   ├── models/          # Pydantic data models
│   └── voice_service/   # Voice processing
├── lib/                  # Shared utilities
├── context/             # React context providers
└── public/              # Static assets
```

---

## 🧪 Testing

```bash
# Frontend linting
npm run lint

# Frontend build test
npm run build
```

---

## 📚 Documentation

| Document                                        | Description                         |
|-------------------------------------------------|-------------------------------------|
| [API Documentation](http://localhost:8000/docs) | Interactive API docs (when running) |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**P. SUDHAKAR BABU**  
*Full Stack Developer & AI Enthusiast*

📧 Email: [sudhakarbabu595@gmail.com](mailto:sudhakarbabu595@gmail.com)  
🐙 GitHub: [@sudhakar-43](https://github.com/sudhakar-43)

[![GitHub](https://img.shields.io/badge/GitHub-sudhakar--43-181717?style=for-the-badge&logo=github)](https://github.com/sudhakar-43)

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ for the farming community

</div>
