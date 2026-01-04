"""
Caching decorators and utilities for Redis.
"""
import json
import hashlib
from functools import wraps
from typing import Any, Callable, Optional
import logging
from app.core.redis_client import get_redis, is_redis_available

logger = logging.getLogger(__name__)

def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate a cache key from function arguments."""
    # Create a string representation of arguments
    key_data = f"{prefix}:{args}:{sorted(kwargs.items())}"
    # Hash to ensure consistent key length
    return f"cache:{hashlib.md5(key_data.encode()).hexdigest()}"

def serialize_data(data: Any) -> str:
    """Serialize data for Redis storage."""
    if hasattr(data, 'dict'):  # Pydantic model
        return json.dumps(data.dict())
    elif hasattr(data, '__dict__'):  # Regular object
        return json.dumps(data.__dict__)
    else:
        return json.dumps(data, default=str)

def deserialize_data(data_str: str) -> Any:
    """Deserialize data from Redis."""
    try:
        return json.loads(data_str)
    except json.JSONDecodeError:
        return data_str

def cache_result(ttl: int = 1800, key_prefix: str = ""):
    """
    Decorator to cache function results in Redis.
    
    Args:
        ttl: Time to live in seconds (default: 30 minutes)
        key_prefix: Prefix for cache key
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Check if Redis is available
            if not await is_redis_available():
                logger.warning("Redis not available, executing function without cache")
                return await func(*args, **kwargs)
            
            redis_client = get_redis()
            if not redis_client:
                return await func(*args, **kwargs)
            
            # Generate cache key
            prefix = key_prefix or func.__name__
            cache_key = generate_cache_key(prefix, *args, **kwargs)
            
            try:
                # Try to get from cache
                cached_result = await redis_client.get(cache_key)
                if cached_result:
                    logger.debug(f"Cache hit for key: {cache_key}")
                    return deserialize_data(cached_result)
                
                # Cache miss - execute function
                logger.debug(f"Cache miss for key: {cache_key}")
                result = await func(*args, **kwargs)
                
                # Store in cache
                serialized_result = serialize_data(result)
                await redis_client.setex(cache_key, ttl, serialized_result)
                logger.debug(f"Cached result for key: {cache_key}")
                
                return result
                
            except Exception as e:
                logger.error(f"Cache error for key {cache_key}: {e}")
                # Fallback to function execution
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator

async def invalidate_cache_pattern(pattern: str) -> int:
    """
    Invalidate cache keys matching a pattern.
    
    Args:
        pattern: Redis key pattern (e.g., "cache:repo_*")
    
    Returns:
        Number of keys deleted
    """
    if not await is_redis_available():
        return 0
    
    redis_client = get_redis()
    if not redis_client:
        return 0
    
    try:
        keys = await redis_client.keys(pattern)
        if keys:
            deleted = await redis_client.delete(*keys)
            logger.info(f"Invalidated {deleted} cache keys matching pattern: {pattern}")
            return deleted
        return 0
    except Exception as e:
        logger.error(f"Error invalidating cache pattern {pattern}: {e}")
        return 0

async def get_cache_stats() -> dict:
    """Get Redis cache statistics."""
    if not await is_redis_available():
        return {"status": "unavailable"}
    
    redis_client = get_redis()
    if not redis_client:
        return {"status": "unavailable"}
    
    try:
        info = await redis_client.info()
        cache_keys = await redis_client.keys("cache:*")
        
        return {
            "status": "available",
            "total_keys": len(cache_keys),
            "memory_used": info.get("used_memory_human", "unknown"),
            "connected_clients": info.get("connected_clients", 0),
            "hits": info.get("keyspace_hits", 0),
            "misses": info.get("keyspace_misses", 0)
        }
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        return {"status": "error", "error": str(e)}
