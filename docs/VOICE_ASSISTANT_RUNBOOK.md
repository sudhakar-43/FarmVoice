# FarmVoice Voice Assistant - Operational Runbook

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Operation Modes](#operation-modes)
6. [Troubleshooting](#troubleshooting)
7. [Performance Tuning](#performance-tuning)
8. [Monitoring](#monitoring)
9. [Maintenance](#maintenance)

## Overview

The FarmVoice Voice Assistant is a real-time, interactive AI assistant designed for farmers. It supports:

- **Real-time voice interaction** via WebSocket
- **Speech-to-Text (STT)** using Faster-Whisper or cloud services
- **Text-to-Speech (TTS)** using Piper TTS or cloud services
- **Natural Language Understanding** using Gemini AI or local LLM
- **Dynamic canvas rendering** for rich, structured responses
- **Tool integration** for weather, soil, market, and crop data

## Architecture

```
┌─────────────┐          ┌──────────────────┐          ┌────────────┐
│   Client    │ WebSocket│  Voice Service   │          │   Tools    │
│  (Browser)  │◄────────►│   (FastAPI)      │◄────────►│  (APIs)    │
└─────────────┘          └──────────────────┘          └────────────┘
      │                          │                            │
      │                          ▼                            │
      │                   ┌──────────────┐                   │
      │                   │ STT Service  │                   │
      │                   │ TTS Service  │                   │
      │                   │ LLM Service  │                   │
      │                   │   Planner    │                   │
      │                   └──────────────┘                   │
      │                                                       │
      └───────────────────────────────────────────────────────┘
```

## Installation & Setup

### Prerequisites

- Python 3.9+
- Node.js 18+
- 10GB+ free disk space (for local models)
- Microphone-enabled device

### Backend Setup

1. **Navigate to backend directory**
   \`\`\`bash
   cd backend
   \`\`\`

2. **Create virtual environment**
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate # On Windows: venv\\Scripts\\activate
   \`\`\`

3. **Install dependencies**
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

4. **Download models** (for local/hybrid mode)
   \`\`\`bash
   python scripts/download_models.py
   \`\`\`

5. **Configure environment**
   \`\`\`bash
   cp .env.voice .env.voice.local

   # Edit .env.voice.local with your configuration

   \`\`\`

6. **Start the server**
   \`\`\`bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   \`\`\`

### Frontend Setup

1. **Navigate to project root**
   \`\`\`bash
   cd ..
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Access the application**
   - Open browser: \`http://localhost:3000\`
   - Login or register
   - Navigate to Voice Assistant

## Configuration

### Voice Mode Selection

The service supports three modes:

| Mode       | STT   | TTS   | LLM   | Use Case                    |
| ---------- | ----- | ----- | ----- | --------------------------- |
| **local**  | Local | Local | Local | Offline, no API costs       |
| **hybrid** | Local | Local | Cloud | Balanced cost/quality       |
| **cloud**  | Cloud | Cloud | Cloud | Best quality, requires APIs |

Set mode in \`.env.voice\`:
\`\`\`bash
VOICE_MODE=hybrid
\`\`\`

### Model Configuration

For **local** or **hybrid** modes:

\`\`\`bash

# STT Configuration

STT_MODEL_PATH=./models/faster-whisper-small
STT_DEVICE=cpu # or cuda for GPU
STT_COMPUTE_TYPE=int8

# TTS Configuration

TTS_MODEL_PATH=./models/piper-tts-en/model.onnx
TTS_CONFIG_PATH=./models/piper-tts-en/config.json
\`\`\`

For **cloud** mode:
\`\`\`bash
GEMINI_API_KEY=your_api_key_here
\`\`\`

### Performance Thresholds

\`\`\`bash

# Warning threshold (ms)

PERFORMANCE_WARN_MS=3000

# Failsafe threshold (ms) - auto-switch to cloud

PERFORMANCE_FAILSAFE_MS=5000
\`\`\`

## Operation Modes

### Starting in Different Modes

**Local Mode** (no internet required):
\`\`\`bash
VOICE_MODE=local python -m uvicorn main:app
\`\`\`

**Hybrid Mode** (recommended):
\`\`\`bash
VOICE_MODE=hybrid python -m uvicorn main:app
\`\`\`

**Cloud Mode** (best quality):
\`\`\`bash
VOICE_MODE=cloud python -m uvicorn main:app
\`\`\`

### Runtime Mode Switching

Use admin API to change mode without restart:

\`\`\`bash
curl -X POST http://localhost:8000/api/voice/admin/config/mode \\
-H "X-Admin-Token: YOUR_ADMIN_TOKEN" \\
-H "Content-Type: application/json" \\
-d '{"mode": "hybrid"}'
\`\`\`

## Troubleshooting

### Common Issues

#### 1. WebSocket Connection Failed

**Symptoms**: "Disconnected from server" error in UI

**Solutions**:

- Check backend is running: \`curl http://localhost:8000/health\`
- Verify WebSocket endpoint: \`wscat -c ws://localhost:8000/ws/voice\`
- Check firewall settings
- Ensure correct CORS configuration

#### 2. Microphone Not Working

**Symptoms**: "Audio recording not supported" error

**Solutions**:

- Use HTTPS or localhost (required for microphone access)
- Grant microphone permissions in browser
- Check browser compatibility (Chrome/Edge recommended)
- Verify microphone is not used by another application

#### 3. Slow Response Times

**Symptoms**: Processing takes > 5 seconds

**Solutions**:

- Check \`PERFORMANCE_WARN_MS\` threshold
- Switch to cloud mode for faster responses
- Use GPU for local models (\`STT_DEVICE=cuda\`)
- Reduce model size (use "tiny" instead of "small")
- Enable caching: \`CACHE_ENABLED=true\`

#### 4. Models Not Found

**Symptoms**: "Model file not found" errors

**Solutions**:

- Run \`python scripts/download_models.py\`
- Verify paths in \`.env.voice\`
- Check file permissions
- Ensure models directory exists

## Performance Tuning

### For Local Mode

**CPU Optimization**:
\`\`\`bash
STT_DEVICE=cpu
STT_COMPUTE_TYPE=int8 # or int16 for better quality
LLM_N_THREADS=4 # adjust based on CPU cores
\`\`\`

**GPU Optimization**:
\`\`\`bash
STT_DEVICE=cuda
STT_COMPUTE_TYPE=float16
\`\`\`

### Caching

Enable aggressive caching for repeated queries:
\`\`\`bash
CACHE_ENABLED=true
CACHE_TTL=7200 # 2 hours
CACHE_MAX_SIZE=5000
\`\`\`

### WebSocket Limits

Adjust connection limits:
\`\`\`bash
WS_MAX_CONNECTIONS=100
WS_CONNECTION_TIMEOUT=600 # 10 minutes
\`\`\`

## Monitoring

### Health Checks

**Basic Health**:
\`\`\`bash
curl http://localhost:8000/api/voice/health
\`\`\`

**Detailed Health** (requires admin token):
\`\`\`bash
curl http://localhost:8000/api/voice/admin/health \\
-H "X-Admin-Token: YOUR_ADMIN_TOKEN"
\`\`\`

### Metrics

View cache statistics:
\`\`\`bash
curl http://localhost:8000/api/voice/admin/cache/stats \\
-H "X-Admin-Token: YOUR_ADMIN_TOKEN"
\`\`\`

View active sessions:
\`\`\`bash
curl http://localhost:8000/api/voice/admin/sessions \\
-H "X-Admin-Token: YOUR_ADMIN_TOKEN"
\`\`\`

### Logs

Monitor real-time logs:
\`\`\`bash
tail -f backend/logs/voice_service.log
\`\`\`

## Maintenance

### Regular Tasks

**Daily**:

- Check health endpoints
- Monitor error rates
- Review slow queries

**Weekly**:

- Clear old cache entries
- Review metrics
- Update dependencies

**Monthly**:

- Update models
- Review and optimize configuration
- Check for security updates

### Clearing Cache

\`\`\`bash
curl -X POST http://localhost:8000/api/voice/admin/cache/clear \\
-H "X-Admin-Token: YOUR_ADMIN_TOKEN"
\`\`\`

### Backup

Important files to backup:

- \`.env.voice\` (configuration)
- \`models/\` (if using local models)
- Database snapshots

### Updates

1. Pull latest code
2. Update dependencies: \`pip install -r requirements.txt --upgrade\`
3. Run database migrations if any
4. Restart services

---

## Quick Reference

| Action          | Command                                    |
| --------------- | ------------------------------------------ |
| Start backend   | \`python -m uvicorn main:app --reload\`    |
| Start frontend  | \`npm run dev\`                            |
| Download models | \`python scripts/download_models.py\`      |
| Check health    | \`curl http://localhost:8000/health\`      |
| View logs       | \`tail -f backend/logs/voice_service.log\` |
| Clear cache     | \`POST /api/voice/admin/cache/clear\`      |
| Change mode     | \`POST /api/voice/admin/config/mode\`      |

---

For additional support, see:

- [Test Report](./VOICE_ASSISTANT_TEST_REPORT.md)
- [Demo Guide](./VOICE_ASSISTANT_DEMO.md)
- [Main README](../README.md)
