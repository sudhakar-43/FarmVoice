# FarmVoice Voice Assistant - Demo Guide

## Quick Start Demo

This guide will walk you through demonstrating the FarmVoice Real-Time Voice Assistant to users or stakeholders.

---

## Pre-Demo Checklist

- [ ] Backend server running (`python -m uvicorn main:app --reload`)
- [ ] Frontend server running (`npm run dev`)
- [ ] Microphone connected and tested
- [ ] Browser: Chrome or Edge (recommended)
- [ ] Network: Stable connection
- [ ] Mode: Hybrid (best balance of speed and quality)

---

## Demo Script (5 Minutes)

### 1. Introduction (30 seconds)

**What to say**:

> "Welcome to FarmVoice, an AI-powered farming assistant that understands and speaks your language. It provides real-time, intelligent advice on crops, diseases, weather, and market prices through natural voice conversation."

**What to show**:

- Open the application at `http://localhost:3000`
- Log in to the dashboard
- Navigate to Voice Assistant

---

### 2. First Interaction - Crop Recommendation (90 seconds)

**What to say**:

> "Let me show you how easy it is to get crop recommendations. I'll just click the microphone and ask naturally."

**Steps**:

1. Click the microphone button
2. Grant microphone permission if prompted
3. **Speak**: "What crops should I grow in my location?"
4. Show the real-time transcript appearing
5. Wait for AI response

**Expected Response**:

- Voice response about suitable crops
- Visual canvas showing crop cards with:
  - Crop names
  - Suitability scores
  - Growing season information
  - Benefits

**What to highlight**:

- ✅ Natural language understanding
- ✅ Real-time voice recognition
- ✅ Structured, actionable response
- ✅ Audio feedback (TTS)

---

### 3. Second Interaction - Disease Management (90 seconds)

**What to say**:

> "Now let's ask about a common farming problem - crop diseases."

**Steps**:

1. Click microphone again
2. **Speak**: "How do I treat powdery mildew on my crops?"
3. Show processing indicator
4. Wait for response

**Expected Response**:

- Detailed treatment steps
- Prevention measures
- Visual list format in canvas

**What to highlight**:

- ✅ Domain expertise in agriculture
- ✅ Practical, actionable advice
- ✅ Multiple interaction modes (voice + text)

---

### 4. Third Interaction - Market Prices (60 seconds)

**What to say**:

> "Farmers also need real-time market information. Watch this."

**Steps**:

1. Click microphone
2. **Speak**: "What are the current market prices for cotton?"
3. Show response

**Expected Response**:

- Market prices table
- Location-specific data
- Price trends

**What to highlight**:

- ✅ Real-time data integration
- ✅ Location-aware responses
- ✅ Economic decision support

---

### 5. Text Mode Demo (30 seconds)

**What to say**:

> "If voice isn't convenient, you can also type your questions."

**Steps**:

1. Type in text box: "Tell me about soil health"
2. Press Enter or click Send
3. Show response

**What to highlight**:

- ✅ Flexibility (voice or text)
- ✅ Same intelligent responses
- ✅ Accessibility

---

### 6. Canvas Interaction (30 seconds)

**What to say**:

> "Notice these interactive elements? Users can take actions directly from the AI's suggestions."

**Steps**:

1. Point to action buttons in canvas (if any)
2. Click an action button
3. Show result

**What to highlight**:

- ✅ Interactive AI responses
- ✅ Seamless workflow integration
- ✅ Rich visual presentation

---

### 7. Closing (30 seconds)

**What to say**:

> "FarmVoice brings the power of AI to every farmer, making advanced agricultural knowledge accessible through simple voice conversations. It's available 24/7, supports multiple languages, and continuously learns from interactions."

---

## Advanced Demo Features

### Feature 1: Multi-turn Conversation

**Show**: Follow-up questions work naturally

**Example**:

1. "What crops grow well here?"
2. Wait for response
3. "Tell me more about rice cultivation"
4. Show contextual response

---

