"""
Optimized Cache Manager for FarmVoice Voice Service
Implements:
- TTL-based caching with provenance tracking
- Semantic caching for similar queries
- LRU eviction for memory management
- Redis support (optional)
"""

import time
import hashlib
import json
import re
from typing import Any, Optional, Dict, Tuple, List
from threading import Lock
from dataclasses import dataclass, field
from datetime import datetime, timezone
from collections import OrderedDict
import asyncio

from .config import config

# Try to import redis, fallback to memory-only if not available
try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    aioredis = None


@dataclass
class CacheEntry:
    """Cache entry with TTL and provenance"""
    value: Any
    timestamp: float
    ttl: int
    provenance: str = "live"
    query_hash: str = ""
    access_count: int = 0
    last_access: float = field(default_factory=time.time)

    def is_expired(self) -> bool:
        """Check if cache entry has expired"""
        return (time.time() - self.timestamp) > self.ttl

    def age_seconds(self) -> float:
        """Get age of cache entry in seconds"""
        return time.time() - self.timestamp

    def touch(self):
        """Update access time and count"""
        self.access_count += 1
        self.last_access = time.time()


class SemanticCache:
    """
    Semantic caching using simple text similarity.
    For production, replace with vector embeddings (sentence-transformers).
    """
    
    def __init__(self, max_entries: int = 1000, similarity_threshold: float = 0.85):
        self.entries: OrderedDict[str, Dict] = OrderedDict()
        self.max_entries = max_entries
        self.similarity_threshold = similarity_threshold
        self.lock = Lock()
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for comparison"""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
        return text
    
    def _jaccard_similarity(self, text1: str, text2: str) -> float:
        """Calculate Jaccard similarity between two texts"""
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        
        return intersection / union if union > 0 else 0.0
    
    def _token_sort_similarity(self, text1: str, text2: str) -> float:
        """Token sort ratio similarity"""
        words1 = sorted(text1.split())
        words2 = sorted(text2.split())
        
        if not words1 or not words2:
            return 0.0
        
        # Simple ratio of matching tokens
        matches = sum(1 for w1, w2 in zip(words1, words2) if w1 == w2)
        max_len = max(len(words1), len(words2))
        
        return matches / max_len if max_len > 0 else 0.0
    
    def find_similar(self, query: str) -> Optional[Tuple[str, Any]]:
        """Find semantically similar cached query"""
        normalized = self._normalize_text(query)
        
        with self.lock:
            for cached_query, entry in self.entries.items():
                if entry.get('expired', True):
                    continue
                
                cached_normalized = self._normalize_text(cached_query)
                
                # Use best of multiple similarity metrics
                similarity = max(
                    self._jaccard_similarity(normalized, cached_normalized),
                    self._token_sort_similarity(normalized, cached_normalized)
                )
                
                if similarity >= self.similarity_threshold:
                    # Move to end (most recently used)
                    self.entries.move_to_end(cached_query)
                    return cached_query, entry.get('value')
        
        return None
    
    def set(self, query: str, value: Any, ttl: int):
        """Add entry to semantic cache"""
        normalized = self._normalize_text(query)
        
        with self.lock:
            # Evict oldest if at capacity
            while len(self.entries) >= self.max_entries:
                self.entries.popitem(last=False)
            
            self.entries[query] = {
                'value': value,
                'timestamp': time.time(),
                'ttl': ttl,
                'expired': False,
                'normalized': normalized
            }
    
    def invalidate(self, query: str):
        """Remove entry from semantic cache"""
        with self.lock:
            if query in self.entries:
                del self.entries[query]
    
    def cleanup_expired(self):
        """Remove expired entries"""
        current_time = time.time()
        
        with self.lock:
            expired_keys = []
            for query, entry in self.entries.items():
                if current_time - entry['timestamp'] > entry['ttl']:
                    entry['expired'] = True
                    expired_keys.append(query)
            
            for key in expired_keys:
                del self.entries[key]
    
    def get_stats(self) -> dict:
        """Get semantic cache statistics"""
        with self.lock:
            return {
                "entries": len(self.entries),
                "max_entries": self.max_entries,
                "threshold": self.similarity_threshold
            }


class OptimizedCacheManager:
    """
    Enhanced cache manager with:
    - LRU eviction
    - Semantic caching
    - Async Redis support (optional)
    - Query response caching
    """

    def __init__(self, use_redis: bool = False, redis_url: str = "redis://localhost:6379"):
        self.cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self.lock = Lock()
        self.hits = 0
        self.misses = 0
        
        # Semantic cache for query responses
        self.semantic_cache = SemanticCache(max_entries=500, similarity_threshold=0.85)
        
        # Redis support (optional)
        self.use_redis = use_redis and REDIS_AVAILABLE
        self.redis_client = None
        self.redis_url = redis_url
        
        # Fast intent cache (exact match for common queries)
        self.fast_intent_cache: Dict[str, Any] = {
            "hello": {"speech": "Hello! How can I help you today?", "intent": "greeting", "actions": []},
            "hi": {"speech": "Hello! How can I help you today?", "intent": "greeting", "actions": []},
            "hey": {"speech": "Hello! How can I help you today?", "intent": "greeting", "actions": []},
            "good morning": {"speech": "Good morning! What can I help you with?", "intent": "greeting", "actions": []},
            "good evening": {"speech": "Good evening! How can I assist you?", "intent": "greeting", "actions": []},
            "help": {"speech": "I can help with weather updates, crop recommendations, disease diagnosis, and market prices. Just ask!", "intent": "help", "actions": []},
            "what can you do": {"speech": "I can help with weather updates, crop recommendations, disease diagnosis, and market prices. Just ask!", "intent": "help", "actions": []},
            "thank you": {"speech": "You're welcome! Anything else I can help with?", "intent": "greeting", "actions": []},
            "thanks": {"speech": "You're welcome! Anything else I can help with?", "intent": "greeting", "actions": []},
            "bye": {"speech": "Goodbye! Have a great day!", "intent": "greeting", "actions": []},
            "goodbye": {"speech": "Goodbye! Have a great day!", "intent": "greeting", "actions": []},
        }
        
        # FAQ cache for common farming questions
        self.faq_cache = self._build_faq_cache()
        
        # Max cache size for LRU
        self.max_cache_size = 2000

    def _build_faq_cache(self) -> Dict[str, Any]:
        """Build FAQ cache with common farming queries"""
        faq_patterns = {
            r"weather.*today|today.*weather": {
                "speech": "Let me check the current weather conditions for your location.",
                "intent": "weather_check",
                "actions": [{"type": "read", "entity": "weather", "params": {}}]
            },
            r"crop.*recommend|recommend.*crop": {
                "speech": "I'll recommend crops based on your location and soil conditions.",
                "intent": "crop_recommendation",
                "actions": [{"type": "read", "entity": "crop_recommendation", "params": {}}]
            },
            r"market.*price|price.*market|crop.*price": {
                "speech": "Let me get the current market prices for crops.",
                "intent": "market_prices",
                "actions": [{"type": "read", "entity": "market", "params": {}}]
            },
            r"disease.*treat|treat.*disease|pest.*control": {
                "speech": "I'll help you identify and treat the crop disease.",
                "intent": "disease",
                "actions": [{"type": "read", "entity": "disease_diagnosis", "params": {}}]
            },
        }
        return faq_patterns

    async def initialize_redis(self):
        """Initialize Redis connection if enabled"""
        if self.use_redis and aioredis:
            try:
                self.redis_client = aioredis.from_url(
                    self.redis_url,
                    encoding="utf-8",
                    decode_responses=True
                )
                await self.redis_client.ping()
                print("Redis cache initialized successfully")
            except Exception as e:
                print(f"Redis connection failed: {e}, falling back to memory cache")
                self.use_redis = False

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
                    entry.touch()
                    # Move to end for LRU
                    self.cache.move_to_end(key)
                    self.hits += 1
                    return entry.value, True
                else:
                    # Remove expired entry
                    del self.cache[key]

            self.misses += 1
            return None, False

    def set(self, namespace: str, value: Any, ttl: Optional[int] = None, *args, **kwargs):
        """Set value in cache with TTL and LRU eviction"""
        key = self._generate_key(namespace, *args, **kwargs)

        # Determine TTL based on namespace
        if ttl is None:
            ttl = self._get_default_ttl(namespace)

        entry = CacheEntry(
            value=value,
            timestamp=time.time(),
            ttl=ttl,
            provenance="live",
            query_hash=key
        )

        with self.lock:
            # LRU eviction if at capacity
            while len(self.cache) >= self.max_cache_size:
                self.cache.popitem(last=False)
            
            self.cache[key] = entry

    def _get_default_ttl(self, namespace: str) -> int:
        """Get default TTL for a namespace"""
        ttl_map = {
            "weather": config.cache_ttl_weather_s,
            "market": config.cache_ttl_market_s,
            "soil": config.cache_ttl_soil_s,
            "fertilizer": 86400,  # 24 hours
            "crop_recommendation": 3600,  # 1 hour
            "query_response": 300,  # 5 minutes for query responses
            "llm_response": 600,  # 10 minutes for LLM responses
        }
        return ttl_map.get(namespace, 300)  # Default 5 minutes

    # ========== Fast Intent Cache ==========
    
    def get_fast_intent_response(self, query: str) -> Optional[Dict[str, Any]]:
        """Get cached response for fast intent queries"""
        query_lower = query.lower().strip()
        
        # Exact match
        if query_lower in self.fast_intent_cache:
            return self.fast_intent_cache[query_lower]
        
        # Pattern match for FAQs
        for pattern, response in self.faq_cache.items():
            if re.search(pattern, query_lower, re.IGNORECASE):
                return response
        
        return None

    # ========== Semantic Cache ==========
    
    def get_semantic_cached(self, query: str) -> Optional[Dict[str, Any]]:
        """Get semantically similar cached response"""
        result = self.semantic_cache.find_similar(query)
        if result:
            self.hits += 1
            return result[1]
        self.misses += 1
        return None
    
    def set_semantic_cached(self, query: str, response: Dict[str, Any], ttl: int = 300):
        """Cache response with semantic similarity"""
        self.semantic_cache.set(query, response, ttl)

    # ========== Query Response Caching ==========
    
    def cache_query_response(self, query: str, user_id: str, response: Dict[str, Any], ttl: int = 300):
        """Cache a complete query response"""
        # Cache by normalized query + user context hash
        context_hash = hashlib.md5(f"{user_id}:{json.dumps(response.get('context', {}), sort_keys=True)}".encode()).hexdigest()[:8]
        key = f"query:{context_hash}:{hashlib.md5(query.lower().encode()).hexdigest()[:12]}"
        
        with self.lock:
            if len(self.cache) >= self.max_cache_size:
                self.cache.popitem(last=False)
            
            self.cache[key] = CacheEntry(
                value=response,
                timestamp=time.time(),
                ttl=ttl,
                provenance="cached",
                query_hash=key
            )
    
    def get_cached_query_response(self, query: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached query response"""
        context_hash = hashlib.md5(f"{user_id}".encode()).hexdigest()[:8]
        key = f"query:{context_hash}:{hashlib.md5(query.lower().encode()).hexdigest()[:12]}"
        
        with self.lock:
            if key in self.cache:
                entry = self.cache[key]
                if not entry.is_expired():
                    entry.touch()
                    self.cache.move_to_end(key)
                    self.hits += 1
                    return entry.value
                else:
                    del self.cache[key]
            
            self.misses += 1
            return None

    # ========== Async Redis Methods ==========
    
    async def redis_get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        if not self.use_redis or not self.redis_client:
            return None
        
        try:
            value = await self.redis_client.get(key)
            if value:
                self.hits += 1
                return json.loads(value)
            self.misses += 1
            return None
        except Exception as e:
            print(f"Redis get error: {e}")
            return None
    
    async def redis_set(self, key: str, value: Any, ttl: int = 300):
        """Set value in Redis"""
        if not self.use_redis or not self.redis_client:
            return
        
        try:
            await self.redis_client.setex(
                key,
                ttl,
                json.dumps(value, default=str)
            )
        except Exception as e:
            print(f"Redis set error: {e}")

    # ========== Utility Methods ==========

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
                key for key in self.cache.keys()
                if key.startswith(namespace)
            ]
            for key in keys_to_delete:
                del self.cache[key]

    def clear(self):
        """Clear all cache entries"""
        with self.lock:
            self.cache.clear()
            self.semantic_cache.entries.clear()
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
            
            self.semantic_cache.cleanup_expired()

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
                "semantic_entries": len(self.semantic_cache.entries),
                "fast_intent_entries": len(self.fast_intent_cache),
                "size_bytes": sum(
                    len(json.dumps(entry.value).encode())
                    for entry in self.cache.values()
                ),
                "redis_enabled": self.use_redis
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
                    "access_count": entry.access_count,
                    "timestamp": datetime.fromtimestamp(entry.timestamp, tz=timezone.utc).isoformat()
                }

            return {"exists": False}


# Global cache manager instance with optimizations
cache_manager = OptimizedCacheManager()
