# 🤖 FarmVoice AI Agent Documentation

> **A Jarvis-like AI Assistant for Farmers**  
> Multilingual voice-enabled agricultural assistant powered by local LLM (Ollama)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Agent Capabilities](#agent-capabilities)
5. [Tools & Actions](#tools--actions)
6. [Memory System](#memory-system)
7. [Multilingual Support](#multilingual-support)
8. [LLM Integration](#llm-integration)
9. [API Endpoints](#api-endpoints)
10. [Configuration](#configuration)

---

## Overview

FarmVoice AI Agent is an intelligent voice-enabled assistant designed specifically for farmers. It operates like **Jarvis** - understanding natural language queries, executing farm management tasks, and providing personalized recommendations.

### Key Features

| Feature | Description |
|---------|-------------|
| 🎤 **Voice Interface** | Speech-to-text and text-to-speech capabilities |
| 🧠 **Local LLM** | Runs on Ollama (llama3.1:latest) - no cloud dependency |
| 🌍 **Multilingual** | Supports English, Telugu, Tamil, Kannada, Malayalam, Hindi |
| 📊 **CRUD Operations** | Full farm data management (crops, tasks, profiles) |
| 🌤️ **Real-time Data** | Weather forecasts and market prices |
| 🔒 **Privacy-First** | All processing happens locally on your machine |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  VoiceAssistant.tsx                                             │    │
│  │  - Web Speech API (speech recognition)                          │    │
│  │  - Browser TTS (speech synthesis)                               │    │
│  │  - Interactive 3D background                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────│─────────────────────────────────────┘
                                    │ POST /api/voice/chat
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  voice_router.py                                                │    │
│  │  - JWT Authentication                                           │    │
│  │  - Request validation                                           │    │
│  └────────────────────────────────│────────────────────────────────┘    │
│                                   │                                      │
│  ┌────────────────────────────────▼────────────────────────────────┐    │
│  │  VoicePlanner (planner.py)                                      │    │
│  │  - Orchestrates pipeline                                        │    │
│  │  - Intent classification                                        │    │
│  │  - Tool execution                                               │    │
│  │  - Response synthesis                                           │    │
│  └────────────────────────────────│────────────────────────────────┘    │
│              ┌────────────────────┼────────────────────┐                │
│              │                    │                    │                │
│              ▼                    ▼                    ▼                │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐     │
│  │  LLM Service      │ │  Agent Tools      │ │  Agent Memory     │     │
│  │  (Ollama/Gemini)  │ │  (CRUD + APIs)    │ │  (3-tier storage) │     │
│  └───────────────────┘ └───────────────────┘ └───────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │  Ollama   │   │ Supabase  │   │ Weather   │
            │  LLM      │   │ Database  │   │ API       │
            └───────────┘   └───────────┘   └───────────┘
```

---

## Core Components

### 1. Voice Planner (`planner.py`)

The orchestration layer that processes voice queries through a multi-stage pipeline:

```
Query → Planner LLM → Tool Execution → Synthesizer LLM → Response
```

**Pipeline Stages:**
1. **Planner Role** - Classifies intent and determines required actions
2. **Tool Execution** - Runs necessary database/API operations in parallel
3. **Synthesizer Role** - Generates natural speech response with UI specs

### 2. LLM Service (`llm_service.py`)

Manages AI model interactions with role-based prompts:

| Role | Purpose |
|------|---------|
| `agent` | Main conversational agent |
| `planner` | Intent classification and action planning |
| `query_answerer` | Direct knowledge responses |
| `synthesizer` | Natural language response generation |

**Model Configuration:**
- **Primary**: Ollama with `llama3.1:latest` (4.9 GB)
- **Fallback**: Google Gemini 1.5 Flash (requires API key)
- **Timeout**: 120 seconds for local LLM

### 3. Agent Core (`agent_core.py`)

The "brain" of the agent - handles:
- Message processing and context management
- Action execution and suggestion generation
- Integration with tools registry
- Conversation memory management

---

## Agent Capabilities

### What the Agent Can Do

| Category | Capabilities |
|----------|--------------|
| **Crops** | Add, view, update, delete crops; get recommendations |
| **Tasks** | Create daily tasks, set reminders, mark complete |
| **Weather** | Current conditions, forecasts, farming alerts |
| **Market** | Real-time crop prices by state/district |
| **Diseases** | Symptom-based crop disease diagnosis |
| **Profile** | Update farm details, preferences |
| **Notifications** | Create and manage alerts |

### Intent Classifications

The Planner LLM classifies queries into:

```python
intents = [
    "general_chat",      # Casual conversation
    "plan_tasks",        # Task/schedule related
    "market_prices",     # Price inquiries
    "disease_check",     # Crop health issues
    "weather_check",     # Weather queries
    "crop_management",   # CRUD on crops
    "profile_update"     # User settings
]
```

---

## Tools & Actions

### Agent Tool Registry (`agent_tools.py`)

Complete CRUD operations for all farm entities:

#### 🌾 Crop Tools
```python
read_crop(user_id, crop_id?)    # Get user's crops
create_crop(user_id, crop_name) # Add new crop
update_crop(user_id, crop_id, updates)
delete_crop(user_id, crop_id)
```

#### ✅ Task Tools
```python
read_task(user_id, task_id?, filter_date?)
create_task(user_id, task_name, scheduled_date)
update_task(user_id, task_id, updates)
delete_task(user_id, task_id)
```

#### 👤 Profile Tools
```python
read_profile(user_id)
update_profile(user_id, updates)
```

#### 🔔 Notification Tools
```python
read_notification(user_id)
create_notification(user_id, title, message)
update_notification(user_id, notification_id, updates)
delete_notification(user_id, notification_id)
```

#### 🌤️ External API Tools (Read-Only)
```python
read_weather(lat?, lon?, location?)  # Weather API
read_market(state?, district?, crop?) # Market prices API
diagnose_disease(crop, symptoms)      # Rule-based diagnosis
```

#### 🏥 Health Tools
```python
read_health(user_id, crop_id?)
create_health(user_id, crop_id, health_score, growth_stage)
```

---

## Memory System

### Three-Tier Architecture (`agent_memory.py`)

```
┌─────────────────────────────────────────────────────────────────┐
│                     MEMORY HIERARCHY                            │
├─────────────────────────────────────────────────────────────────┤
│  SHORT-TERM (In-Memory)                                         │
│  - Current conversation (last 20 messages)                      │
│  - Clears on session end                                        │
│  - Instant access                                               │
├─────────────────────────────────────────────────────────────────┤
│  WORKING (Session State)                                        │
│  - Active task state                                            │
│  - Persists across messages                                     │
│  - Stored in Supabase                                           │
├─────────────────────────────────────────────────────────────────┤
│  LONG-TERM (Permanent)                                          │
│  - User preferences                                             │
│  - Conversation history                                         │
│  - Stored in Supabase `agent_memory` table                      │
└─────────────────────────────────────────────────────────────────┘
```

### Memory Operations

```python
# Store conversation message
await memory.store_conversation(user_id, role, content)

# Get conversation context
history = await memory.get_conversation_history(user_id, limit=10)

# Store user preference
await memory.store_preference(user_id, "language", "te")

# Get complete context
context = await memory.get_context(user_id)
# Returns: {conversation_history, preferences, working_context}
```

---

## Multilingual Support

### Supported Languages

| Code | Language | Region |
|------|----------|--------|
| `en` | English | Global |
| `te` | Telugu | Andhra Pradesh, Telangana |
| `ta` | Tamil | Tamil Nadu |
| `kn` | Kannada | Karnataka |
| `ml` | Malayalam | Kerala |
| `hi` | Hindi | North India |

### How it Works

1. Frontend sends `lang` parameter with request
2. LLM Service appends language instruction to prompt:
   ```
   IMPORTANT: The user prefers Telugu (te). 
   You MUST reply in Telugu. Translate your entire 
   'speech' response to Telugu.
   ```
3. LLM generates response in requested language

---

## LLM Integration

### Ollama Configuration

```env
# backend/.env
LOCAL_LLM_MODEL=llama3.1:latest
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT_MS=120000
```

### Generation Options

```python
response = await client.chat(
    model="llama3.1:latest",
    messages=messages,
    format='json',
    options={
        'temperature': 0.7,
        'num_predict': 512,
        'stop': ["```", "User:", "System:"]
    },
    keep_alive='5m'
)
```

### Fallback to Gemini

If Ollama fails, the system automatically falls back to Google Gemini:

```python
# Requires GOOGLE_API_KEY in environment
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')
response = model.generate_content(
    prompt_text,
    generation_config={"response_mime_type": "application/json"}
)
```

---

## API Endpoints

### Voice Chat Endpoint

```http
POST /api/voice/chat
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
    "text": "What crops should I plant this season?",
    "lang": "en",
    "context": {
        "active_crop": "Rice",
        "lat": 17.38,
        "lon": 78.48
    }
}
```

### Response Format

```json
{
    "success": true,
    "speech": "For this season, I'd recommend...",
    "canvas_spec": {
        "widgets": [],
        "layout": "simple"
    },
    "ui": {},
    "timings": {
        "plan_ms": 1200,
        "tools_ms": 500,
        "synth_ms": 1100,
        "e2e_ms": 2800
    },
    "cached": false,
    "tool_results": {}
}
```

---

## Configuration

### Environment Variables

```env
# Supabase (Database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Authentication
JWT_SECRET_KEY=your-super-secret-key
JWT_ALGORITHM=HS256

# LLM Configuration
LOCAL_LLM_MODEL=llama3.1:latest
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT_MS=120000

# Fallback (Optional)
GOOGLE_API_KEY=your-gemini-api-key

# Security
ADMIN_TOKEN=your-admin-token
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Voice Service Config (`config.py`)

Key configuration options:

| Setting | Default | Description |
|---------|---------|-------------|
| `voice_mode` | `hybrid` | Processing mode |
| `local_llm_model` | `llama3.1:latest` | Ollama model |
| `ollama_timeout` | `120000` | LLM timeout (ms) |
| `weather_cache_ttl` | `300` | Weather cache (seconds) |
| `market_cache_ttl` | `900` | Market cache (seconds) |

---

## 🚀 Quick Start

### Prerequisites

1. **Ollama** installed with `llama3.1:latest` model
   ```bash
   ollama pull llama3.1:latest
   ```

2. **Python 3.10+** with virtual environment

3. **Node.js 18+** for frontend

### Start the Agent

```bash
# Terminal 1: Backend
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd farmvoicePro
npm run dev
```

### Test the Agent

```bash
# API Test
curl -X POST http://localhost:8000/api/voice/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, what can you help me with?", "lang": "en"}'
```

---

## 📁 File Structure

```
backend/voice_service/
├── agent_core.py       # Main agent logic
├── agent_memory.py     # Three-tier memory system
├── agent_tools.py      # CRUD tool registry
├── config.py           # Voice service configuration
├── llm_service.py      # Ollama/Gemini integration
├── planner.py          # VoicePlanner orchestration
├── observability.py    # Metrics and logging
├── canvas_builder.py   # UI widget builder
├── tool_adapters.py    # External API adapters
└── tts_service.py      # Text-to-speech service
```

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| **Average Response Time** | 60-90 seconds (local LLM) |
| **Memory Usage** | ~5GB (Ollama + model) |
| **Concurrent Users** | Limited by LLM instance |
| **Cache Hit Ratio** | Weather: 5min, Market: 15min |

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Slow responses | Normal for local LLM; consider faster hardware or Gemini |
| "Ollama generation failed" | Check if Ollama is running: `ollama list` |
| 401 Unauthorized | Token expired; re-login |
| Empty responses | Check `llm_debug.log` for errors |

### Debug Logs

```bash
# LLM Debug Log
cat backend/llm_debug.log

# Agent Trace Log  
cat backend/trace_agent.log
```

---

## 📝 License

This AI Agent is part of the FarmVoice Pro project.

---

*Last Updated: January 2026*
