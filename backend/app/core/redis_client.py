"""
Redis client singleton for async operations.
"""
import os
import redis.asyncio as redis
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Global Redis client instance
_redis_client: Optional[redis.Redis] = None

def get_redis_url() -> str:
    """Get Redis URL from environment variables."""
    return os.getenv("REDIS_URL", "redis://localhost:6379")

async def init_redis() -> None:
    """Initialize Redis connection."""
    global _redis_client
    try:
        redis_url = get_redis_url()
        _redis_client = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
            retry_on_timeout=True
        )
        # Test connection
        await _redis_client.ping()
        logger.info(f"Redis connected successfully to {redis_url}")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        _redis_client = None

async def close_redis() -> None:
    """Close Redis connection."""
    global _redis_client
    if _redis_client:
        try:
            await _redis_client.close()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")
        finally:
            _redis_client = None

def get_redis() -> Optional[redis.Redis]:
    """Get Redis client instance."""
    return _redis_client

async def is_redis_available() -> bool:
    """Check if Redis is available."""
    if not _redis_client:
        return False
    try:
        await _redis_client.ping()
        return True
    except Exception:
        return False
