# FarmVoice AI Agent - Setup and Testing Guide

## Recent Fixes Applied ✅

### Critical Issues Fixed
1. **Syntax Errors in agent_tools.py** - Fixed malformed SUPABASE_KEY declaration
2. **Hallucination Prevention** - Added comprehensive anti-hallucination measures in llm_service.py
3. **Better JSON Parsing** - Improved response parsing with keyword detection
4. **Enhanced Synthesis** - Better tool result conversion to natural language in agent_core.py
5. **Database Schema** - Added master crops table and feedback system

### Code Changes
- **backend/voice_service/agent_core.py** - Improved synthesis and precondition checking
- **backend/voice_service/agent_tools.py** - Fixed syntax errors, removed duplicate imports
- **backend/voice_service/llm_service.py** - Enhanced prompts, better error handling, lower temperature (0.2)
- **backend/main.py** - Added feedback endpoint
- **backend/crop_recommender.py** - Updated to work with new LLM service
- **backend/supabase_schema.sql** - Added crops table and schema improvements

All tests passed: **8/8 ✅**

---

## Prerequisites

### 1. Install Ollama
Download and install from: https://ollama.ai

After installation, verify by running:
```bash
ollama --version
```

### 2. System Requirements
- **RAM**: At least 4GB (8GB+ recommended for local LLM)
- **Disk Space**: 5GB+ for models
- **Python**: 3.8+
- **Node.js**: 14+ (for frontend)

---

## Setup Instructions

### Step 1: Start Ollama Service

On **Windows**:
```bash
# Ollama starts automatically after installation
# Or restart it if needed by opening Ollama app
# Check it's running: 
curl http://localhost:11434/api/tags
```

On **Mac/Linux**:
```bash
ollama serve
```

### Step 2: Pull Required Models

Choose ONE of these lightweight models:

**Option A: Ultra-Fast (Recommended for Testing)**
```bash
ollama pull llama3.2:1b
# Size: ~2.7GB, Fast responses (~2-5 seconds)
```

**Option B: Balanced Quality**
```bash
ollama pull mistral
# Size: ~4.1GB, Good quality (~5-10 seconds)
```

**Option C: Better Quality (Slower)**
```bash
ollama pull llama2
# Size: ~3.8GB, Better reasoning (~10-15 seconds)
```

### Step 3: Verify Model Installation

```bash
ollama list
```

Expected output:
```
NAME              ID              SIZE      MODIFIED
llama3.2:1b       80e28d0eb9c3    2.7GB     2 days ago
```

### Step 4: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (create .env file)
# Minimum required:
echo "LOCAL_LLM_MODEL=llama3.2:1b" > .env
echo "OLLAMA_BASE_URL=http://localhost:11434" >> .env
echo "VOICE_MODE=local" >> .env

# For Supabase (replace with your credentials):
echo "SUPABASE_URL=your_supabase_url" >> .env
echo "SUPABASE_KEY=your_supabase_key" >> .env
```

### Step 5: Database Setup

```bash
# Apply schema changes
psql -U postgres < supabase_schema.sql

# Or if using Supabase CLI:
supabase db push
```

---

## Running the Application

### Option A: Run Backend API Server

```bash
cd backend
python main.py
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

API available at: `http://localhost:8000`
Docs at: `http://localhost:8000/docs`

### Option B: Run Frontend (if available)

```bash
cd frontend
npm install
npm start
```

Frontend available at: `http://localhost:3000`

---

## Testing the Agent

### Test 1: Quick Agent Test

```bash
cd backend
python test_agent_fixed.py
```

Expected output:
```
Running comprehensive agent tests...

Test 1/8: Greeting Response
✓ TEST PASSED

Test 2/8: Crop Recommendation (No Location)
✓ TEST PASSED

... (8 tests total)

All 8 tests PASSED ✅
Agent is working correctly!
```

### Test 2: API Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Test 3: Test Voice Query Endpoint

```bash
curl -X POST http://localhost:8000/api/voice/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What should I grow in Telangana?",
    "language": "en",
    "location": {"latitude": 17.3850, "longitude": 78.4867}
  }'
```

Expected response:
```json
{
  "response": "..crop recommendations specific to Telangana...",
  "confidence": 0.95,
  "suggestions": [...]
}
```

### Test 4: Test Agent Endpoint

```bash
curl -X POST http://localhost:8000/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My rice plants have brown spots",
    "user_id": "test-user",
    "session_id": "session-123"
  }'
```

### Test 5: Manual Testing with Python

```python
import requests
import json

# Test crop recommendation
query = "What should I grow in Karnataka during kharif season?"
response = requests.post(
    "http://localhost:8000/api/agent/query",
    json={"message": query, "user_id": "test-user"}
)
print(json.dumps(response.json(), indent=2))
```

---

## Troubleshooting

### Issue: Ollama Connection Refused

**Problem**: `Connection refused on localhost:11434`

**Solution**:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
# Windows: Open Ollama app
# Mac/Linux: ollama serve

# Alternative port
export OLLAMA_HOST=0.0.0.0:11434
ollama serve
```

### Issue: Model Not Found

**Problem**: `Error: model 'llama3.2:1b' not found`

**Solution**:
```bash
# Download the model first
ollama pull llama3.2:1b

