"""
Cache manager for FarmVoice voice service
Implements TTL-based caching with provenance tracking
"""

import time
import hashlib
import json
from typing import Any, Optional, Dict, Tuple
from threading import Lock
from dataclasses import dataclass
from datetime import datetime, timezone

from .config import config

@dataclass
class CacheEntry:
    """Cache entry with TTL and provenance"""
    value: Any
    timestamp: float
    ttl: int
    provenance: str = "live"
    
    def is_expired(self) -> bool:
        """Check if cache entry has expired"""
        return (time.time() - self.timestamp) > self.ttl
    
    def age_seconds(self) -> float:
        """Get age of cache entry in seconds"""
        return time.time() - self.timestamp

class CacheManager:
    """Thread-safe cache manager with TTL support"""
    
    def __init__(self):
        self.cache: Dict[str, CacheEntry] = {}
        self.lock = Lock()
        self.hits = 0
        self.misses = 0
    
    def _generate_key(self, namespace: str, *args, **kwargs) -> str:
        """Generate cache key from namespace and parameters"""
        key_data = f"{namespace}:{json.dumps(args, sort_keys=True)}:{json.dumps(kwargs, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, namespace: str, *args, **kwargs) -> Tuple[Optional[Any], bool]:
        """
        Get value from cache
        Returns: (value, is_cached) tuple
        """
        key = self._generate_key(namespace, *args, **kwargs)
        
        with self.lock:
            if key in self.cache:
                entry = self.cache[key]
                
                if not entry.is_expired():
                    self.hits += 1
                    return entry.value, True
                else:
                    # Remove expired entry
                    del self.cache[key]
            
            self.misses += 1
            return None, False
    
    def set(self, namespace: str, value: Any, ttl: Optional[int] = None, *args, **kwargs):
        """Set value in cache with TTL"""
        key = self._generate_key(namespace, *args, **kwargs)
        
        # Determine TTL based on namespace
        if ttl is None:
            ttl = self._get_default_ttl(namespace)
        
        entry = CacheEntry(
            value=value,
            timestamp=time.time(),
            ttl=ttl,
            provenance="live"
        )
        
        with self.lock:
            self.cache[key] = entry
    
    def _get_default_ttl(self, namespace: str) -> int:
        """Get default TTL for a namespace"""
        ttl_map = {
            "weather": config.cache_ttl_weather_s,
            "market": config.cache_ttl_market_s,
            "soil": config.cache_ttl_soil_s,
            "fertilizer": 86400,  # 24 hours
            "crop_recommendation": 3600,  # 1 hour
        }
        return ttl_map.get(namespace, 300)  # Default 5 minutes
    
    def invalidate(self, namespace: str, *args, **kwargs):
        """Invalidate a specific cache entry"""
        key = self._generate_key(namespace, *args, **kwargs)
        
        with self.lock:
            if key in self.cache:
                del self.cache[key]
    
    def invalidate_namespace(self, namespace: str):
        """Invalidate all entries in a namespace"""
        with self.lock:
            keys_to_delete = [
                key for key, entry in self.cache.items()
                if key.startswith(namespace)
            ]
            for key in keys_to_delete:
                del self.cache[key]
    
    def clear(self):
        """Clear all cache entries"""
        with self.lock:
            self.cache.clear()
            self.hits = 0
            self.misses = 0
    
    def cleanup_expired(self):
        """Remove all expired entries"""
        with self.lock:
            expired_keys = [
                key for key, entry in self.cache.items()
                if entry.is_expired()
            ]
            for key in expired_keys:
                del self.cache[key]
    
    def get_stats(self) -> dict:
        """Get cache statistics"""
        with self.lock:
            total = self.hits + self.misses
            hit_rate = (self.hits / total * 100) if total > 0 else 0
            
            return {
                "hits": self.hits,
                "misses": self.misses,
                "hit_rate": round(hit_rate, 2),
                "entries": len(self.cache),
                "size_bytes": sum(
                    len(json.dumps(entry.value).encode())
                    for entry in self.cache.values()
                )
            }
    
    def get_entry_info(self, namespace: str, *args, **kwargs) -> Optional[dict]:
        """Get information about a cache entry"""
        key = self._generate_key(namespace, *args, **kwargs)
        
        with self.lock:
            if key in self.cache:
                entry = self.cache[key]
                return {
                    "exists": True,
                    "expired": entry.is_expired(),
                    "age_seconds": entry.age_seconds(),
                    "ttl": entry.ttl,
                    "provenance": entry.provenance,
                    "timestamp": datetime.fromtimestamp(entry.timestamp, tz=timezone.utc).isoformat()
                }
            
            return {"exists": False}

# Global cache manager instance
cache_manager = CacheManager()
