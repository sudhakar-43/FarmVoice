"""
Text-to-Speech service for FarmVoice
Supports Piper TTS for local inference with browser fallback
"""

import asyncio
from typing import Optional, AsyncGenerator
from pathlib import Path
from .config import config
from .observability import metrics_collector, TimingContext

class TTSService:
    """
    Text-to-Speech service
    
    NOTE: This implementation uses browser TTS as primary.
    For production with Piper TTS:
    1. Install: pip install piper-tts
    2. Download voice models from https://github.com/rhasspy/piper/releases
    3. Place in ./backend/models/piper/
    4. Uncomment the Piper implementation below
    """
    
    def __init__(self):
        self.voice_name = config.local_tts_voice
        self.model = None
        self.use_browser_fallback = True  # Set to False when Piper is ready
        
        # Uncomment to enable Piper TTS
        # self._initialize_model()
    
    def _initialize_model(self):
        """Initialize Piper TTS model"""
        try:
            # Piper TTS initialization would go here
            from piper import PiperVoice
            
            voice_path = config.models_dir / "piper" / f"{self.voice_name}.onnx"
            
            if voice_path.exists():
                self.model = PiperVoice.load(str(voice_path))
                self.use_browser_fallback = False
                metrics_collector.log_event("INFO", f"Piper TTS model loaded: {self.voice_name}")
            else:
                metrics_collector.log_event("WARN", f"Piper model not found: {voice_path}")
                self.use_browser_fallback = True
                
        except ImportError:
            metrics_collector.log_event("WARN", "Piper TTS not installed, using browser TTS")
            self.use_browser_fallback = True
        except Exception as e:
            metrics_collector.log_event("WARN", f"Failed to load Piper model: {str(e)}")
            self.use_browser_fallback = True
    
    async def synthesize_speech(self, text: str, language: str = "en") -> Optional[bytes]:
        """
        Synthesize speech from text
        Returns: audio data as bytes (WAV format)
        """
        with TimingContext("tts_synthesize") as timer:
            try:
                if self.use_browser_fallback:
                    # Browser handles TTS
                    metrics_collector.log_event("INFO", "Using browser TTS")
                    return None
                
                # Piper TTS synthesis
                audio_data = b""
                for chunk in self.model.synthesize_stream_raw(text):
                    audio_data += chunk
                
                metrics_collector.log_event("INFO", f"TTS completed in {timer.get_duration_ms():.0f}ms")
                return audio_data
                
            except Exception as e:
                metrics_collector.log_event("WARN", f"TTS error: {str(e)}")
                return None
    
    async def synthesize_speech_stream(self, text: str, language: str = "en") -> AsyncGenerator[bytes, None]:
        """
        Synthesize speech with streaming output
        Yields: audio chunks as they become available
        """
        if self.use_browser_fallback:
            # Browser TTS doesn't support streaming from server
            yield b""
            return
        
        # Piper streaming implementation
        for chunk in self.model.synthesize_stream_raw(text):
            yield chunk
        
        yield b""
    
    def get_supported_voices(self) -> list:
        """Get list of available voices"""
        return [
            {"id": "en_US-lessac-medium", "name": "English (US) - Lessac", "language": "en"},
            {"id": "en_GB-alan-medium", "name": "English (UK) - Alan", "language": "en"},
            {"id": "hi_IN-medium", "name": "Hindi (India)", "language": "hi"},
        ]
    
    def estimate_duration_ms(self, text: str) -> float:
        """Estimate audio duration in milliseconds"""
        # Rough estimate: ~150 words per minute = 2.5 words per second
        words = len(text.split())
        duration_s = words / 2.5
        return duration_s * 1000

# Global TTS service instance
tts_service = TTSService()
