"""
Caching decorators and utilities with TTL support.
"""
import json
import hashlib
import asyncio
from functools import wraps
from typing import Any, Callable
import logging
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)


def cache_result(ttl: int = 1800, key_prefix: str = "cache"):
    """
    Decorator to cache function results in Redis.

    Args:
        ttl: Time to live in seconds (default: 1800 = 30 minutes)
        key_prefix: Prefix for cache keys
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            redis_client = await get_redis()

            # If Redis is not available, execute function directly
            if redis_client is None:
                logger.debug(f"[Cache] Redis unavailable, executing {func.__name__} directly")
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return func(*args, **kwargs)

            # Generate cache key
            cache_key = _generate_cache_key(func.__name__, key_prefix, *args, **kwargs)

            try:
                # Try to get from cache
                cached_result = await redis_client.get(cache_key)
                if cached_result:
                    logger.debug(f"[Cache] Hit for {func.__name__}: {cache_key}")
                    return _deserialize_result(cached_result)

                # Cache miss - execute function
                logger.debug(f"[Cache] Miss for {func.__name__}: {cache_key}")
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)

                # Store in cache
                serialized_result = _serialize_result(result)
                await redis_client.setex(cache_key, ttl, serialized_result)
                logger.debug(f"[Cache] Stored {func.__name__}: {cache_key} (TTL: {ttl}s)")

                return result

            except Exception as e:
                logger.warning(f"[Cache] Error for {func.__name__}: {e}")
                # Fallback to direct execution
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return func(*args, **kwargs)

        return wrapper
    return decorator


def _generate_cache_key(func_name: str, prefix: str, *args, **kwargs) -> str:
    """Generate a unique cache key for function arguments."""
    # Create a string representation of arguments
    args_str = json.dumps([str(arg) for arg in args], sort_keys=True)
    kwargs_str = json.dumps(kwargs, sort_keys=True, default=str)
    combined = f"{func_name}:{args_str}:{kwargs_str}"

    # Hash to ensure consistent key length
    key_hash = hashlib.md5(combined.encode()).hexdigest()
    return f"{prefix}:{func_name}:{key_hash}"


def _serialize_result(result: Any) -> str:
    """Serialize function result for Redis storage."""
    if hasattr(result, 'model_dump'):
        # Pydantic model
        return json.dumps(result.model_dump())
    elif isinstance(result, list) and result and hasattr(result[0], 'model_dump'):
        # List of Pydantic models
        return json.dumps([item.model_dump() for item in result])
    elif hasattr(result, '__dict__'):
        # Object with attributes
        return json.dumps(result.__dict__)
    elif isinstance(result, (list, dict, str, int, float, bool, type(None))):
        # JSON serializable types
        return json.dumps(result)
    else:
        # Fallback to string representation
        return json.dumps(str(result))


def _deserialize_result(cached_data: str) -> Any:
    """Deserialize cached result from Redis."""
    try:
        return json.loads(cached_data)
    except json.JSONDecodeError:
        return cached_data


async def invalidate_cache_pattern(pattern: str):
    """Invalidate all cache keys matching a pattern."""
    redis_client = await get_redis()
    if redis_client is None:
        return

    try:
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)
            logger.info(f"[Cache] Invalidated {len(keys)} keys matching pattern: {pattern}")
    except Exception as e:
        logger.warning(f"[Cache] Error invalidating pattern {pattern}: {e}")


async def get_cache_stats() -> dict:
    """Get basic cache statistics."""
    redis_client = await get_redis()
    if redis_client is None:
        return {"status": "unavailable"}

    try:
        info = await redis_client.info()
        return {
            "status": "connected",
            "used_memory": info.get("used_memory_human", "unknown"),
            "connected_clients": info.get("connected_clients", 0),
            "total_commands_processed": info.get("total_commands_processed", 0),
            "keyspace_hits": info.get("keyspace_hits", 0),
            "keyspace_misses": info.get("keyspace_misses", 0)
        }
    except Exception as e:
        logger.warning(f"[Cache] Error getting stats: {e}")
        return {"status": "error", "error": str(e)}
