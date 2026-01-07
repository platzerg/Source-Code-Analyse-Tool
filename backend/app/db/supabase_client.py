"""
Supabase client singleton for database access.
"""
from supabase import create_client, Client
import os
from typing import Optional
from app.core.config import get_settings

_supabase_client: Optional[Client] = None

def get_supabase() -> Client:
    """
    Get or create Supabase client singleton.
    
    Returns:
        Client: Supabase client instance
        
    Raises:
        ValueError: If SUPABASE_URL or SUPABASE_SERVICE_KEY are not set
        RuntimeError: If DATABASE_PROVIDER is set to postgres
    """
    global _supabase_client
    
    settings = get_settings()
    
    # Check if PostgreSQL is configured - don't use Supabase in that case
    if settings.database_provider == "postgres":
        raise RuntimeError(
            "DATABASE_PROVIDER is set to 'postgres'. "
            "Supabase client should not be used. "
            "Please use PostgreSQL connection instead."
        )
    
    if _supabase_client is None:
        if not settings.is_supabase_configured:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables"
            )
        
        _supabase_client = create_client(settings.supabase_url, settings.supabase_service_key)
        print(f"[Supabase] Connected to {settings.supabase_url}", flush=True)
    
    return _supabase_client


def reset_supabase_client():
    """Reset the Supabase client (useful for testing)."""
    global _supabase_client
    _supabase_client = None
