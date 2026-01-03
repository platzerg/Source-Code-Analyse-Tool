"""
Tests for settings_service
"""
import pytest
from app.services import settings_service


def test_get_menu_visibility_default():
    """Test getting menu visibility returns default structure if not in DB"""
    # This should return default settings if nothing is in DB
    result = settings_service.get_menu_visibility()

    assert result is not None
    assert "menu_visibility" in result
    assert "project_tabs" in result["menu_visibility"]
    assert "repository_tabs" in result["menu_visibility"]


def test_update_and_get_menu_visibility():
    """Test updating and retrieving menu visibility"""
    test_settings = {
        "menu_visibility": {
            "project_tabs": {
                "repositories": True,
                "backlog": False,
                "board": True
            },
            "repository_tabs": {
                "overview": True,
                "technologies": False
            }
        }
    }

    # Update settings
    result = settings_service.update_menu_visibility(test_settings)
    assert result is True

    # Get settings back
    retrieved = settings_service.get_menu_visibility()

    assert retrieved == test_settings
    assert retrieved["menu_visibility"]["project_tabs"]["repositories"] is True
    assert retrieved["menu_visibility"]["project_tabs"]["backlog"] is False


def test_get_system_status_default():
    """Test getting system status returns default if not in DB"""
    # Delete any existing system_status
    from app.db.repositories import SystemSettingsRepository
    SystemSettingsRepository.delete("system_status")

    result = settings_service.get_system_status()

    assert result is not None
    assert "operational" in result
    assert "message" in result
    assert "last_updated" in result
    assert result["operational"] is True


def test_update_and_get_system_status():
    """Test updating and retrieving system status"""
    test_status = {
        "operational": False,
        "message": "Maintenance in progress",
        "last_updated": "2025-01-03T15:00:00Z"
    }

    # Update status
    result = settings_service.update_system_status(test_status)
    assert result is True

    # Get status back
    retrieved = settings_service.get_system_status()

    assert retrieved == test_status
    assert retrieved["operational"] is False
    assert retrieved["message"] == "Maintenance in progress"


def test_get_setting_with_default():
    """Test getting a setting with default value"""
    # Get non-existent setting
    result = settings_service.get_setting("nonexistent_key", default="default_value")

    assert result == "default_value"


def test_set_and_get_custom_setting():
    """Test setting and getting a custom setting"""
    test_key = "custom_feature_flag"
    test_value = {"enabled": True, "rollout_percentage": 50}

    # Set custom setting
    result = settings_service.set_setting(
        test_key,
        test_value,
        description="Custom feature flag"
    )
    assert result is True

    # Get custom setting
    retrieved = settings_service.get_setting(test_key)

    assert retrieved == test_value
    assert retrieved["enabled"] is True
    assert retrieved["rollout_percentage"] == 50


def test_get_all_settings():
    """Test getting all settings as dictionary"""
    # Set multiple settings
    settings_service.set_setting("test_key_1", {"value": 1}, "Test 1")
    settings_service.set_setting("test_key_2", {"value": 2}, "Test 2")

    # Get all settings
    all_settings = settings_service.get_all_settings()

    assert isinstance(all_settings, dict)
    assert "test_key_1" in all_settings or "test_key_2" in all_settings


def test_menu_visibility_persistence():
    """Test that menu visibility persists across function calls"""
    original_settings = {
        "menu_visibility": {
            "project_tabs": {
                "repositories": True,
                "backlog": True,
                "board": False
            },
            "repository_tabs": {
                "overview": True
            }
        }
    }

    # Update settings
    settings_service.update_menu_visibility(original_settings)

    # Get settings multiple times
    first_get = settings_service.get_menu_visibility()
    second_get = settings_service.get_menu_visibility()

    assert first_get == second_get
    assert first_get == original_settings


def test_system_status_update_overwrites():
    """Test that updating system status overwrites previous values"""
    # Set initial status
    initial_status = {
        "operational": True,
        "message": "All systems operational",
        "last_updated": "2025-01-03T10:00:00Z"
    }
    settings_service.update_system_status(initial_status)

    # Update with new status
    new_status = {
        "operational": False,
        "message": "Scheduled maintenance",
        "last_updated": "2025-01-03T11:00:00Z"
    }
    settings_service.update_system_status(new_status)

    # Verify new status is returned
    retrieved = settings_service.get_system_status()

    assert retrieved == new_status
    assert retrieved["operational"] is False
    assert retrieved["message"] == "Scheduled maintenance"
