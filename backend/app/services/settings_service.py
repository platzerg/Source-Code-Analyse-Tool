"""
Settings service layer - manages system settings in Supabase.
"""
from typing import Dict, Any, Optional
from app.db.repositories import SystemSettingsRepository


def get_menu_visibility() -> Dict[str, Any]:
    """Get menu visibility settings."""
    settings = SystemSettingsRepository.get("menu_visibility")

    if settings:
        return settings.get("value", {})

    # Return default settings if not found
    return {
        "menu_visibility": {
            "project_tabs": {
                "repositories": True,
                "backlog": True,
                "board": True,
                "roadmap": True,
                "insights": True
            },
            "repository_tabs": {
                "overview": True,
                "technologies": True,
                "complexity": True,
                "timeline": True,
                "contributors": True,
                "change-history": True,
                "dead-code": True,
                "browse-files": True,
                "claude-md": True,
                "code-flows": True,
                "code-quality": True,
                "team-staffing": True,
                "feature-map": True,
                "dependencies": True,
                "security": True,
                "ai-features": True,
                "ask-questions": True,
                "prompt-generation": True,
                "pull-requests": True
            }
        }
    }


def update_menu_visibility(settings: Dict[str, Any]) -> bool:
    """Update menu visibility settings."""
    SystemSettingsRepository.set(
        key="menu_visibility",
        value=settings,
        description="Menu visibility configuration for UI tabs"
    )
    return True


def get_all_settings() -> Dict[str, Any]:
    """Get all system settings as a dictionary."""
    all_settings = SystemSettingsRepository.get_all()
    result = {}
    for setting in all_settings:
        result[setting["key"]] = setting["value"]
    return result


def get_setting(key: str, default: Any = None) -> Any:
    """Get a specific setting by key."""
    setting = SystemSettingsRepository.get(key)
    if setting:
        return setting.get("value", default)
    return default


def set_setting(key: str, value: Any, description: str = None) -> bool:
    """Set a specific setting."""
    SystemSettingsRepository.set(key, value, description)
    return True


def get_system_status() -> Dict[str, Any]:
    """Get system operational status."""
    status = SystemSettingsRepository.get("system_status")

    if status:
        return status.get("value", {})

    # Return default status if not found
    from datetime import datetime
    return {
        "operational": True,
        "message": "System operational",
        "last_updated": datetime.now().isoformat()
    }


def update_system_status(status: Dict[str, Any]) -> bool:
    """Update system operational status."""
    SystemSettingsRepository.set(
        key="system_status",
        value=status,
        description="System operational status"
    )
    return True
