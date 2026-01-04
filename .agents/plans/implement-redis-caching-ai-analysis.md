# Feature: Redis Caching for AI Analysis Results

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Implement Redis caching layer to optimize performance of expensive AI analysis operations in the Source Code Analysis Tool. This will cache complex analysis results including repository complexity analysis, tech stack analysis, AI features, and project insights to reduce response times from seconds to milliseconds and minimize expensive AI API calls.

## User Story

As a developer using the Source Code Analysis Tool
I want AI analysis results to load instantly after the first request
So that I can efficiently navigate between repositories and analysis views without waiting for expensive computations to re-run

## Problem Statement

The current system performs expensive AI analysis operations on every request, including:
- Complex repository analysis with mock data generation (70+ fields)
- Tech stack analysis with FTE calculations and complexity scoring
- AI feature results simulation with 1.2s delays
- Project insights aggregation across multiple repositories
- Vector embedding operations in the RAG pipeline

This results in poor user experience with slow response times and unnecessary computational overhead.

## Solution Statement

Implement a Redis caching layer with async support that:
- Caches expensive AI analysis results with configurable TTL
- Provides cache invalidation strategies for data updates
- Integrates seamlessly with existing FastAPI async patterns
- Supports both function-level caching and response middleware
- Includes proper error handling and fallback mechanisms

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: Backend API, Docker Infrastructure
**Dependencies**: Redis, redis-py (async), Docker Compose

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `backend/app/services/repo_service.py` (lines 1-50) - Why: Contains expensive AI analysis mock functions that need caching
- `backend/app/api/endpoints.py` (lines 335-360) - Why: AI features endpoints that will benefit from caching
- `backend/app/main.py` (lines 1-30) - Why: FastAPI app initialization pattern for Redis setup
- `backend/app/core/config.py` (lines 1-10) - Why: Configuration pattern for Redis connection settings
- `backend/tests/conftest.py` - Why: Test fixture patterns for Redis testing
- `docker-compose.yml` - Why: Service definition pattern for adding Redis container

### New Files to Create

