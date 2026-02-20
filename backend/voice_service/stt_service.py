"""
Optimized Speech-to-Text Service for FarmVoice
Optimizations:
- Model pre-loading on startup
- Streaming transcription with partial results
- Audio chunk optimization (16kHz, smaller chunks)
- Parallel processing with asyncio
- VAD (Voice Activity Detection) integration
"""

import asyncio
import time
from typing import Optional, AsyncGenerator, Dict, Any
from concurrent.futures import ThreadPoolExecutor
import numpy as np

from .config import config
from .observability import metrics_collector, TimingContext


class OptimizedSTTService:
    """
    Optimized STT service with:
    - Pre-loaded Whisper model
    - Streaming support with partial results
    - Audio optimization (16kHz sample rate)
    - VAD for silence detection
    """

    def __init__(self):
        self.model_name = config.local_stt_model
        self.model = None
        self.use_browser_fallback = True
        self.sample_rate = config.audio_sample_rate  # 16kHz optimized
        self.chunk_duration_ms = 200  # Smaller chunks for faster response
        
        # Thread pool for CPU-bound transcription
        self.executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="stt_worker")
        
        # Pre-load model on startup
        self._initialize_model()
        
        # VAD state
        self.silence_start = None
        self.speech_detected = False

    def _initialize_model(self):
        """Pre-load faster-whisper model on startup"""
        try:
            from faster_whisper import WhisperModel

            model_path = config.models_dir / "whisper" / self.model_name

            # Load model with optimized settings for speed
            self.model = WhisperModel(
                str(model_path) if model_path.exists() else self.model_name,
                device="cpu",
                compute_type="int8",  # Quantized for speed
                cpu_threads=4,  # Parallel processing
            )

            self.use_browser_fallback = False
            metrics_collector.log_event("INFO", f"Faster-whisper model pre-loaded: {self.model_name}")
            print(f"[STT] Model pre-loaded: {self.model_name}")

        except ImportError:
            metrics_collector.log_event("WARN", "faster-whisper not installed, using browser STT")
            self.use_browser_fallback = True
            print("[STT] Using browser fallback (faster-whisper not installed)")
        except Exception as e:
            metrics_collector.log_event("WARN", f"Failed to load whisper model: {str(e)}")
            self.use_browser_fallback = True
            print(f"[STT] Model load failed: {e}")

    def warm_up_model(self):
        """Warm up model with dummy input for faster first response"""
        if self.model and not self.use_browser_fallback:
            try:
                # Create small dummy audio array
                dummy_audio = np.zeros(16000, dtype=np.float32)  # 1 second of silence
                segments, info = self.model.transcribe(dummy_audio, language="en")
                print("[STT] Model warmed up successfully")
                return True
            except Exception as e:
                print(f"[STT] Warm-up failed: {e}")
        return False

    async def transcribe_stream(self, audio_chunks: AsyncGenerator[bytes, None]) -> AsyncGenerator[dict, None]:
        """
        Transcribe audio stream with partial results
        Yields: {"type": "partial"|"final", "text": "...", "timestamp": float, "is_speech": bool}
        """
        if self.use_browser_fallback:
            # Browser STT handles streaming on client side
            async for chunk in audio_chunks:
                pass
            yield {
                "type": "info",
                "text": "Using browser STT",
                "timestamp": 0,
                "is_speech": False
            }
        else:
            await self._transcribe_stream_optimized(audio_chunks)

    async def _transcribe_stream_optimized(self, audio_chunks: AsyncGenerator[bytes, None]):
        """Optimized streaming transcription with VAD"""
        audio_buffer = bytearray()
        chunk_samples = int(self.sample_rate * self.chunk_duration_ms / 1000)
        silence_threshold = 0.01
        silence_duration_ms = config.vad_silence_ms
        min_utterance_ms = config.vad_min_utterance_ms
        
        async for chunk in audio_chunks:
            audio_buffer.extend(chunk)
            
            # Process when we have enough audio
            while len(audio_buffer) >= chunk_samples * 2:  # 2 bytes per sample
                # Extract chunk
                chunk_data = bytes(audio_buffer[:chunk_samples * 2])
                audio_buffer = audio_buffer[chunk_samples * 2:]
                
                # Convert to numpy
                audio_array = np.frombuffer(chunk_data, dtype=np.int16).astype(np.float32) / 32768.0
                
                # VAD: Check if speech is present
                rms = np.sqrt(np.mean(audio_array ** 2))
                is_speech = rms > silence_threshold
                
                if is_speech:
                    if not self.speech_detected:
                        self.speech_detected = True
                        self.silence_start = None
                    
                    # Transcribe with partial results
                    partial_text = await self._transcribe_chunk_async(audio_array)
                    if partial_text.strip():
                        yield {
                            "type": "partial",
                            "text": partial_text,
                            "timestamp": time.time(),
                            "is_speech": True
                        }
                else:
                    if self.speech_detected:
                        if self.silence_start is None:
                            self.silence_start = time.time()
                        elif (time.time() - self.silence_start) * 1000 > silence_duration_ms:
                            # End of utterance detected
                            self.speech_detected = False
                            self.silence_start = None
                            yield {
                                "type": "utterance_end",
                                "text": "",
                                "timestamp": time.time(),
                                "is_speech": False
                            }

    async def _transcribe_chunk_async(self, audio_array: np.ndarray) -> str:
        """Async wrapper for transcription (runs in thread pool)"""
        loop = asyncio.get_event_loop()
        
        def transcribe():
            segments, info = self.model.transcribe(
                audio_array,
                beam_size=1,  # Faster decoding
                best_of=1,
                temperature=0.0,  # Deterministic
                vad_filter=True,  # Built-in VAD
                vad_parameters=dict(
                    min_silence_duration_ms=500,
                    speech_pad_ms=200
                )
            )
            return " ".join([segment.text for segment in segments])
        
        return await loop.run_in_executor(self.executor, transcribe)

    async def transcribe_audio(self, audio_data: bytes) -> Optional[str]:
        """
        Transcribe complete audio file with optimized settings
        Returns: transcribed text
        """
        with TimingContext("stt_transcribe") as timer:
            try:
                if self.use_browser_fallback:
                    return None

                # Convert to numpy
                audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
                
                # Transcribe with optimized settings
                loop = asyncio.get_event_loop()
                
                def transcribe():
                    segments, info = self.model.transcribe(
                        audio_array,
                        language="en",  # Specify language for faster processing
                        beam_size=1,
                        best_of=1,
                        temperature=0.0,
                        vad_filter=True,
                        vad_parameters=dict(
                            min_silence_duration_ms=500,
                            speech_pad_ms=200
                        )
                    )
                    return " ".join([segment.text for segment in segments])
                
                text = await loop.run_in_executor(self.executor, transcribe)

                metrics_collector.log_event("INFO", f"STT completed in {timer.get_duration_ms():.0f}ms")
                return text

            except Exception as e:
                metrics_collector.log_event("WARN", f"STT error: {str(e)}")
                return None

    async def transcribe_parallel(self, audio_chunks: list) -> str:
        """
        Transcribe multiple audio chunks in parallel
        Useful for batch processing
        """
        if self.use_browser_fallback or not self.model:
            return ""
        
        async def transcribe_chunk(chunk: bytes) -> str:
            audio_array = np.frombuffer(chunk, dtype=np.int16).astype(np.float32) / 32768.0
            loop = asyncio.get_event_loop()
            
            def transcribe():
                segments, _ = self.model.transcribe(
                    audio_array,
                    beam_size=1,
                    temperature=0.0,
                    vad_filter=True
                )
                return " ".join([segment.text for segment in segments])
            
            return await loop.run_in_executor(self.executor, transcribe)
        
        # Process chunks in parallel
        tasks = [transcribe_chunk(chunk) for chunk in audio_chunks]
        results = await asyncio.gather(*tasks)
        
        return " ".join(results)

    def detect_intent_parallel(self, text: str) -> Optional[str]:
        """
        Detect intent in parallel with transcription
        Returns intent type for fast-path routing
        """
        if not text:
            return None
        
        text_lower = text.lower().strip()
        
        # Fast keyword matching (runs in parallel)
        intent_patterns = {
            "greeting": ["hello", "hi", "hey", "good morning", "good evening", "namaste"],
            "help": ["help", "what can you do", "how do i"],
            "weather": ["weather", "rain", "temperature", "forecast"],
            "market": ["price", "market", "rate", "cost"],
            "goodbye": ["bye", "goodbye", "see you"],
        }
        
        for intent, keywords in intent_patterns.items():
            if any(keyword in text_lower for keyword in keywords):
                return intent
        
        return None

    def get_supported_languages(self) -> list:
        """Get list of supported languages"""
        return ["en", "hi", "te", "ta", "kn", "ml"]

    def get_stats(self) -> dict:
        """Get STT service statistics"""
        return {
            "model_loaded": self.model is not None,
            "use_browser_fallback": self.use_browser_fallback,
            "sample_rate": self.sample_rate,
            "chunk_duration_ms": self.chunk_duration_ms,
            "model_name": self.model_name
        }


# Global STT service instance (pre-loaded)
stt_service = OptimizedSTTService()
