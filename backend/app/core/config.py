import os

# Base directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Data Files
# Data Files
# Use /app/data for Docker persistence if it exists, else local directory
DATA_DIR = "/app/data" if os.path.exists("/app/data") else os.path.join(BASE_DIR, "")

PROJECTS_FILE = os.path.join(DATA_DIR, "projects.json")
REPOSITORIES_FILE = os.path.join(DATA_DIR, "repositories.json")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")
OVERVIEW_FILE = os.path.join(DATA_DIR, "overview.json")

# App Settings
APP_TITLE = "Product Catalog API"
APP_VERSION = "0.2.0"
