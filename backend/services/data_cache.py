"""
Data Cache Service for FarmVoice Backend
Provides in-memory + file-based caching for API responses with TTL support.
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Any, Optional, Dict
import threading

class DataCache:
    """
    Simple in-memory + file cache for API responses.
    - TTL-based invalidation
    - Thread-safe operations
    - Optional file persistence for offline usage
    """
    
    CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache")
    
    def __init__(self):
        self._memory_cache: Dict[str, tuple] = {}  # key -> (data, expiry_time)
        self._lock = threading.Lock()
        
        # Create cache directory if not exists
        if not os.path.exists(self.CACHE_DIR):
            try:
                os.makedirs(self.CACHE_DIR)
            except Exception:
                pass
    
    def _get_cache_key(self, prefix: str, params: dict) -> str:
        """Generate a unique cache key from prefix and parameters."""
        param_str = json.dumps(params, sort_keys=True)
        hash_val = hashlib.md5(param_str.encode()).hexdigest()[:12]
        return f"{prefix}_{hash_val}"
    
    def _get_file_path(self, key: str) -> str:
        """Get file path for a cache key."""
        return os.path.join(self.CACHE_DIR, f"{key}.json")
    
    def get(self, prefix: str, params: dict, ttl_minutes: int = 60) -> Optional[Any]:
        """
        Get cached data if available and not expired.
        
        Args:
            prefix: Cache key prefix (e.g., 'weather', 'market')
            params: Parameters that identify the cached data
            ttl_minutes: Time-to-live in minutes (used for validation)
            
        Returns:
            Cached data if valid, None otherwise
        """
        key = self._get_cache_key(prefix, params)
        
        # Check memory cache first
        with self._lock:
            if key in self._memory_cache:
                data, expiry_time = self._memory_cache[key]
                if datetime.now() < expiry_time:
                    return data
                else:
                    # Expired, remove from memory
                    del self._memory_cache[key]
        
        # Check file cache
        file_path = self._get_file_path(key)
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    cached = json.load(f)
                    
                expiry_str = cached.get('_expiry')
                if expiry_str:
                    expiry_time = datetime.fromisoformat(expiry_str)
                    if datetime.now() < expiry_time:
                        data = cached.get('data')
                        # Also store in memory for faster access
                        with self._lock:
                            self._memory_cache[key] = (data, expiry_time)
                        return data
                    
                # Expired file, delete it
                os.remove(file_path)
            except Exception:
                pass
        
        return None
    
    def set(self, prefix: str, params: dict, data: Any, ttl_minutes: int = 60, persist: bool = True):
        """
        Cache data with TTL.
        
        Args:
            prefix: Cache key prefix
            params: Parameters that identify the cached data
            data: Data to cache
            ttl_minutes: Time-to-live in minutes
            persist: Whether to save to file for offline access
        """
        key = self._get_cache_key(prefix, params)
        expiry_time = datetime.now() + timedelta(minutes=ttl_minutes)
        
        # Store in memory
        with self._lock:
            self._memory_cache[key] = (data, expiry_time)
        
        # Persist to file if requested
        if persist:
            try:
                file_path = self._get_file_path(key)
                cached = {
                    'data': data,
                    '_expiry': expiry_time.isoformat(),
                    '_created': datetime.now().isoformat(),
                    '_params': params
                }
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(cached, f, indent=2, default=str)
            except Exception as e:
                print(f"Warning: Failed to persist cache: {e}")
    
    def invalidate(self, prefix: str, params: dict):
        """Invalidate a specific cache entry."""
        key = self._get_cache_key(prefix, params)
        
        # Remove from memory
        with self._lock:
            if key in self._memory_cache:
                del self._memory_cache[key]
        
        # Remove file
        file_path = self._get_file_path(key)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
    
    def clear_expired(self):
        """Clean up expired cache entries."""
        now = datetime.now()
        
        # Clean memory cache
        with self._lock:
            expired_keys = [
                key for key, (_, expiry) in self._memory_cache.items()
                if now >= expiry
            ]
            for key in expired_keys:
                del self._memory_cache[key]
        
        # Clean file cache
        if os.path.exists(self.CACHE_DIR):
            for filename in os.listdir(self.CACHE_DIR):
                if filename.endswith('.json'):
                    file_path = os.path.join(self.CACHE_DIR, filename)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            cached = json.load(f)
                        expiry_str = cached.get('_expiry')
                        if expiry_str:
                            expiry_time = datetime.fromisoformat(expiry_str)
                            if now >= expiry_time:
                                os.remove(file_path)
                    except Exception:
                        pass

# Global cache instance
data_cache = DataCache()
