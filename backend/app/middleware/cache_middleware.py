"""
Response caching middleware for GET requests.
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse
import json
import hashlib
import logging
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)


class CacheMiddleware(BaseHTTPMiddleware):
    """Middleware to cache GET responses in Redis."""

    def __init__(self, app, ttl: int = 300, exclude_paths: list = None):
        super().__init__(app)
        self.ttl = ttl
        self.exclude_paths = exclude_paths or ["/api/v1/auth", "/api/v1/health", "/docs", "/openapi.json"]

    async def dispatch(self, request: Request, call_next):
        # Only cache GET requests
        if request.method != "GET":
            return await call_next(request)

        # Skip excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        redis_client = await get_redis()
        if redis_client is None:
            return await call_next(request)

        # Generate cache key
        cache_key = self._generate_cache_key(request)

        try:
            # Try to get from cache
            cached_response = await redis_client.get(cache_key)
            if cached_response:
                logger.debug(f"[Cache Middleware] Hit for {request.url.path}")
                cached_data = json.loads(cached_response)
                return StarletteResponse(
                    content=cached_data["body"],
                    status_code=cached_data["status_code"],
                    headers=cached_data["headers"],
                    media_type=cached_data.get("media_type", "application/json")
                )

            # Cache miss - execute request
            response = await call_next(request)

            # Only cache successful responses
            if response.status_code == 200:
                # Read response body
                body = b""
                async for chunk in response.body_iterator:
                    body += chunk

                # Store in cache
                cache_data = {
                    "body": body.decode("utf-8"),
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "media_type": response.media_type
                }

                await redis_client.setex(cache_key, self.ttl, json.dumps(cache_data))
                logger.debug(f"[Cache Middleware] Stored {request.url.path}: {cache_key} (TTL: {self.ttl}s)")

                # Return new response with the body
                return StarletteResponse(
                    content=body,
                    status_code=response.status_code,
                    headers=response.headers,
                    media_type=response.media_type
                )

            return response

        except Exception as e:
            logger.warning(f"[Cache Middleware] Error for {request.url.path}: {e}")
            return await call_next(request)

    def _generate_cache_key(self, request: Request) -> str:
        """Generate a unique cache key for the request."""
        # Include path, query parameters, and relevant headers
        key_data = {
            "path": request.url.path,
            "query": str(request.query_params),
            "user_agent": request.headers.get("user-agent", ""),
        }

        key_string = json.dumps(key_data, sort_keys=True)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"response_cache:{key_hash}"
