"""
Centralized configuration management using Pydantic Settings.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal, Optional
import os


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Prioritize Docker env over local env. Later files override earlier ones.
    model_config = SettingsConfigDict(
        env_file=(".env.docker", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow"
    )
    
    # ===== Langfuse Observability =====
    enable_langfuse: bool = False
    langfuse_public_key: Optional[str] = None
    langfuse_secret_key: Optional[str] = None
    langfuse_host: str = "https://cloud.langfuse.com"
    
    # ===== Database Configuration =====
    database_provider: Literal["supabase", "postgres"] = "postgres"
    
    # Supabase settings
    supabase_url: Optional[str] = None
    supabase_service_key: Optional[str] = None
    
    # PostgreSQL settings
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "source_code_analysis"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    
    # ===== OpenAI Configuration =====
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4-turbo-preview"
    openai_max_tokens: int = 2000
    openai_temperature: float = 0.7
    
    # ===== Redis Configuration =====
    redis_url: str = "redis://scat-redis:6379"
    redis_ttl_default: int = 1800  # 30 minutes
    redis_max_connections: int = 10
    
    @property
    def postgres_connection_string(self) -> str:
        """Generate PostgreSQL connection string."""
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )
    
    @property
    def is_langfuse_configured(self) -> bool:
        """Check if Langfuse is properly configured."""
        return (
            self.enable_langfuse 
            and bool(self.langfuse_public_key) 
            and bool(self.langfuse_secret_key)
        )
    
    @property
    def is_supabase_configured(self) -> bool:
        """Check if Supabase is properly configured."""
        return bool(self.supabase_url) and bool(self.supabase_service_key)
    
    def validate_database_config(self) -> None:
        """Validate database configuration based on selected provider."""
        if self.database_provider == "supabase" and not self.is_supabase_configured:
            raise ValueError(
                "Supabase selected but SUPABASE_URL or SUPABASE_SERVICE_KEY not set"
            )


# Legacy constants for backward compatibility
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP_TITLE = "Source Code Analysis Tool API"
APP_VERSION = "2.0.0"
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_TTL_DEFAULT = int(os.getenv("REDIS_TTL_DEFAULT", "1800"))
REDIS_MAX_CONNECTIONS = int(os.getenv("REDIS_MAX_CONNECTIONS", "10"))


# Global settings instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get or create settings singleton."""
    global _settings
    if _settings is None:
        _settings = Settings()
        print(f"[Config] Loaded configuration:", flush=True)
        print(f"  - Database Provider: {_settings.database_provider}", flush=True)
        print(f"  - Langfuse Enabled: {_settings.enable_langfuse}", flush=True)
        print(f"  - Langfuse Configured: {_settings.is_langfuse_configured}", flush=True)
    return _settings


def reset_settings():
    """Reset settings singleton (useful for testing)."""
    global _settings
    _settings = None
