from app.core.config import get_settings
settings = get_settings()
print(f"POSTGRES_HOST: '{settings.postgres_host}'")
print(f"REDIS_URL: '{settings.redis_url}'")
