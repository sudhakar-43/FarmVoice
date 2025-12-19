"""
Speech-to-Text service for FarmVoice
Supports faster-whisper for local inference with browser fallback
"""

import asyncio
from typing import Optional, AsyncGenerator
from .config import config
from .observability import metrics_collector, TimingContext

class STTService:
    """
    Speech-to-Text service
    
    NOTE: This implementation uses browser STT as primary.
    For production with faster-whisper:
    1. Install: pip install faster-whisper
    2. Download model: faster-whisper --model large-v3 --download_root ./backend/models
    3. Uncomment the faster-whisper implementation below
    """
    
    def __init__(self):
        self.model_name = config.local_stt_model
        self.model = None
        self.use_browser_fallback = True  # Set to False when faster-whisper is ready
        
        # Uncomment to enable faster-whisper
        # self._initialize_model()
    
    def _initialize_model(self):
        """Initialize faster-whisper model"""
        try:
            from faster_whisper import WhisperModel
            
            model_path = config.models_dir / "whisper" / self.model_name
            
            # Load model with appropriate device
            self.model = WhisperModel(
                str(model_path) if model_path.exists() else self.model_name,
                device="cpu",  # Change to "cuda" if GPU available
                compute_type="int8"  # Quantized for speed
            )
            
            self.use_browser_fallback = False
            metrics_collector.log_event("INFO", f"Faster-whisper model loaded: {self.model_name}")
            
        except ImportError:
            metrics_collector.log_event("WARN", "faster-whisper not installed, using browser STT")
            self.use_browser_fallback = True
        except Exception as e:
            metrics_collector.log_event("WARN", f"Failed to load whisper model: {str(e)}")
            self.use_browser_fallback = True
    
    async def transcribe_stream(self, audio_chunks: AsyncGenerator[bytes, None]) -> AsyncGenerator[dict, None]:
        """
        Transcribe audio stream with partial results
        Yields: {"type": "partial"|"final", "text": "...", "timestamp": float}
        """
        if self.use_browser_fallback:
            # Browser STT handles streaming on client side
            # Server just receives final transcripts
            async for chunk in audio_chunks:
                # In browser mode, we don't process audio server-side
                pass
            
            yield {
                "type": "info",
                "text": "Using browser STT",
                "timestamp": 0
            }
        else:
            # Faster-whisper streaming implementation
            await self._transcribe_with_whisper(audio_chunks)
    
    async def _transcribe_with_whisper(self, audio_chunks: AsyncGenerator[bytes, None]):
        """Transcribe using faster-whisper (when enabled)"""
        # Collect audio chunks
        audio_buffer = bytearray()
        
        async for chunk in audio_chunks:
            audio_buffer.extend(chunk)
            
            # Process when we have enough audio (e.g., 1 second)
            if len(audio_buffer) >= config.audio_sample_rate * 2:  # 16-bit audio
                # Convert to numpy array and transcribe
                import numpy as np
                audio_array = np.frombuffer(audio_buffer, dtype=np.int16).astype(np.float32) / 32768.0
                
                segments, info = self.model.transcribe(audio_array, beam_size=1)
                
                # Yield partial results
                for segment in segments:
                    yield {"type": "partial", "text": segment.text, "timestamp": segment.start}
                
                # Clear buffer
                audio_buffer.clear()
    
    async def transcribe_audio(self, audio_data: bytes) -> Optional[str]:
        """
        Transcribe complete audio file
        Returns: transcribed text
        """
        with TimingContext("stt_transcribe") as timer:
            try:
                if self.use_browser_fallback:
                    # Browser handles transcription
                    return None
                
                # Faster-whisper transcription
                import numpy as np
                audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
                segments, info = self.model.transcribe(audio_array)
                text = " ".join([segment.text for segment in segments])
                
                metrics_collector.log_event("INFO", f"STT completed in {timer.get_duration_ms():.0f}ms")
                return text
                
            except Exception as e:
                metrics_collector.log_event("WARN", f"STT error: {str(e)}")
                return None
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages"""
        return ["en", "hi", "te", "ta", "kn", "ml"]  # English, Hindi, Telugu, Tamil, Kannada, Malayalam

# Global STT service instance
stt_service = STTService()
