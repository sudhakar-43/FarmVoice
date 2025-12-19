"""
FarmVoice Voice Service Configuration
Loads settings from environment variables with sensible defaults
"""

import os
import json
import secrets
from pathlib import Path
from typing import Literal, Optional
from datetime import datetime, timezone

# Voice mode type
VoiceMode = Literal["local", "hybrid", "cloud"]

class VoiceConfig:
    """Voice service configuration with environment variable support"""
    
    def __init__(self):
        # Core mode settings
        self.voice_mode: VoiceMode = os.getenv("VOICE_MODE", "local")
        self.enable_compat_shim: bool = os.getenv("ENABLE_COMPAT_SHIM", "true").lower() == "true"
        self.allow_mode_persist: bool = os.getenv("ALLOW_MODE_PERSIST", "false").lower() == "true"
        
        # Model paths and settings
        self.local_llm_model: str = os.getenv("LOCAL_LLM_MODEL", "llama3.1")
        self.local_stt_model: str = os.getenv("LOCAL_STT_MODEL", "large-v3")
        self.local_tts_voice: str = os.getenv("LOCAL_TTS_VOICE", "en_US-lessac-medium")
        
        # Ollama settings
        self.ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.ollama_timeout: int = int(os.getenv("OLLAMA_TIMEOUT_MS", "800"))
        
        # Timeouts (milliseconds)
        self.voice_tool_timeout_ms: int = int(os.getenv("VOICE_TOOL_TIMEOUT_MS", "1000"))
        self.llm_plan_timeout_ms: int = int(os.getenv("LLM_PLAN_TIMEOUT_MS", "500"))
        self.llm_synth_timeout_ms: int = int(os.getenv("LLM_SYNTH_TIMEOUT_MS", "300"))
        self.stt_partial_timeout_ms: int = int(os.getenv("STT_PARTIAL_TIMEOUT_MS", "300"))
        self.tts_start_timeout_ms: int = int(os.getenv("TTS_START_TIMEOUT_MS", "400"))
        
        # Cache TTLs (seconds)
        self.cache_ttl_weather_s: int = int(os.getenv("VOICE_CACHE_TTL_WEATHER_S", "60"))
        self.cache_ttl_market_s: int = int(os.getenv("VOICE_CACHE_TTL_MARKET_S", "86400"))
        self.cache_ttl_soil_s: int = int(os.getenv("VOICE_CACHE_TTL_SOIL_S", "86400"))
        
        # Performance thresholds (milliseconds)
        self.warn_ms: int = int(os.getenv("VOICE_WARN_MS", "1800"))
        self.failsafe_ms: int = int(os.getenv("VOICE_FAILSAFE_MS", "2500"))
        
        # Admin API security
        self.admin_token: str = os.getenv("ADMIN_TOKEN", "")
        if not self.admin_token:
            # Generate a strong random token
            self.admin_token = secrets.token_urlsafe(32)
            print(f"\n{'='*60}")
            print(f"ADMIN_TOKEN_GENERATED: {self.admin_token}")
            print(f"Save this token securely! Use it in X-ADMIN-TOKEN header.")
            print(f"{'='*60}\n")
        
        # Admin API rate limiting
        self.admin_rate_limit: int = int(os.getenv("ADMIN_RATE_LIMIT_PER_MIN", "10"))
        
        # WebSocket settings
        self.ws_max_connections: int = int(os.getenv("WS_MAX_CONNECTIONS", "100"))
        self.ws_ping_interval: int = int(os.getenv("WS_PING_INTERVAL_S", "30"))
        self.ws_ping_timeout: int = int(os.getenv("WS_PING_TIMEOUT_S", "10"))
        
        # Audio settings
        self.audio_sample_rate: int = int(os.getenv("AUDIO_SAMPLE_RATE", "16000"))
        self.audio_chunk_ms: int = int(os.getenv("AUDIO_CHUNK_MS", "30"))
        self.vad_silence_ms: int = int(os.getenv("VAD_SILENCE_MS", "500"))
        self.vad_min_utterance_ms: int = int(os.getenv("VAD_MIN_UTTERANCE_MS", "400"))
        
        # Observability
        self.event_buffer_size: int = int(os.getenv("EVENT_BUFFER_SIZE", "200"))
        self.health_aggregation_5m: bool = True
        self.health_aggregation_1h: bool = True
        
        # Paths
        self.config_file_path: Path = Path(os.getenv("VOICE_CONFIG_PATH", "./farmvoice_config.json"))
        self.models_dir: Path = Path(os.getenv("MODELS_DIR", "./backend/models"))
        self.logs_dir: Path = Path(os.getenv("LOGS_DIR", "./backend/logs"))
        
        # Ensure directories exist
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        
        # Load persisted config if enabled
        if self.allow_mode_persist and self.config_file_path.exists():
            self._load_persisted_config()
    
    def _load_persisted_config(self):
        """Load configuration from persisted JSON file"""
        try:
            with open(self.config_file_path, 'r') as f:
                data = json.load(f)
                
            # Override with persisted values
            if "voice_mode" in data and data["voice_mode"] in ["local", "hybrid", "cloud"]:
                self.voice_mode = data["voice_mode"]
                print(f"Loaded persisted voice_mode: {self.voice_mode}")
            
            if "warn_ms" in data:
                self.warn_ms = int(data["warn_ms"])
            
            if "failsafe_ms" in data:
                self.failsafe_ms = int(data["failsafe_ms"])
                
        except Exception as e:
            print(f"Warning: Failed to load persisted config: {e}")
    
    def persist_config(self, updated_by: str = "admin"):
        """Persist current configuration to JSON file"""
        if not self.allow_mode_persist:
            return False
        
        try:
            # Create backup if file exists
            if self.config_file_path.exists():
                backup_path = self.config_file_path.with_suffix('.json.bak')
                self.config_file_path.rename(backup_path)
            
            config_data = {
                "voice_mode": self.voice_mode,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_by": updated_by,
                "source": "persisted",
                "warn_ms": self.warn_ms,
                "failsafe_ms": self.failsafe_ms,
                "note": "FarmVoice voice assistant configuration"
            }
            
            with open(self.config_file_path, 'w') as f:
                json.dump(config_data, f, indent=2)
            
            print(f"Configuration persisted to {self.config_file_path}")
            return True
            
        except Exception as e:
            print(f"Error persisting config: {e}")
            return False
    
    def update_mode(self, new_mode: VoiceMode, updated_by: str = "admin") -> bool:
        """Update voice mode with optional persistence"""
        if new_mode not in ["local", "hybrid", "cloud"]:
            return False
        
        self.voice_mode = new_mode
        
        if self.allow_mode_persist:
            return self.persist_config(updated_by)
        
        return True
    
    def update_thresholds(self, warn_ms: Optional[int] = None, failsafe_ms: Optional[int] = None) -> bool:
        """Update performance thresholds"""
        if warn_ms is not None:
            self.warn_ms = warn_ms
        
        if failsafe_ms is not None:
            self.failsafe_ms = failsafe_ms
        
        if self.allow_mode_persist:
            return self.persist_config("admin")
        
        return True
    
    def to_dict(self) -> dict:
        """Convert config to dictionary for API responses"""
        return {
            "voice_mode": self.voice_mode,
            "enable_compat_shim": self.enable_compat_shim,
            "allow_mode_persist": self.allow_mode_persist,
            "models": {
                "llm": self.local_llm_model,
                "stt": self.local_stt_model,
                "tts": self.local_tts_voice
            },
            "timeouts_ms": {
                "tool": self.voice_tool_timeout_ms,
                "llm_plan": self.llm_plan_timeout_ms,
                "llm_synth": self.llm_synth_timeout_ms,
                "stt_partial": self.stt_partial_timeout_ms,
                "tts_start": self.tts_start_timeout_ms
            },
            "cache_ttl_s": {
                "weather": self.cache_ttl_weather_s,
                "market": self.cache_ttl_market_s,
                "soil": self.cache_ttl_soil_s
            },
            "thresholds_ms": {
                "warn": self.warn_ms,
                "failsafe": self.failsafe_ms
            }
        }

# Global config instance
config = VoiceConfig()
