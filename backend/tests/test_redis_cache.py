"""
Unit tests for Redis caching functionality.
"""
import pytest
import asyncio
import json
from unittest.mock import AsyncMock, patch
from app.core.redis_client import init_redis, close_redis, get_redis, is_redis_available
from app.core.cache import cache_result, generate_cache_key, serialize_data, deserialize_data, invalidate_cache_pattern
from app.services.repo_service import get_mock_ai_features_async, get_repository_by_id_async
from app.models.schemas import AIFeatureResult

@pytest.fixture
async def redis_client():
    """Redis client fixture with cleanup."""
    await init_redis()
    client = get_redis()
    yield client
    # Cleanup test keys
    if client:
        test_keys = await client.keys("cache:test_*")
        if test_keys:
            await client.delete(*test_keys)
    await close_redis()

@pytest.mark.asyncio
async def test_redis_connection():
    """Test Redis connection establishment."""
    await init_redis()
    assert await is_redis_available()
    await close_redis()

@pytest.mark.asyncio
async def test_cache_key_generation():
    """Test cache key generation."""
    key1 = generate_cache_key("test", 1, 2, param="value")
    key2 = generate_cache_key("test", 1, 2, param="value")
    key3 = generate_cache_key("test", 1, 3, param="value")
    
    assert key1 == key2  # Same inputs should generate same key
    assert key1 != key3  # Different inputs should generate different keys
    assert key1.startswith("cache:")

@pytest.mark.asyncio
async def test_data_serialization():
    """Test data serialization and deserialization."""
    # Test with dict
    data = {"key": "value", "number": 42}
    serialized = serialize_data(data)
    deserialized = deserialize_data(serialized)
    assert deserialized == data
    
    # Test with string
    string_data = "test string"
    serialized_str = serialize_data(string_data)
    deserialized_str = deserialize_data(serialized_str)
    assert deserialized_str == string_data

@pytest.mark.asyncio
async def test_cache_decorator_functionality(redis_client):
    """Test cache decorator with function calls."""
    call_count = 0
    
    @cache_result(ttl=60, key_prefix="test_func")
    async def test_function(value: int):
        nonlocal call_count
        call_count += 1
        return {"result": value * 2, "call_count": call_count}
    
    # First call should execute function
    result1 = await test_function(5)
    assert result1["result"] == 10
    assert call_count == 1
    
    # Second call should use cache
    result2 = await test_function(5)
    assert result2["result"] == 10
    assert call_count == 1  # Function not called again
    
    # Different parameter should execute function
    result3 = await test_function(10)
    assert result3["result"] == 20
    assert call_count == 2

@pytest.mark.asyncio
async def test_cache_decorator_without_redis():
    """Test cache decorator behavior when Redis is unavailable."""
    with patch('app.core.cache.is_redis_available', return_value=False):
        call_count = 0
        
        @cache_result(ttl=60, key_prefix="test_no_redis")
        async def test_function(value: int):
            nonlocal call_count
            call_count += 1
            return {"result": value * 2}
        
        # Both calls should execute function (no caching)
        await test_function(5)
        await test_function(5)
        assert call_count == 2

@pytest.mark.asyncio
async def test_ai_features_caching(redis_client):
    """Test AI features endpoint caching."""
    # First call
    result1 = await get_mock_ai_features_async(1)
    assert isinstance(result1, list)
    assert len(result1) > 0
    assert isinstance(result1[0], AIFeatureResult)
    
    # Second call should be cached (faster)
    result2 = await get_mock_ai_features_async(1)
    assert result1 == result2

@pytest.mark.asyncio
async def test_repository_analysis_caching(redis_client):
    """Test repository analysis caching."""
    # Mock the database call to avoid dependency
    with patch('app.services.repo_service.get_repository_by_id') as mock_get_repo:
        from app.models.schemas import Repository
        mock_repo = Repository(
            id=1,
            name="Test Repo",
            url="https://github.com/test/repo.git",
            main_branch="main",
            status="Cloned"
        )
        mock_get_repo.return_value = mock_repo
        
        # First call
        result1 = await get_repository_by_id_async(1)
        assert result1.name == "Test Repo"
        
        # Second call should be cached
        result2 = await get_repository_by_id_async(1)
        assert result1.name == result2.name
        
        # Verify mock was called only once (second call used cache)
        assert mock_get_repo.call_count == 1

@pytest.mark.asyncio
async def test_cache_invalidation(redis_client):
    """Test cache invalidation by pattern."""
    # Set some test cache keys
    await redis_client.set("cache:test_key1", "value1")
    await redis_client.set("cache:test_key2", "value2")
    await redis_client.set("cache:other_key", "value3")
    
    # Invalidate test keys
    deleted_count = await invalidate_cache_pattern("cache:test_*")
    assert deleted_count == 2
    
    # Verify keys are deleted
    assert await redis_client.get("cache:test_key1") is None
    assert await redis_client.get("cache:test_key2") is None
    assert await redis_client.get("cache:other_key") == "value3"

@pytest.mark.asyncio
async def test_cache_ttl_expiration(redis_client):
    """Test cache TTL expiration."""
    @cache_result(ttl=1, key_prefix="test_ttl")  # 1 second TTL
    async def test_function(value: int):
        return {"timestamp": asyncio.get_event_loop().time()}
    
    # First call
    result1 = await test_function(1)
    
    # Wait for TTL to expire
    await asyncio.sleep(1.1)
    
    # Second call should execute function again (cache expired)
    result2 = await test_function(1)
    assert result2["timestamp"] > result1["timestamp"]

@pytest.mark.asyncio
async def test_cache_error_handling(redis_client):
    """Test cache error handling."""
    with patch.object(redis_client, 'get', side_effect=Exception("Redis error")):
        call_count = 0
        
        @cache_result(ttl=60, key_prefix="test_error")
        async def test_function(value: int):
            nonlocal call_count
            call_count += 1
            return {"result": value}
        
        # Function should still work despite Redis errors
        result = await test_function(5)
        assert result["result"] == 5
        assert call_count == 1

@pytest.mark.asyncio
async def test_large_object_caching(redis_client):
    """Test caching of large objects."""
    large_data = {"data": ["item"] * 1000, "metadata": {"size": "large"}}
    
    @cache_result(ttl=60, key_prefix="test_large")
    async def test_function():
        return large_data
    
    # First call
    result1 = await test_function()
    assert len(result1["data"]) == 1000
    
    # Second call should use cache
    result2 = await test_function()
    assert result1 == result2