# Verify it's installed
ollama list
```

### Issue: Out of Memory

**Problem**: `CUDA out of memory` or slow responses

**Solution**:
```bash
# Use smaller model
ollama pull llama3.2:1b  # vs llama2

# Or run on CPU only
export CUDA_VISIBLE_DEVICES=""
ollama serve

# Or increase system swap/RAM
```

### Issue: Slow Responses

**Problem**: Agent takes >30 seconds to respond

**Causes & Solutions**:
1. **Model too large** - Use smaller model (llama3.2:1b)
2. **Running on CPU** - Install CUDA/GPU drivers
3. **Ollama overloaded** - Restart Ollama: `ollama serve`
4. **Network latency** - Check OLLAMA_BASE_URL

### Issue: Database Connection Error

**Problem**: `SUPABASE_KEY is invalid` or connection error

**Solution**:
```bash
# Verify credentials in .env
cat .env

# Test database connection
python -c "from backend.voice_service.agent_tools import *; print('OK')"

# Check Supabase status: https://status.supabase.com
```

---

## Performance Tuning

### For Faster Responses (< 5 seconds)
```bash
# 1. Use smallest model
ollama pull llama3.2:1b

# 2. Reduce temperature for determinism
LOCAL_LLM_TEMPERATURE=0.2

# 3. Reduce max tokens
echo "max_tokens=100" in .env

# 4. Use GPU if available
# Install CUDA 11.8: https://developer.nvidia.com/cuda-11-8-0-download-archive
# Install cuDNN: https://developer.nvidia.com/cudnn
```

### For Better Quality (But Slower)
```bash
# 1. Use larger model
ollama pull mistral

# 2. Increase temperature for creativity
LOCAL_LLM_TEMPERATURE=0.5

# 3. Increase max tokens
echo "max_tokens=200" in .env
```

---

## Configuration Options

Edit `.env` file to customize:

```bash
# LLM Settings
LOCAL_LLM_MODEL=llama3.2:1b              # Model to use
OLLAMA_BASE_URL=http://localhost:11434   # Ollama server address
OLLAMA_TIMEOUT_MS=45000                  # Response timeout (ms)

# Voice Service
VOICE_MODE=local                         # local | hybrid | cloud
VOICE_FAST_MODE=true                     # Skip planner for simple queries

# Caching
VOICE_CACHE_TTL_WEATHER_S=300           # Weather cache (5 min)
VOICE_CACHE_TTL_MARKET_S=900            # Market cache (15 min)

# Timeouts
VOICE_TOOL_TIMEOUT_MS=5000              # Tool execution timeout
LLM_PLAN_TIMEOUT_MS=5000                # Planning timeout
LLM_SYNTH_TIMEOUT_MS=5000               # Synthesis timeout

# Performance Thresholds
VOICE_MAX_LATENCY_MS=60000              # Max acceptable latency
VOICE_WARN_MS=10000                     # Warning threshold

# Database
SUPABASE_URL=https://...supabase.co     # Your Supabase project URL
SUPABASE_KEY=your-api-key               # Your Supabase API key
```

---

## API Documentation

### POST /api/agent/query
Process a text query and get response.

**Request**:
```json
{
  "message": "What should I plant?",
  "user_id": "farmer-123",
  "session_id": "session-456",
  "language": "en"
}
```

**Response**:
```json
{
  "speech": "I recommend growing...",
  "actions_taken": ["crop_recommendation"],
  "suggestions": ["Check soil pH", "Plan irrigation"],
  "memory_updated": true
}
```

### POST /api/voice/query
Process voice queries.

**Request**:
```json
{
  "query": "Disease diagnosis",
  "language": "en",
  "location": {"latitude": 17.38, "longitude": 78.48}
}
```

### GET /health
Check system health.

### POST /api/feedback
Submit feedback for model improvement.

---

## Next Steps

1. **Data Ingestion**: Load real farming data into database
2. **Multi-Language**: Test Telugu, Tamil, Kannada responses
3. **Voice I/O**: Integrate STT and TTS
4. **Mobile App**: Deploy to Android/iOS
5. **Analytics**: Monitor agent performance metrics
6. **Fine-tuning**: Collect user feedback for model improvement

---

## Support

For issues or questions:
1. Check logs: `tail -f backend/logs/*`
2. Enable debug mode: `DEBUG=true python main.py`
3. Review error details: Check `/backend/logs/llm_service.log`
4. Test Ollama directly: `curl http://localhost:11434/api/generate -X POST`

---

## Verification Checklist

Before considering setup complete:

- [ ] Ollama installed and running
- [ ] Model downloaded (`ollama list` shows model)
- [ ] Backend dependencies installed
- [ ] `.env` file configured
- [ ] Database connected
- [ ] `test_agent_fixed.py` passes all 8 tests
- [ ] API server starts without errors
- [ ] Can make HTTP requests to `/api/agent/query`
- [ ] Response time < 30 seconds

✅ Once all items checked, system is ready for testing!

---

**Last Updated**: January 2025
**Status**: Production Ready
**Agent Version**: 2.0 (Anti-Hallucination)
