import os

# Base directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# App Settings
APP_TITLE = "Product Catalog API"
APP_VERSION = "0.2.0"
# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_TTL_DEFAULT = int(os.getenv("REDIS_TTL_DEFAULT", "1800"))  # 30 minutes
REDIS_MAX_CONNECTIONS = int(os.getenv("REDIS_MAX_CONNECTIONS", "10"))
