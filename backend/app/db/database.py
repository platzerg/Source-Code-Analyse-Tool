"""
Database factory for supporting multiple database providers (Supabase, PostgreSQL).
"""
from typing import Union, Optional
from supabase import Client as SupabaseClient, create_client
import asyncpg
from app.core.config import get_settings


class DatabaseClient:
    """Unified database client interface."""
    
    def __init__(self, provider: str):
        self.provider = provider
        self._client: Optional[Union[SupabaseClient, asyncpg.Pool]] = None
        self._settings = get_settings()
    
    async def connect(self):
        """Initialize database connection."""
        if self.provider == "supabase":
            await self._connect_supabase()
        elif self.provider == "postgres":
            await self._connect_postgres()
        else:
            raise ValueError(f"Unsupported database provider: {self.provider}")
    
    async def _connect_supabase(self):
        """Connect to Supabase."""
        if not self._settings.is_supabase_configured:
            raise ValueError("Supabase credentials not configured")
        
        self._client = create_client(
            self._settings.supabase_url,
            self._settings.supabase_service_key
        )
        print(f"[Database] Connected to Supabase: {self._settings.supabase_url}", flush=True)
    
    async def _connect_postgres(self):
        """Connect to PostgreSQL."""
        self._client = await asyncpg.create_pool(
            self._settings.postgres_connection_string,
            min_size=1,
            max_size=10
        )
        print(f"[Database] Connected to PostgreSQL: {self._settings.postgres_host}:{self._settings.postgres_port}", flush=True)
    
    async def close(self):
        """Close database connection."""
        if self.provider == "postgres" and self._client:
            await self._client.close()
            print("[Database] PostgreSQL connection closed", flush=True)
    
    @property
    def client(self) -> Union[SupabaseClient, asyncpg.Pool]:
        """Get the underlying database client."""
        if self._client is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._client


# Global database client instance
_db_client: Optional[DatabaseClient] = None


async def get_database() -> DatabaseClient:
    """Get or create database client singleton."""
    global _db_client
    if _db_client is None:
        settings = get_settings()
        _db_client = DatabaseClient(settings.database_provider)
        await _db_client.connect()
    return _db_client


async def close_database():
    """Close database connection."""
    global _db_client
    if _db_client:
        await _db_client.close()
        _db_client = None


def reset_database():
    """Reset database client (useful for testing)."""
    global _db_client
    _db_client = None
