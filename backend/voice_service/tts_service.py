"""
Optimized Text-to-Speech Service for FarmVoice
Optimizations:
- Model pre-loading on startup
- Streaming synthesis for progressive audio delivery
- Audio optimization (16kHz, Opus-ready format)
- Response caching for repeated phrases
- Parallel synthesis preparation
"""

import asyncio
import time
import hashlib
from typing import Optional, AsyncGenerator, Dict, Any
from concurrent.futures import ThreadPoolExecutor
from collections import OrderedDict

from .config import config
from .observability import metrics_collector, TimingContext


class OptimizedTTSService:
    """
    Optimized TTS service with:
    - Pre-loaded Piper TTS model
    - Streaming synthesis
    - Audio caching for common phrases
    - Optimized audio format (16kHz, mono)
    """

    def __init__(self):
        self.voice_name = config.local_tts_voice
        self.model = None
        self.use_browser_fallback = True
        self.sample_rate = config.audio_sample_rate  # 16kHz
        
        # Thread pool for CPU-bound synthesis
        self.executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="tts_worker")
        
        # Audio cache for common phrases (LRU)
        self.audio_cache: OrderedDict[str, bytes] = OrderedDict()
        self.max_cache_size = 100
        
        # Pre-load model on startup
        self._initialize_model()
        
        # Common phrase cache (pre-synthesized)
        self.common_phrases = [
            "Hello! How can I help you today?",
            "Let me check that for you.",
            "I can help with weather updates, crop recommendations, disease diagnosis, and market prices. Just ask!",
            "Good morning! What can I help you with?",
            "Good evening! How can I assist you?",
            "You're welcome! Anything else I can help with?",
            "Goodbye! Have a great day!",
            "Let me check the weather for you.",
            "Let me get the current market prices for crops.",
            "I'll help you identify and treat the crop disease.",
        ]
        self._pre_synthesize_common_phrases()

    def _initialize_model(self):
        """Pre-load Piper TTS model on startup"""
        try:
            # Try to import piper
            from piper import PiperVoice

            voice_path = config.models_dir / "piper" / f"{self.voice_name}.onnx"

            if voice_path.exists():
                self.model = PiperVoice.load(str(voice_path))
                self.use_browser_fallback = False
                metrics_collector.log_event("INFO", f"Piper TTS model pre-loaded: {self.voice_name}")
                print(f"[TTS] Model pre-loaded: {self.voice_name}")
            else:
                metrics_collector.log_event("WARN", f"Piper model not found: {voice_path}")
                self.use_browser_fallback = True
                print(f"[TTS] Model not found, using browser fallback")

        except ImportError:
            metrics_collector.log_event("WARN", "Piper TTS not installed, using browser TTS")
            self.use_browser_fallback = True
            print("[TTS] Using browser fallback (Piper not installed)")
        except Exception as e:
            metrics_collector.log_event("WARN", f"Failed to load Piper model: {str(e)}")
            self.use_browser_fallback = True
            print(f"[TTS] Model load failed: {e}")

    def _pre_synthesize_common_phrases(self):
        """Pre-synthesize common phrases for instant playback"""
        if self.use_browser_fallback or not self.model:
            return
        
        try:
            for phrase in self.common_phrases:
                self._synthesize_and_cache(phrase)
            print(f"[TTS] Pre-synthesized {len(self.common_phrases)} common phrases")
        except Exception as e:
            print(f"[TTS] Pre-synthesis failed: {e}")

    def _synthesize_and_cache(self, text: str) -> Optional[bytes]:
        """Synthesize text and cache the result"""
        cache_key = self._get_cache_key(text)
        
        # Check cache first
        if cache_key in self.audio_cache:
            return self.audio_cache[cache_key]
        
        try:
            if self.model:
                # Synthesize audio
                audio_data = b""
                for chunk in self.model.synthesize_stream_raw(text):
                    audio_data += chunk
                
                # Cache the result (LRU eviction)
                if len(self.audio_cache) >= self.max_cache_size:
                    self.audio_cache.popitem(last=False)
                self.audio_cache[cache_key] = audio_data
                
                return audio_data
        except Exception as e:
            print(f"[TTS] Synthesis failed for '{text[:50]}...': {e}")
        
        return None

    def _get_cache_key(self, text: str) -> str:
        """Generate cache key for text"""
        return hashlib.md5(text.encode()).hexdigest()

    def warm_up_model(self):
        """Warm up model with dummy input for faster first response"""
        if self.model and not self.use_browser_fallback:
            try:
                # Synthesize a short phrase to warm up
                self._synthesize_and_cache("Hello")
                print("[TTS] Model warmed up successfully")
                return True
            except Exception as e:
                print(f"[TTS] Warm-up failed: {e}")
        return False

    async def synthesize_speech(self, text: str, language: str = "en") -> Optional[bytes]:
        """
        Synthesize speech from text with caching
        Returns: audio data as bytes (WAV format)
        """
        with TimingContext("tts_synthesize") as timer:
            try:
                # Check cache first
                cache_key = self._get_cache_key(text)
                if cache_key in self.audio_cache:
                    metrics_collector.log_event("INFO", f"TTS cache hit: {text[:30]}...")
                    return self.audio_cache[cache_key]

                if self.use_browser_fallback:
                    metrics_collector.log_event("INFO", "Using browser TTS")
                    return None

                # Synthesize in thread pool
                loop = asyncio.get_event_loop()
                audio_data = await loop.run_in_executor(
                    self.executor,
                    self._synthesize_and_cache,
                    text
                )

                if audio_data:
                    metrics_collector.log_event("INFO", f"TTS completed in {timer.get_duration_ms():.0f}ms")
                
                return audio_data

            except Exception as e:
                metrics_collector.log_event("WARN", f"TTS error: {str(e)}")
                return None

    async def synthesize_speech_stream(self, text: str, language: str = "en") -> AsyncGenerator[bytes, None]:
        """
        Synthesize speech with streaming output
        Yields: audio chunks as they become available (optimized for low latency)
        """
        if self.use_browser_fallback:
            # Browser TTS doesn't support streaming from server
            yield b""
            return

        # Check if full text is cached
        cache_key = self._get_cache_key(text)
        if cache_key in self.audio_cache:
            # Stream cached audio in chunks
            cached_audio = self.audio_cache[cache_key]
            chunk_size = 4096  # 4KB chunks for streaming
            for i in range(0, len(cached_audio), chunk_size):
                yield cached_audio[i:i + chunk_size]
            return

        # Stream synthesis in real-time
        try:
            loop = asyncio.get_event_loop()
            
            def synthesize_stream():
                if self.model:
                    for chunk in self.model.synthesize_stream_raw(text):
                        yield chunk
            
            # Run synthesis in thread pool and stream results
            for chunk in await loop.run_in_executor(self.executor, synthesize_stream):
                yield chunk

        except Exception as e:
            metrics_collector.log_event("WARN", f"TTS streaming error: {str(e)}")
            yield b""

    async def synthesize_speech_optimized(self, text: str) -> AsyncGenerator[bytes, None]:
        """
        Optimized synthesis with progressive streaming
        Starts streaming before full synthesis is complete
        """
        if self.use_browser_fallback or not self.model:
            yield b""
            return

        # For short texts, use full synthesis
        if len(text) < 50:
            audio = await self.synthesize_speech(text)
            if audio:
                yield audio
            return

        # For longer texts, split and stream progressively
        sentences = text.split('.')
        current_sentence = ""
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            current_sentence += sentence + "."
            
            # Synthesize and yield when we have a complete sentence
            if len(current_sentence) > 30 or sentence.endswith(('!', '?')):
                audio = await self.synthesize_speech(current_sentence)
                if audio:
                    yield audio
                current_sentence = ""
        
        # Handle remaining text
        if current_sentence.strip():
            audio = await self.synthesize_speech(current_sentence)
            if audio:
                yield audio

    def estimate_duration_ms(self, text: str) -> float:
        """Estimate audio duration in milliseconds"""
        # Rough estimate: ~150 words per minute = 2.5 words per second
        words = len(text.split())
        duration_s = words / 2.5
        return duration_s * 1000

    def get_supported_voices(self) -> list:
        """Get list of available voices"""
        return [
            {"id": "en_US-lessac-medium", "name": "English (US) - Lessac", "language": "en"},
            {"id": "en_GB-alan-medium", "name": "English (UK) - Alan", "language": "en"},
            {"id": "hi_IN-medium", "name": "Hindi (India)", "language": "hi"},
        ]

    def get_cached_phrases(self) -> list:
        """Get list of pre-cached phrases"""
        return self.common_phrases

    def get_stats(self) -> dict:
        """Get TTS service statistics"""
        return {
            "model_loaded": self.model is not None,
            "use_browser_fallback": self.use_browser_fallback,
            "sample_rate": self.sample_rate,
            "cache_size": len(self.audio_cache),
            "max_cache_size": self.max_cache_size,
            "pre_synthesized_phrases": len(self.common_phrases),
            "voice_name": self.voice_name
        }

    def clear_cache(self):
        """Clear audio cache"""
        self.audio_cache.clear()


# Global TTS service instance (pre-loaded)
tts_service = OptimizedTTSService()
