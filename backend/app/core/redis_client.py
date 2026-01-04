"""
Redis client singleton for caching operations.
"""
import redis.asyncio as redis
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

_redis_client: Optional[redis.Redis] = None


async def get_redis() -> Optional[redis.Redis]:
    """
    Get or create Redis client singleton.

    Returns:
        Optional[redis.Redis]: Redis client instance or None if connection fails
    """
    global _redis_client

    if _redis_client is None:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

        try:
            _redis_client = redis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            # Test connection
            await _redis_client.ping()
            logger.info(f"[Redis] Connected to {redis_url}")
        except Exception as e:
            logger.warning(f"[Redis] Connection failed: {e}. Caching disabled.")
            _redis_client = None

    return _redis_client


async def init_redis():
    """Initialize Redis connection during application startup."""
    await get_redis()


async def close_redis():
    """Close Redis connection during application shutdown."""
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None
        logger.info("[Redis] Connection closed")


def reset_redis_client():
    """Reset the Redis client (useful for testing)."""
    global _redis_client
    _redis_client = None
