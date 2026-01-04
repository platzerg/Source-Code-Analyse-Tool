# Redis Caching Best Practices for FastAPI Applications

## 1. Redis Integration Patterns with FastAPI

### Connection Management Pattern
```python
# app/redis.py
import redis.asyncio as redis
from fastapi import FastAPI
from contextlib import asynccontextmanager

class RedisManager:
    def __init__(self):
        self.redis_client = None
    
    async def connect(self):
        self.redis_client = redis.from_url(
            "redis://localhost:6379",
            encoding="utf-8",
            decode_responses=True,
            max_connections=20
        )
    
    async def disconnect(self):
        if self.redis_client:
            await self.redis_client.close()

redis_manager = RedisManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await redis_manager.connect()
    yield
    await redis_manager.disconnect()

app = FastAPI(lifespan=lifespan)
```

### Dependency Injection Pattern
```python
# app/dependencies.py
from fastapi import Depends
import redis.asyncio as redis

async def get_redis() -> redis.Redis:
    return redis_manager.redis_client
```

## 2. Async Redis Clients (aioredis)

### Installation and Basic Setup
```bash
pip install redis[hiredis] fastapi uvicorn
```

### Advanced Redis Client Configuration
```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    redis_max_connections: int = 20
    redis_retry_on_timeout: bool = True
    redis_socket_keepalive: bool = True
    redis_socket_keepalive_options: dict = {}

settings = Settings()

# app/redis_client.py
import redis.asyncio as redis
from app.config import settings

async def create_redis_pool():
    return redis.ConnectionPool.from_url(
        settings.redis_url,
        max_connections=settings.redis_max_connections,
        retry_on_timeout=settings.redis_retry_on_timeout,
        socket_keepalive=settings.redis_socket_keepalive,
        socket_keepalive_options=settings.redis_socket_keepalive_options
    )

class AsyncRedisClient:
    def __init__(self, pool):
        self.client = redis.Redis(connection_pool=pool)
    
    async def get(self, key: str):
        return await self.client.get(key)
    
    async def set(self, key: str, value: str, ex: int = None):
        return await self.client.set(key, value, ex=ex)
    
    async def delete(self, *keys):
        return await self.client.delete(*keys)
    
    async def exists(self, key: str):
        return await self.client.exists(key)
```

## 3. Caching Decorators and Middleware

### Function-Level Caching Decorator
```python
# app/cache_decorators.py
import json
import hashlib
from functools import wraps
from typing import Any, Callable
from fastapi import Depends
import redis.asyncio as redis

def cache_result(expire: int = 300, key_prefix: str = ""):
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            redis_client = kwargs.pop('redis_client', None)
            if not redis_client:
                return await func(*args, **kwargs)
            
            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{_generate_key(args, kwargs)}"
            
            # Try to get from cache
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await redis_client.set(cache_key, json.dumps(result), ex=expire)
            return result
        return wrapper
    return decorator

def _generate_key(args, kwargs) -> str:
    key_data = str(args) + str(sorted(kwargs.items()))
    return hashlib.md5(key_data.encode()).hexdigest()

# Usage example
@cache_result(expire=600, key_prefix="user_data")
async def get_user_profile(user_id: int, redis_client: redis.Redis = Depends(get_redis)):
    # Expensive database operation
    return {"user_id": user_id, "profile": "data"}
```

### Response Caching Middleware
```python
# app/middleware.py
import json
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class RedisCacheMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis_client, default_expire: int = 300):
        super().__init__(app)
        self.redis_client = redis_client
        self.default_expire = default_expire
    
    async def dispatch(self, request: Request, call_next):
        # Only cache GET requests
        if request.method != "GET":
            return await call_next(request)
        
        cache_key = f"response:{request.url.path}:{request.query_params}"
        
        # Check cache
        cached_response = await self.redis_client.get(cache_key)
        if cached_response:
            data = json.loads(cached_response)
            return Response(
                content=data["content"],
                status_code=data["status_code"],
                headers=data["headers"]
            )
        
        # Process request
        response = await call_next(request)
        
        # Cache successful responses
        if response.status_code == 200:
            response_data = {
                "content": response.body.decode(),
                "status_code": response.status_code,
                "headers": dict(response.headers)
            }
            await self.redis_client.set(
                cache_key, 
                json.dumps(response_data), 
                ex=self.default_expire
            )
        
        return response
```

## 4. Cache Invalidation Strategies

