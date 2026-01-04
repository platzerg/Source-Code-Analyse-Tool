"""
Response caching middleware for Redis.
"""
import json
import hashlib
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging
from app.core.redis_client import get_redis, is_redis_available

logger = logging.getLogger(__name__)

class CacheMiddleware(BaseHTTPMiddleware):
    """Middleware to cache GET responses in Redis."""
    
    def __init__(self, app, ttl: int = 300, exclude_paths: list = None):
        super().__init__(app)
        self.ttl = ttl
        self.exclude_paths = exclude_paths or ["/api/v1/auth", "/api/v1/health", "/docs", "/openapi.json"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only cache GET requests
        if request.method != "GET":
            return await call_next(request)
        
        # Skip excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)
        
        # Check if Redis is available
        if not await is_redis_available():
            return await call_next(request)
        
        redis_client = get_redis()
        if not redis_client:
            return await call_next(request)
        
        # Generate cache key from URL and query parameters
        cache_key = self._generate_cache_key(request)
        
        try:
            # Try to get cached response
            cached_response = await redis_client.get(cache_key)
            if cached_response:
                logger.debug(f"Cache hit for middleware key: {cache_key}")
                cached_data = json.loads(cached_response)
                return JSONResponse(
                    content=cached_data["content"],
                    status_code=cached_data["status_code"],
                    headers={"X-Cache": "HIT"}
                )
            
            # Cache miss - process request
            response = await call_next(request)
            
            # Only cache successful JSON responses
            if (response.status_code == 200 and 
                response.headers.get("content-type", "").startswith("application/json")):
                
                # Read response body
                response_body = b""
                async for chunk in response.body_iterator:
                    response_body += chunk
                
                try:
                    response_data = json.loads(response_body.decode())
                    cache_data = {
                        "content": response_data,
                        "status_code": response.status_code
                    }
                    
                    # Store in cache
                    await redis_client.setex(cache_key, self.ttl, json.dumps(cache_data))
                    logger.debug(f"Cached response for middleware key: {cache_key}")
                    
                    # Return response with cache miss header
                    return JSONResponse(
                        content=response_data,
                        status_code=response.status_code,
                        headers={"X-Cache": "MISS"}
                    )
                except json.JSONDecodeError:
                    # If response is not JSON, return as-is
                    pass
            
            return response
            
        except Exception as e:
            logger.error(f"Cache middleware error for key {cache_key}: {e}")
            return await call_next(request)
    
    def _generate_cache_key(self, request: Request) -> str:
        """Generate cache key from request URL and parameters."""
        url_with_params = str(request.url)
        key_hash = hashlib.md5(url_with_params.encode()).hexdigest()
        return f"middleware:response:{key_hash}"
