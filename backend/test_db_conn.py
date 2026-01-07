import asyncio
from app.db.postgres_repositories import get_postgres_pool
from app.core.config import get_settings

async def test_conn():
    print("Testing connection...")
    try:
        pool = await get_postgres_pool()
        async with pool.acquire() as conn:
            val = await conn.fetchval("SELECT 1")
            print(f"Connection successful: {val}")
    except Exception as e:
        print(f"Connection failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test_conn())
