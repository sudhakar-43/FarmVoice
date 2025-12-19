"""
WebSocket handler for FarmVoice voice service
Handles real-time voice communication with streaming support
"""

import json
import asyncio
import base64
from typing import Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime, timezone

from .config import config
from .observability import metrics_collector
from .planner import voice_planner
from .stt_service import stt_service
from .tts_service import tts_service

class VoiceSession:
    """Represents a single voice session"""
    
    def __init__(self, websocket: WebSocket, session_id: str):
        self.websocket = websocket
        self.session_id = session_id
        self.language = "en"
        self.context = {}
        self.audio_buffer = bytearray()
        self.is_streaming = False
        self.audio_queue = asyncio.Queue()
        self.stt_task = None
        self.created_at = datetime.now(timezone.utc)
    
    async def send_message(self, message: Dict[str, Any]):
        """Send message to client"""
        try:
            await self.websocket.send_json(message)
        except Exception as e:
            metrics_collector.log_event("WARN", f"Failed to send message: {str(e)}")
    
    async def send_error(self, error_message: str):
        """Send error message to client"""
        await self.send_message({
            "type": "error",
            "message": error_message
        })

class WebSocketHandler:
    """Handles WebSocket connections for voice service"""
    
    def __init__(self):
        self.active_sessions: Dict[str, VoiceSession] = {}
        self.session_counter = 0
    
    def _generate_session_id(self) -> str:
        """Generate unique session ID"""
        self.session_counter += 1
        return f"session_{self.session_counter}_{int(datetime.now().timestamp())}"
    
    async def handle_connection(self, websocket: WebSocket):
        """Handle new WebSocket connection"""
        await websocket.accept()
        
        session_id = self._generate_session_id()
        session = VoiceSession(websocket, session_id)
        self.active_sessions[session_id] = session
        
        metrics_collector.log_event("INFO", f"New voice session: {session_id}")
        
        try:
            # Send welcome message
            await session.send_message({
                "type": "connected",
                "session_id": session_id,
                "message": "Voice assistant ready"
            })
            
            # Handle messages
            while True:
                try:
                    data = await websocket.receive_json()
                    await self._handle_message(session, data)
                    
                except WebSocketDisconnect:
                    metrics_collector.log_event("INFO", f"Session disconnected: {session_id}")
                    break
                except json.JSONDecodeError:
                    await session.send_error("Invalid JSON message")
                except Exception as e:
                    metrics_collector.log_event("WARN", f"Message handling error: {str(e)}")
                    await session.send_error(f"Error processing message: {str(e)}")
        
        finally:
            # Cleanup session
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
            
            metrics_collector.log_event("INFO", f"Session closed: {session_id}")
    
    async def _handle_message(self, session: VoiceSession, data: Dict[str, Any]):
        """Handle incoming message from client"""
        message_type = data.get("type")
        
        if message_type == "start_stream":
            await self._handle_start_stream(session, data)
        
        elif message_type == "audio_chunk":
            await self._handle_audio_chunk(session, data)
        
        elif message_type == "end_stream":
            await self._handle_end_stream(session, data)
        
        elif message_type == "text_query":
            await self._handle_text_query(session, data)
        
        else:
            await session.send_error(f"Unknown message type: {message_type}")
    
    async def _handle_start_stream(self, session: VoiceSession, data: Dict[str, Any]):
        """Handle start of audio streaming"""
        session.language = data.get("lang", "en")
        session.context = data.get("meta", {})
        session.is_streaming = True
        session.audio_buffer.clear()
        
        metrics_collector.log_event("INFO", f"Stream started: {session.session_id}, lang={session.language}")
        
        # Start STT processing task
        async def audio_generator():
            while session.is_streaming:
                try:
                    chunk = await asyncio.wait_for(session.audio_queue.get(), timeout=1.0)
                    if chunk is None: break
                    yield chunk
                except asyncio.TimeoutError:
                    continue
        
        async def process_stt():
            async for result in stt_service.transcribe_stream(audio_generator()):
                if result["type"] == "partial":
                    await session.send_message({
                        "type": "transcript_partial",
                        "text": result["text"]
                    })
                elif result["type"] == "final":
                    # We'll handle final text as a query
                    await self._handle_text_query(session, {"text": result["text"], "lang": session.language})
        
        session.stt_task = asyncio.create_task(process_stt())
        
        await session.send_message({
            "type": "stream_started",
            "message": "Ready to receive audio"
        })
    
    async def _handle_audio_chunk(self, session: VoiceSession, data: Dict[str, Any]):
        """Handle audio chunk"""
        if not session.is_streaming:
            await session.send_error("Stream not started")
            return
        
        try:
            # Decode base64 audio data
            audio_data = base64.b64decode(data.get("data", ""))
            
            # Put into queue for STT processing
            await session.audio_queue.put(audio_data)
            
        except Exception as e:
            await session.send_error(f"Error processing audio chunk: {str(e)}")
    
    async def _handle_end_stream(self, session: VoiceSession, data: Dict[str, Any]):
        """Handle end of audio streaming"""
        session.is_streaming = False
        
        metrics_collector.log_event("INFO", f"Stream ended: {session.session_id}")
        
        await session.send_message({
            "type": "stream_ended",
            "message": "Audio stream completed"
        })
        
        # Signal end of stream to STT task
        await session.audio_queue.put(None)
        
        if session.stt_task:
            try:
                await asyncio.wait_for(session.stt_task, timeout=5.0)
            except Exception:
                pass
            session.stt_task = None
            
        # Clear buffer
        session.audio_buffer.clear()
    
    async def _handle_text_query(self, session: VoiceSession, data: Dict[str, Any]):
        """Handle text query (from STT or direct input)"""
        text = data.get("text", "").strip()
        
        if not text:
            await session.send_error("Empty query")
            return
        
        # Update context
        if "lat" in data:
            session.context["lat"] = data["lat"]
        if "lon" in data:
            session.context["lon"] = data["lon"]
        if "lang" in data:
            session.language = data["lang"]
        
        session.context["language"] = session.language
        
        metrics_collector.log_event("INFO", f"Processing query: '{text}' (session: {session.session_id})")
        
        # Send transcript confirmation
        await session.send_message({
            "type": "transcript_final",
            "text": text
        })
        
        # Check for theme command
        if "theme" in text.lower() and ("dark" in text.lower() or "light" in text.lower()):
            theme = "dark" if "dark" in text.lower() else "light"
            result = await voice_planner.process_theme_command(theme)
            
            await session.send_message({
                "type": "respond",
                "speech": result.get("speech", ""),
                "canvas_spec": result.get("canvas_spec", {}),
                "ui": result.get("ui", {})
            })
            
            # TTS for theme change
            await session.send_message({"type": "tts_start"})
            await asyncio.sleep(0.1)  # Simulate TTS
            await session.send_message({"type": "tts_end"})
            
            return
        
        # Process query through planner
        try:
            # Define callback to emit intermediate results
            async def emit_callback(message: Dict[str, Any]):
                await session.send_message(message)
            
            # Process query
            result = await voice_planner.process_query(
                query=text,
                context=session.context,
                emit_callback=emit_callback
            )
            
            # Send final response
            await session.send_message({
                "type": "respond",
                "speech": result.get("speech", ""),
                "canvas_spec": result.get("canvas_spec", {}),
                "ui": result.get("ui", {}),
                "timings": result.get("timings", {}),
                "cached": result.get("cached", False)
            })
            
            # TTS handling
            await session.send_message({"type": "tts_start"})
            
            # Stream TTS audio
            speech_text = result.get("speech", "")
            if speech_text:
                async for audio_chunk in tts_service.synthesize_speech_stream(speech_text):
                    if audio_chunk:
                        # Encode to base64
                        b64_audio = base64.b64encode(audio_chunk).decode('utf-8')
                        await session.send_message({
                            "type": "audio_chunk",
                            "data": b64_audio
                        })
            
            await session.send_message({"type": "tts_end"})
            
        except Exception as e:
            metrics_collector.log_event("WARN", f"Query processing error: {str(e)}")
            await session.send_error(f"Failed to process query: {str(e)}")
    
    def get_active_sessions_count(self) -> int:
        """Get number of active sessions"""
        return len(self.active_sessions)
    
    def get_session_info(self) -> list:
        """Get information about active sessions"""
        return [
            {
                "session_id": session.session_id,
                "language": session.language,
                "is_streaming": session.is_streaming,
                "created_at": session.created_at.isoformat()
            }
            for session in self.active_sessions.values()
        ]

# Global WebSocket handler instance
ws_handler = WebSocketHandler()
