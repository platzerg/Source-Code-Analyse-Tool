"""
Unit tests for Redis caching functionality.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from app.core.cache import cache_result, _generate_cache_key, _serialize_result, _deserialize_result


class TestCacheDecorator:
    """Test caching decorator functionality."""
    
    def test_cache_key_generation(self):
        """Test cache key generation."""
        key1 = _generate_cache_key("test_func", "prefix", 1, 2, kwarg="test")
        key2 = _generate_cache_key("test_func", "prefix", 1, 2, kwarg="test")
        key3 = _generate_cache_key("test_func", "prefix", 1, 3, kwarg="test")
        
        # Same arguments should generate same key
        assert key1 == key2
        # Different arguments should generate different keys
        assert key1 != key3
        # Keys should have proper format
        assert key1.startswith("prefix:test_func:")
    
    def test_serialization_deserialization(self):
        """Test result serialization and deserialization."""
        test_data = {
            "string": "test",
            "number": 42,
            "list": [1, 2, 3],
            "nested": {"key": "value"}
        }
        
        serialized = _serialize_result(test_data)
        deserialized = _deserialize_result(serialized)
        
        assert deserialized == test_data
    
    def test_pydantic_model_serialization(self):
        """Test serialization of Pydantic models."""
        from app.models.schemas import AIFeatureResult
        
        model = AIFeatureResult(
            id="1",
            type="test",
            title="Test",
            description="Test description",
            status="completed",
            content={"test": "data"}
        )
        
        serialized = _serialize_result(model)
        deserialized = _deserialize_result(serialized)
        
        # Should serialize to dict
        assert isinstance(deserialized, dict)
        assert deserialized["id"] == "1"
        assert deserialized["type"] == "test"


class TestCacheIntegration:
    """Test cache integration with mocked Redis."""
    
    @pytest.mark.asyncio
    @patch('app.core.cache.get_redis')
    async def test_cache_hit_miss_with_mock_redis(self, mock_get_redis):
        """Test cache hit/miss behavior with mocked Redis."""
        # Mock Redis client
        mock_redis = AsyncMock()
        mock_get_redis.return_value = mock_redis
        
        # First call - cache miss
        mock_redis.get.return_value = None
        
        @cache_result(ttl=60, key_prefix="test")
        async def expensive_function(value: int) -> dict:
            return {"result": value * 2, "computed": True}
        
        result1 = await expensive_function(5)
        assert result1 == {"result": 10, "computed": True}
        
        # Verify Redis was called
        mock_redis.get.assert_called_once()
        mock_redis.setex.assert_called_once()
        
        # Second call - cache hit
        mock_redis.reset_mock()
        mock_redis.get.return_value = '{"result": 10, "computed": true}'
        
        result2 = await expensive_function(5)
        assert result2 == {"result": 10, "computed": True}
        
        # Verify only get was called (no setex for cache hit)
        mock_redis.get.assert_called_once()
        mock_redis.setex.assert_not_called()
    
    @pytest.mark.asyncio
    @patch('app.core.cache.get_redis')
    async def test_cache_error_handling(self, mock_get_redis):
        """Test cache error handling."""
        # Mock Redis client that raises an exception
        mock_redis = AsyncMock()
        mock_redis.get.side_effect = Exception("Redis error")
        mock_get_redis.return_value = mock_redis
        
        @cache_result(ttl=60, key_prefix="test")
        async def test_function(value: int) -> int:
            return value * 2
        
        # Should still work despite Redis error
        result = await test_function(5)
        assert result == 10


class TestServiceFunctions:
    """Test service function imports and basic functionality."""
    
    def test_service_imports(self):
        """Test that cached service functions can be imported."""
        from app.services.repo_service import get_mock_ai_features_async, get_repository_by_id_async
        
        # Functions should be importable
        assert callable(get_mock_ai_features_async)
        assert callable(get_repository_by_id_async)
    
    @pytest.mark.asyncio
    async def test_ai_features_function_structure(self):
        """Test AI features function returns expected structure."""
        from app.services.repo_service import get_mock_ai_features_async
        
        result = await get_mock_ai_features_async(1)
        
        # Should return a list
        assert isinstance(result, list)
        assert len(result) > 0
        
        # Each item should have expected structure
        for item in result:
            assert hasattr(item, 'id')
            assert hasattr(item, 'type')
            assert hasattr(item, 'title')
            assert hasattr(item, 'status')


class TestConfigurationImport:
    """Test configuration imports."""
    
    def test_redis_config_import(self):
        """Test Redis configuration can be imported."""
        from app.core.config import REDIS_URL, REDIS_TTL_DEFAULT
        
        assert isinstance(REDIS_URL, str)
        assert isinstance(REDIS_TTL_DEFAULT, int)
        assert REDIS_TTL_DEFAULT > 0
