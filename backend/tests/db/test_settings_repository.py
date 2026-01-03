"""
Tests for SystemSettingsRepository
"""
import pytest
from app.db.repositories import SystemSettingsRepository


def test_set_and_get_setting():
    """Test setting and getting a setting"""
    # Set a new setting
    test_key = "test_setting"
    test_value = {"enabled": True, "count": 42}
    test_description = "Test setting for unit tests"

    result = SystemSettingsRepository.set(test_key, test_value, test_description)

    assert result is not None
    assert result["key"] == test_key
    assert result["value"] == test_value
    assert result["description"] == test_description

    # Get the setting back
    retrieved = SystemSettingsRepository.get(test_key)

    assert retrieved is not None
    assert retrieved["key"] == test_key
    assert retrieved["value"] == test_value
    assert retrieved["description"] == test_description


def test_update_existing_setting():
    """Test updating an existing setting (upsert)"""
    test_key = "update_test_setting"

    # Create initial setting
    initial_value = {"version": 1}
    SystemSettingsRepository.set(test_key, initial_value, "Initial value")

    # Update the setting
    updated_value = {"version": 2, "updated": True}
    result = SystemSettingsRepository.set(test_key, updated_value, "Updated value")

    assert result is not None
    assert result["value"] == updated_value
    assert result["description"] == "Updated value"

    # Verify update
    retrieved = SystemSettingsRepository.get(test_key)
    assert retrieved["value"] == updated_value


def test_get_nonexistent_setting():
    """Test getting a setting that doesn't exist"""
    result = SystemSettingsRepository.get("nonexistent_key_12345")

    assert result is None


def test_get_all_settings():
    """Test getting all settings"""
    # Create multiple test settings
    test_settings = [
        ("test_all_1", {"data": "value1"}),
        ("test_all_2", {"data": "value2"}),
        ("test_all_3", {"data": "value3"})
    ]

    for key, value in test_settings:
        SystemSettingsRepository.set(key, value, f"Test setting {key}")

    # Get all settings
    all_settings = SystemSettingsRepository.get_all()

    assert len(all_settings) >= len(test_settings)

    # Verify our test settings are present
    setting_keys = [s["key"] for s in all_settings]
    for key, _ in test_settings:
        assert key in setting_keys


def test_delete_setting():
    """Test deleting a setting"""
    test_key = "delete_test_setting"

    # Create a setting
    SystemSettingsRepository.set(test_key, {"temp": True}, "Temporary setting")

    # Verify it exists
    assert SystemSettingsRepository.get(test_key) is not None

    # Delete it
    result = SystemSettingsRepository.delete(test_key)

    assert result is True

    # Verify it's gone
    assert SystemSettingsRepository.get(test_key) is None


def test_delete_nonexistent_setting():
    """Test deleting a setting that doesn't exist"""
    result = SystemSettingsRepository.delete("nonexistent_delete_key_12345")

    # Should return False or 0 (no rows deleted)
    assert result is False


def test_complex_json_value():
    """Test storing and retrieving complex JSON structures"""
    test_key = "complex_json_setting"
    complex_value = {
        "nested": {
            "object": {
                "with": ["arrays", "and", "strings"]
            }
        },
        "numbers": [1, 2, 3.14],
        "boolean": True,
        "null_value": None
    }

    SystemSettingsRepository.set(test_key, complex_value, "Complex JSON test")

    retrieved = SystemSettingsRepository.get(test_key)

    assert retrieved is not None
    assert retrieved["value"] == complex_value
    assert retrieved["value"]["nested"]["object"]["with"] == ["arrays", "and", "strings"]
    assert retrieved["value"]["numbers"][2] == 3.14


def test_menu_visibility_structure():
    """Test the actual menu_visibility structure used in production"""
    menu_visibility = {
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
                "security": True
            }
        }
    }

    SystemSettingsRepository.set(
        "menu_visibility_test",
        menu_visibility,
        "Menu visibility configuration"
    )

    retrieved = SystemSettingsRepository.get("menu_visibility_test")

    assert retrieved is not None
    assert "menu_visibility" in retrieved["value"]
    assert "project_tabs" in retrieved["value"]["menu_visibility"]
    assert retrieved["value"]["menu_visibility"]["project_tabs"]["board"] is True
