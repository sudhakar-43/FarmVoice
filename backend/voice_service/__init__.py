"""
FarmVoice Real-Time Voice Assistant Service
Provides local-first STT, LLM, and TTS with streaming support
"""

from .config import config, VoiceConfig

__version__ = "1.0.0"
__all__ = ["config", "VoiceConfig"]