### Tag-Based Invalidation
```python
# app/cache_manager.py
import redis.asyncio as redis
from typing import List, Set

class CacheManager:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def set_with_tags(self, key: str, value: str, tags: List[str], expire: int = 300):
        """Set cache with associated tags for invalidation"""
        pipe = self.redis.pipeline()
        pipe.set(key, value, ex=expire)
        
        # Associate key with tags
        for tag in tags:
            pipe.sadd(f"tag:{tag}", key)
            pipe.expire(f"tag:{tag}", expire + 60)  # Tags live slightly longer
        
        await pipe.execute()
    
    async def invalidate_by_tag(self, tag: str):
        """Invalidate all keys associated with a tag"""
        keys = await self.redis.smembers(f"tag:{tag}")
        if keys:
            pipe = self.redis.pipeline()
            pipe.delete(*keys)
            pipe.delete(f"tag:{tag}")
            await pipe.execute()
    
    async def invalidate_pattern(self, pattern: str):
        """Invalidate keys matching a pattern"""
        keys = []
        async for key in self.redis.scan_iter(match=pattern):
            keys.append(key)
        
        if keys:
            await self.redis.delete(*keys)

# Usage in routes
@app.post("/users/{user_id}")
async def update_user(user_id: int, cache_manager: CacheManager = Depends(get_cache_manager)):
    # Update user logic here
    
    # Invalidate related caches
    await cache_manager.invalidate_by_tag(f"user:{user_id}")
    await cache_manager.invalidate_pattern(f"user_list:*")
```

### Event-Driven Invalidation
```python
# app/events.py
from typing import Dict, List, Callable
import asyncio

class CacheInvalidationEvents:
    def __init__(self):
        self.listeners: Dict[str, List[Callable]] = {}
    
    def on(self, event: str, callback: Callable):
        if event not in self.listeners:
            self.listeners[event] = []
        self.listeners[event].append(callback)
    
    async def emit(self, event: str, data: dict = None):
        if event in self.listeners:
            tasks = [callback(data) for callback in self.listeners[event]]
            await asyncio.gather(*tasks, return_exceptions=True)

cache_events = CacheInvalidationEvents()

# Register invalidation handlers
@cache_events.on("user_updated")
async def invalidate_user_cache(data: dict):
    user_id = data.get("user_id")
    await cache_manager.invalidate_by_tag(f"user:{user_id}")

# Emit events in your business logic
async def update_user_service(user_id: int, user_data: dict):
    # Update user in database
    # ...
    
    # Emit cache invalidation event
    await cache_events.emit("user_updated", {"user_id": user_id})
```

## 5. Docker Redis Setup with docker-compose

### Basic docker-compose.yml
```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: redis_cache
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  fastapi:
    build: .
    container_name: fastapi_app
    ports:
      - "8000:8000"
    depends_on:
      redis:
        condition: service_healthy
    environment:
      - REDIS_URL=redis://redis:6379
    restart: unless-stopped

volumes:
  redis_data:
```

### Production Redis Configuration
```conf
# redis.conf
# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (optional for cache-only usage)
save ""
appendonly no

# Security
requirepass your_redis_password
rename-command FLUSHDB ""
rename-command FLUSHALL ""

# Performance
tcp-keepalive 300
timeout 0
tcp-backlog 511

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

### Advanced Production Setup
```yaml
version: '3.8'

services:
  redis-master:
    image: redis:7-alpine
    container_name: redis_master
    ports:
      - "6379:6379"
    volumes:
      - redis_master_data:/data
      - ./redis-master.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: unless-stopped

  redis-replica:
    image: redis:7-alpine
    container_name: redis_replica
    ports:
      - "6380:6379"
    volumes:
      - redis_replica_data:/data
      - ./redis-replica.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    depends_on:
      - redis-master
    restart: unless-stopped

  redis-sentinel:
    image: redis:7-alpine
    container_name: redis_sentinel
    ports:
      - "26379:26379"
    volumes:
      - ./sentinel.conf:/usr/local/etc/redis/sentinel.conf
    command: redis-sentinel /usr/local/etc/redis/sentinel.conf
    depends_on:
      - redis-master
      - redis-replica
    restart: unless-stopped

volumes:
  redis_master_data:
  redis_replica_data:
```

## Complete FastAPI Integration Example

```python
# main.py
from fastapi import FastAPI, Depends
import redis.asyncio as redis
from contextlib import asynccontextmanager

# Redis connection manager
class RedisManager:
    def __init__(self):
        self.redis_client = None
    
    async def connect(self):
        self.redis_client = redis.from_url("redis://localhost:6379")
    
    async def disconnect(self):
        if self.redis_client:
            await self.redis_client.close()

redis_manager = RedisManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await redis_manager.connect()
    yield
    await redis_manager.disconnect()

app = FastAPI(lifespan=lifespan)

# Dependency
async def get_redis():
    return redis_manager.redis_client

# Cached endpoint
@app.get("/users/{user_id}")
@cache_result(expire=300, key_prefix="user")
async def get_user(user_id: int, redis_client: redis.Redis = Depends(get_redis)):
    # Simulate database call
    return {"user_id": user_id, "name": f"User {user_id}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Performance Tips

1. **Connection Pooling**: Use connection pools to manage Redis connections efficiently
2. **Serialization**: Use fast serializers like `orjson` for JSON operations
3. **Pipeline Operations**: Batch multiple Redis operations using pipelines
4. **Memory Management**: Set appropriate `maxmemory` and eviction policies
5. **Monitoring**: Use Redis INFO commands and monitoring tools like RedisInsight
6. **Key Naming**: Use consistent, hierarchical key naming conventions
7. **TTL Strategy**: Set appropriate expiration times based on data volatility