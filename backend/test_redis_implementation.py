#!/usr/bin/env python3
"""
Simple test script to verify Redis caching implementation.
Run this after starting Redis to test basic functionality.
"""
import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

async def test_redis_basic():
    """Test basic Redis functionality."""
    try:
        from app.core.redis_client import init_redis, close_redis, get_redis, is_redis_available
        
        print("🔄 Initializing Redis connection...")
        await init_redis()
        
        if not await is_redis_available():
            print("❌ Redis is not available")
            return False
        
        print("✅ Redis connection established")
        
        # Test basic operations
        redis_client = get_redis()
        await redis_client.set("test_key", "test_value")
        value = await redis_client.get("test_key")
        
        if value == "test_value":
            print("✅ Basic Redis operations working")
        else:
            print("❌ Basic Redis operations failed")
            return False
        
        # Cleanup
        await redis_client.delete("test_key")
        await close_redis()
        print("✅ Redis connection closed")
        
        return True
        
    except Exception as e:
        print(f"❌ Redis test failed: {e}")
        return False

async def test_cache_decorator():
    """Test cache decorator functionality."""
    try:
        from app.core.cache import cache_result
        from app.core.redis_client import init_redis, close_redis
        
        await init_redis()
        
        call_count = 0
        
        @cache_result(ttl=60, key_prefix="test_cache")
        async def test_function(value: int):
            nonlocal call_count
            call_count += 1
            return {"result": value * 2, "call_count": call_count}
        
        # First call
        result1 = await test_function(5)
        print(f"✅ First call result: {result1}")
        
        # Second call (should be cached)
        result2 = await test_function(5)
        print(f"✅ Second call result: {result2}")
        
        if call_count == 1 and result1 == result2:
            print("✅ Cache decorator working correctly")
            success = True
        else:
            print("❌ Cache decorator not working")
            success = False
        
        await close_redis()
        return success
        
    except Exception as e:
        print(f"❌ Cache decorator test failed: {e}")
        return False

async def main():
    """Run all tests."""
    print("🚀 Starting Redis caching tests...\n")
    
    # Test 1: Basic Redis functionality
    print("Test 1: Basic Redis Connection")
    redis_ok = await test_redis_basic()
    print()
    
    # Test 2: Cache decorator
    print("Test 2: Cache Decorator")
    cache_ok = await test_cache_decorator()
    print()
    
    # Summary
    if redis_ok and cache_ok:
        print("🎉 All tests passed! Redis caching is working correctly.")
        return 0
    else:
        print("❌ Some tests failed. Check Redis configuration.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