- `backend/app/core/redis_client.py` - Redis connection management and client singleton
- `backend/app/core/cache.py` - Caching decorators and utilities
- `backend/app/middleware/cache_middleware.py` - Response caching middleware
- `backend/tests/test_redis_cache.py` - Unit tests for Redis caching functionality

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Redis-py Async Documentation](https://redis-py.readthedocs.io/en/stable/examples/asyncio_examples.html)
  - Specific section: Async Redis client setup and connection pooling
  - Why: Required for implementing async Redis operations with FastAPI
- [FastAPI Lifespan Events](https://fastapi.tiangolo.com/advanced/events/)
  - Specific section: Startup and shutdown events
  - Why: Proper Redis connection lifecycle management
- [Redis Docker Hub](https://hub.docker.com/_/redis)
  - Specific section: Configuration and persistence options
  - Why: Production-ready Redis container setup

### Patterns to Follow

**Async Service Pattern:**
```python
# From repo_service.py - follow this async pattern
async def get_repository_by_id_async(repo_id: int) -> Optional[Repository]:
    # Implementation follows existing service layer pattern
```

**Error Handling Pattern:**
```python
# From existing services - consistent error handling
try:
    result = await operation()
    return result
except Exception as e:
    # Log error and return appropriate response
    raise HTTPException(status_code=500, detail=str(e))
```

**Configuration Pattern:**
```python
# From config.py - environment-based configuration
import os
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
```

**Docker Service Pattern:**
```yaml
# From docker-compose.yml - follow existing service definition pattern
services:
  service-name:
    image: image:tag
    container_name: descriptive-name
    restart: always
    ports:
      - "external:internal"
```

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

Set up Redis infrastructure and connection management before implementing caching logic.

**Tasks:**
- Add Redis service to Docker Compose with proper configuration
- Create Redis client singleton with async connection pooling
- Configure Redis connection settings and environment variables
- Set up Redis lifecycle management in FastAPI application

### Phase 2: Core Implementation

Implement caching decorators and utilities for AI analysis functions.

**Tasks:**
- Create function-level caching decorators with TTL support
- Implement cache key generation strategies
- Add caching to expensive AI analysis functions
- Create cache invalidation utilities

### Phase 3: Integration

Integrate caching with existing API endpoints and middleware.

**Tasks:**
- Add response caching middleware for GET endpoints
- Update AI analysis endpoints to use caching
- Implement cache warming strategies for critical data
- Add cache statistics and monitoring

### Phase 4: Testing & Validation

Comprehensive testing of caching functionality and performance validation.

**Tasks:**
- Create unit tests for Redis operations and caching decorators
- Add integration tests for cached endpoints
- Performance testing to validate cache effectiveness
- Error handling tests for Redis connection failures

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE docker-compose.yml

- **IMPLEMENT**: Add Redis service with container name `scat-redis`
- **PATTERN**: Follow existing service definition pattern from current docker-compose.yml
- **IMPORTS**: Use official Redis 7-alpine image for production readiness
- **GOTCHA**: Ensure Redis persistence and proper memory limits
- **VALIDATE**: `docker-compose config` and `docker-compose up scat-redis -d`

### UPDATE backend/requirements.txt

- **IMPLEMENT**: Add `redis>=5.0.0` for async Redis support
- **PATTERN**: Follow existing dependency format with version pinning
- **IMPORTS**: Modern redis-py with async support
- **GOTCHA**: Ensure compatibility with existing aiohttp and asyncio dependencies
- **VALIDATE**: `pip install -r requirements.txt` in backend directory

### CREATE backend/app/core/redis_client.py

- **IMPLEMENT**: Redis connection singleton with async support and connection pooling
- **PATTERN**: Mirror supabase_client.py singleton pattern (backend/app/db/supabase_client.py)
- **IMPORTS**: `import redis.asyncio as redis`, `from typing import Optional`
- **GOTCHA**: Handle connection failures gracefully, use connection pooling for performance
- **VALIDATE**: `python -c "from app.core.redis_client import get_redis; print('Redis client imported successfully')"`

### CREATE backend/app/core/cache.py

- **IMPLEMENT**: Caching decorators and utilities with TTL support
- **PATTERN**: Use functools.wraps for decorator pattern, async/await throughout
- **IMPORTS**: `import json`, `import hashlib`, `from functools import wraps`, `from typing import Any, Callable`
- **GOTCHA**: Serialize complex objects (Repository, ComplexityAnalysis) properly, handle cache misses
- **VALIDATE**: `python -c "from app.core.cache import cache_result; print('Cache decorators imported successfully')"`

### UPDATE backend/app/main.py

- **IMPLEMENT**: Redis lifecycle management in FastAPI lifespan events
- **PATTERN**: Follow existing Langfuse initialization pattern (lines 15-20)
- **IMPORTS**: `from app.core.redis_client import init_redis, close_redis`
- **GOTCHA**: Handle Redis connection failures during startup gracefully
- **VALIDATE**: `python -c "from app.main import app; print('FastAPI app with Redis lifecycle loaded')"`

### UPDATE backend/app/services/repo_service.py

- **IMPLEMENT**: Add caching to expensive AI analysis functions
- **PATTERN**: Apply @cache_result decorator to get_repository_by_id and get_mock_ai_features
- **IMPORTS**: `from app.core.cache import cache_result`
- **GOTCHA**: Cache keys must include repo_id for proper isolation, TTL should be 1800s (30 min)
- **VALIDATE**: `python -c "from app.services.repo_service import get_repository_by_id; print('Cached repo service loaded')"`

### UPDATE backend/app/api/endpoints.py

- **IMPLEMENT**: Convert AI analysis endpoints to async and add caching
- **PATTERN**: Change `def` to `async def` for endpoints at lines 335-360, follow existing async endpoint pattern
- **IMPORTS**: No new imports needed, use existing async patterns
- **GOTCHA**: Ensure all service calls are awaited, maintain existing response models
- **VALIDATE**: `python -c "from app.api.endpoints import router; print('Async AI endpoints loaded')"`

### CREATE backend/app/middleware/cache_middleware.py

- **IMPLEMENT**: Response caching middleware for GET requests
- **PATTERN**: Follow FastAPI middleware pattern with async request/response handling
- **IMPORTS**: `from fastapi import Request, Response`, `from starlette.middleware.base import BaseHTTPMiddleware`
- **GOTCHA**: Only cache GET requests, exclude auth endpoints, handle large responses
- **VALIDATE**: `python -c "from app.middleware.cache_middleware import CacheMiddleware; print('Cache middleware loaded')"`

### CREATE backend/tests/test_redis_cache.py

- **IMPLEMENT**: Comprehensive unit tests for Redis caching functionality
- **PATTERN**: Follow existing test patterns from tests/api/test_repository_api.py
- **IMPORTS**: `import pytest`, `from app.core.redis_client import get_redis`, `from app.core.cache import cache_result`
- **GOTCHA**: Use pytest-asyncio for async tests, clean up Redis keys after tests
- **VALIDATE**: `python -m pytest backend/tests/test_redis_cache.py -v`

### UPDATE backend/tests/conftest.py

- **IMPLEMENT**: Add Redis test fixtures and cleanup
- **PATTERN**: Follow existing db fixture pattern (lines 15-20)
- **IMPORTS**: `from app.core.redis_client import get_redis`
- **GOTCHA**: Ensure Redis test database isolation, clean up test keys
- **VALIDATE**: `python -m pytest backend/tests/conftest.py::test_redis_fixture -v`

### CREATE backend/app/core/config.py updates

- **IMPLEMENT**: Add Redis configuration variables
- **PATTERN**: Follow existing environment variable pattern (lines 1-10)
- **IMPORTS**: `import os`
- **GOTCHA**: Provide sensible defaults for development, support Redis URL format
- **VALIDATE**: `python -c "from app.core.config import REDIS_URL; print(f'Redis URL: {REDIS_URL}')"`

---

## TESTING STRATEGY

### Unit Tests

**Scope**: Redis client, caching decorators, cache utilities
**Framework**: pytest with pytest-asyncio for async support
**Coverage**: 90%+ for new caching components

Design unit tests with fixtures for Redis connection and cache key cleanup:
- Test Redis connection establishment and error handling
- Test caching decorator functionality with various data types
- Test cache invalidation and TTL expiration
- Test cache key generation and collision handling

### Integration Tests

**Scope**: End-to-end caching behavior with FastAPI endpoints
**Framework**: FastAPI TestClient with Redis test database

Test scenarios:
- Cache hit/miss behavior for AI analysis endpoints
- Cache invalidation when repository data changes
- Performance improvement validation (response time reduction)
- Error handling when Redis is unavailable

### Edge Cases

**Specific edge cases that must be tested for this feature:**
- Redis connection failure during application startup
- Redis connection loss during request processing
- Large object serialization/deserialization (Repository with 70+ fields)
- Cache key collision with different repository IDs
- Memory pressure and cache eviction behavior
- Concurrent access to same cache keys

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
# Lint new Python files
cd backend && python -m flake8 app/core/redis_client.py app/core/cache.py app/middleware/cache_middleware.py

# Type checking
cd backend && python -m mypy app/core/redis_client.py app/core/cache.py --ignore-missing-imports
```

### Level 2: Unit Tests

```bash
# Run Redis-specific tests
cd backend && python -m pytest tests/test_redis_cache.py -v

# Run all backend tests to ensure no regressions
cd backend && python -m pytest tests/ -v
```

### Level 3: Integration Tests

```bash
# Test Docker Compose Redis service
docker-compose up scat-redis -d
docker-compose logs scat-redis

# Test Redis connectivity
docker-compose exec scat-redis redis-cli ping

# Test full application with Redis
docker-compose up backend -d
curl -f http://localhost:8359/api/v1/health
```

### Level 4: Manual Validation

```bash
# Test AI analysis endpoint performance (should be fast on second request)
curl -w "@curl-format.txt" http://localhost:8359/api/v1/repositories/1/ai-features

# Test cache invalidation
curl -X POST http://localhost:8359/api/v1/repositories/1/actions/analyze?feature_type=complexity

# Verify Redis keys are created
docker-compose exec scat-redis redis-cli keys "*"
```

### Level 5: Additional Validation (Optional)

```bash
# Performance benchmarking
ab -n 100 -c 10 http://localhost:8359/api/v1/repositories/1/ai-features

# Memory usage monitoring
docker stats scat-redis --no-stream
```

---

## ACCEPTANCE CRITERIA

- [ ] Redis service runs successfully in Docker Compose with container name `scat-redis`
- [ ] AI analysis endpoints show significant performance improvement (>80% faster on cache hits)
- [ ] All validation commands pass with zero errors
- [ ] Unit test coverage >90% for new caching components
- [ ] Integration tests verify end-to-end caching behavior
- [ ] Code follows existing project conventions and async patterns
- [ ] No regressions in existing functionality (all existing tests pass)
- [ ] Cache invalidation works correctly when data changes
- [ ] Error handling gracefully degrades when Redis is unavailable
- [ ] Memory usage remains within acceptable limits (<100MB for Redis)

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms caching works (fast second requests)
- [ ] Performance benchmarks show improvement
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability

---

## NOTES

**Design Decisions:**
- Using Redis 7-alpine for production stability and smaller image size
- 30-minute TTL for AI analysis results balances freshness with performance
- Function-level caching preferred over response middleware for granular control
- Graceful degradation when Redis unavailable maintains system reliability

**Performance Expectations:**
- Cache hits should reduce AI analysis response time from ~1.2s to <50ms
- Memory usage should remain under 100MB for typical repository analysis cache
- Cache hit ratio should exceed 70% for frequently accessed repositories

**Security Considerations:**
- Redis runs in isolated Docker network without external exposure
- Cache keys include repository IDs to prevent data leakage between repositories
- No sensitive data (passwords, tokens) stored in cache

**Future Enhancements:**
- Cache warming strategies for popular repositories
- Distributed caching for multi-instance deployments
- Cache analytics and monitoring dashboard
- Intelligent cache invalidation based on repository changes