### Feature 2: Real-time Transcription

**Show**: Live transcript as you speak

**Steps**:

1. Start recording
2. Speak slowly: "I want to know about organic farming methods"
3. Point out words appearing in real-time

---

### Feature 3: Connection Resilience

**Show**: Auto-reconnect on network issues

**Steps**:

1. Establish connection (green indicator)
2. Disconnect network briefly
3. Reconnect network
4. Show auto-reconnection message

---

## Example Queries

### Beginner-Friendly Queries

- "Hello, what can you help me with?"
- "What crops are good for beginners?"
- "How much water does wheat need?"

### Advanced Queries

- "Compare yield potential of rice vs wheat in monsoon season"
- "Suggest crop rotation plan for 5 acres"
- "Analyze soil health based on pH 6.5"

### Emergency Queries

- "My crop leaves are turning yellow, what should I do?"
- "Is there a pest outbreak in my region?"
- "Emergency drought protection measures"

---

## Troubleshooting During Demo

### Microphone Not Working

- Check browser permissions (lock icon in address bar)
- Switch to text mode temporarily
- Reload page and re-grant permissions

### Slow Response

- Explain: "In production, this runs on optimized servers"
- Show: Response time is logged and monitored
- Switch to cloud mode if available

### Connection Lost

- Explain: "The system auto-reconnects"
- Show: Reconnection attempts in UI
- Worst case: Refresh page

---

## Key Talking Points

### For Farmers

- **Simple**: Just talk naturally, no complicated menus
- **Smart**: Understands context and provides relevant advice
- **Accessible**: Works on any device with a browser
- **Offline-ready**: Local mode works without internet

### For Stakeholders

- **Scalable**: WebSocket architecture supports thousands of concurrent users
- **Cost-effective**: Hybrid mode balances cloud costs with local processing
- **Extensible**: Easy to add new tools and data sources
- **Secure**: Authenticated connections, no data persistence

### For Developers

- **Modern Stack**: FastAPI + Next.js + WebSockets
- **Modular**: Clean separation of STT, TTS, LLM, and tools
- **Observable**: Built-in metrics, logging, and health checks
- **Configurable**: Three modes (local, hybrid, cloud)

---

## Demo Environment Setup

### Ideal Setup

- **Internet**: 10+ Mbps
- **Backend**: Hybrid mode with Gemini API key
- **Cache**: Enabled and pre-warmed
- **Sample Data**: Pre-loaded for common queries

### Backup Plan

- Have screenshots/videos ready
- Prepare mock responses
- Use text mode if microphone fails

---

## Post-Demo Q&A

**Common Questions**:

1. **"Does it work offline?"**

   - Yes, in local mode with downloaded models
   - Hybrid mode needs internet for LLM only

2. **"What languages are supported?"**

   - English out-of-the-box
   - Models available for 50+ languages
   - Easy to add new languages

3. **"How accurate is it?"**

   - 95%+ accuracy on clear audio
   - Improves with accent-specific training
   - Fallback to text input always available

4. **"What about data privacy?"**

   - Audio not stored (unless debug mode)
   - Local mode keeps all data on-device
   - Compliant with data protection regulations

5. **"Can it integrate with my existing tools?"**
   - Yes, through tool adapters
   - API-first architecture
   - Documentation available

---

## Next Steps After Demo

1. **Try it yourself**: Provide login credentials
2. **Read the docs**: Share link to runbook
3. **Setup guide**: Walk through installation
4. **Customization**: Discuss specific requirements
5. **Training**: Schedule hands-on session

---

## Resources

- [Operational Runbook](./VOICE_ASSISTANT_RUNBOOK.md)
- [Test Report](./VOICE_ASSISTANT_TEST_REPORT.md)
- [Main README](../README.md)
- [API Documentation](http://localhost:8000/docs)

---

**Demo Duration**: 5-10 minutes
**Audience Level**: All (adjustable complexity)
**Success Metric**: User tries it themselves!

Happy Demoing! 🌾🎤
