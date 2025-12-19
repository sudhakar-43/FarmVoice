"""
Observability module for FarmVoice voice service
Tracks metrics, events, and provides health endpoint data
"""

import time
import logging
from collections import deque
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional
from threading import Lock
import statistics

from .config import config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(config.logs_dir / 'voice_service.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

EventType = Literal["INFO", "WARN", "FAILSAFE"]

@dataclass
class StageTimings:
    """Timings for each stage of voice processing"""
    stt_partial_ms: Optional[float] = None
    stt_final_ms: Optional[float] = None
    plan_ms: Optional[float] = None
    tools_ms: Optional[float] = None
    synth_ms: Optional[float] = None
    tts_start_ms: Optional[float] = None
    e2e_ms: Optional[float] = None
    
    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}

@dataclass
class RequestMetrics:
    """Metrics for a single request"""
    timestamp: str
    mode: str
    stages: StageTimings
    cached: bool = False
    failsafe: bool = False
    tool_results: Dict[str, bool] = field(default_factory=dict)  # tool_name -> success
    
    def to_dict(self) -> dict:
        return {
            "ts": self.timestamp,
            "mode": self.mode,
            "stages": self.stages.to_dict(),
            "cached": self.cached,
            "failsafe": self.failsafe,
            "tool_results": self.tool_results
        }

@dataclass
class Event:
    """Event log entry"""
    timestamp: str
    type: EventType
    message: str
    details: Optional[dict] = None
    
    def to_dict(self) -> dict:
        result = {
            "ts": self.timestamp,
            "type": self.type,
            "msg": self.message
        }
        if self.details:
            result["details"] = self.details
        return result

@dataclass
class StageStats:
    """Statistics for a single stage"""
    count: int = 0
    avg: float = 0.0
    p50: float = 0.0
    p95: float = 0.0
    max: float = 0.0
    
    def to_dict(self) -> dict:
        return asdict(self)

class MetricsCollector:
    """Collects and aggregates metrics for the voice service"""
    
    def __init__(self):
        self.lock = Lock()
        
        # Ring buffer for recent requests
        self.recent_requests: deque = deque(maxlen=config.event_buffer_size)
        
        # Event log
        self.events: deque = deque(maxlen=config.event_buffer_size)
        
        # Counters
        self.total_requests = 0
        self.cached_tool_hits = 0
        self.fallbacks = 0
        self.failsafes = 0
        
        # Time-windowed data for aggregation
        self.window_5m: deque = deque(maxlen=1000)  # ~5 min at 3 req/s
        self.window_1h: deque = deque(maxlen=12000)  # ~1 hour at 3 req/s
        
        # Latest request
        self.latest_request: Optional[RequestMetrics] = None
    
    def record_request(self, metrics: RequestMetrics):
        """Record a completed request"""
        with self.lock:
            self.total_requests += 1
            self.latest_request = metrics
            self.recent_requests.append(metrics)
            self.window_5m.append(metrics)
            self.window_1h.append(metrics)
            
            if metrics.cached:
                self.cached_tool_hits += 1
            
            if metrics.failsafe:
                self.failsafes += 1
            
            # Check thresholds and emit events
            if metrics.stages.e2e_ms:
                if metrics.stages.e2e_ms > config.failsafe_ms:
                    self.log_event("FAILSAFE", f"e2e_ms {metrics.stages.e2e_ms:.0f} > failsafe_ms {config.failsafe_ms}")
                elif metrics.stages.e2e_ms > config.warn_ms:
                    self.log_event("WARN", f"e2e_ms {metrics.stages.e2e_ms:.0f} > warn_ms {config.warn_ms}")
    
    def log_event(self, event_type: EventType, message: str, details: Optional[dict] = None):
        """Log an event"""
        event = Event(
            timestamp=datetime.now(timezone.utc).isoformat(),
            type=event_type,
            message=message,
            details=details
        )
        
        with self.lock:
            self.events.append(event)
        
        # Also log to file
        log_level = {
            "INFO": logging.INFO,
            "WARN": logging.WARNING,
            "FAILSAFE": logging.ERROR
        }.get(event_type, logging.INFO)
        
        logger.log(log_level, f"{event_type}: {message}", extra={"details": details})
    
    def _calculate_stage_stats(self, window: deque, stage_name: str) -> StageStats:
        """Calculate statistics for a specific stage from a time window"""
        values = []
        for req in window:
            stage_value = getattr(req.stages, stage_name, None)
            if stage_value is not None:
                values.append(stage_value)
        
        if not values:
            return StageStats()
        
        return StageStats(
            count=len(values),
            avg=round(statistics.mean(values), 1),
            p50=round(statistics.median(values), 1),
            p95=round(statistics.quantiles(values, n=20)[18], 1) if len(values) >= 20 else round(max(values), 1),
            max=round(max(values), 1)
        )
    
    def get_aggregates(self) -> dict:
        """Get aggregated statistics for different time windows"""
        with self.lock:
            stage_names = [
                "stt_partial_ms", "stt_final_ms", "plan_ms", 
                "tools_ms", "synth_ms", "tts_start_ms", "e2e_ms"
            ]
            
            aggregates = {}
            
            # 5-minute window
            if config.health_aggregation_5m:
                aggregates["5m"] = {
                    stage: self._calculate_stage_stats(self.window_5m, stage).to_dict()
                    for stage in stage_names
                }
            
            # 1-hour window
            if config.health_aggregation_1h:
                aggregates["1h"] = {
                    stage: self._calculate_stage_stats(self.window_1h, stage).to_dict()
                    for stage in stage_names
                }
            
            return aggregates
    
    def get_health_data(self) -> dict:
        """Get complete health data for the health endpoint"""
        with self.lock:
            return {
                "mode": config.voice_mode,
                "thresholds": {
                    "warn_ms": config.warn_ms,
                    "failsafe_ms": config.failsafe_ms
                },
                "latest": self.latest_request.to_dict() if self.latest_request else None,
                "aggregates": self.get_aggregates(),
                "events": [event.to_dict() for event in list(self.events)[-50:]],  # Last 50 events
                "counters": {
                    "requests": self.total_requests,
                    "cached_tool_hits": self.cached_tool_hits,
                    "fallbacks": self.fallbacks,
                    "failsafes": self.failsafes
                }
            }
    
    def record_fallback(self):
        """Record a fallback occurrence"""
        with self.lock:
            self.fallbacks += 1

# Global metrics collector instance
metrics_collector = MetricsCollector()

class TimingContext:
    """Context manager for timing operations"""
    
    def __init__(self, name: str):
        self.name = name
        self.start_time = None
        self.duration_ms = None
    
    def __enter__(self):
        self.start_time = time.perf_counter()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time:
            self.duration_ms = (time.perf_counter() - self.start_time) * 1000
            logger.debug(f"{self.name}: {self.duration_ms:.1f}ms")
    
    def get_duration_ms(self) -> float:
        """Get the duration in milliseconds"""
        return self.duration_ms if self.duration_ms is not None else 0.0
