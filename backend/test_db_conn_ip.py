import asyncio
import asyncpg
from app.core.config import get_settings

async def test_conn():
    settings = get_settings()
    # Override host for testing
    conn_str = f"postgresql://{settings.postgres_user}:{settings.postgres_password}@127.0.0.1:{settings.postgres_port}/{settings.postgres_db}"
    print(f"Testing connection to {conn_str}...")
    try:
        conn = await asyncpg.connect(conn_str)
        val = await conn.fetchval("SELECT 1")
        print(f"Connection successful: {val}")
        await conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test_conn())
