"""
Tests for Settings API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.repositories import SystemSettingsRepository

client = TestClient(app)


def test_get_settings_endpoint():
    """Test GET /api/v1/settings endpoint"""
    response = client.get("/api/v1/settings")

    assert response.status_code == 200
    data = response.json()

    # Should return menu_visibility structure
    assert "menu_visibility" in data
    assert "project_tabs" in data["menu_visibility"]
    assert "repository_tabs" in data["menu_visibility"]


def test_post_settings_endpoint():
    """Test POST /api/v1/settings endpoint"""
    test_settings = {
        "menu_visibility": {
            "project_tabs": {
                "repositories": True,
                "backlog": False,
                "board": True,
                "roadmap": False,
                "insights": True
            },
            "repository_tabs": {
                "overview": True,
                "technologies": False,
                "security": True
            }
        }
    }

    response = client.post("/api/v1/settings", json=test_settings)

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Settings updated successfully"

    # Verify settings were actually saved
    get_response = client.get("/api/v1/settings")
    assert get_response.status_code == 200
    saved_settings = get_response.json()

    assert saved_settings == test_settings
    assert saved_settings["menu_visibility"]["project_tabs"]["backlog"] is False


def test_post_settings_persistence():
    """Test that posted settings persist across requests"""
    settings_v1 = {
        "menu_visibility": {
            "project_tabs": {
                "repositories": True,
                "backlog": True
            },
            "repository_tabs": {
                "overview": True
            }
        }
    }

    # Post first version
    client.post("/api/v1/settings", json=settings_v1)

    # Get settings
    response1 = client.get("/api/v1/settings")
    assert response1.json() == settings_v1

    # Post updated version
    settings_v2 = {
        "menu_visibility": {
            "project_tabs": {
                "repositories": False,
                "backlog": False,
                "board": True
            },
            "repository_tabs": {
                "overview": False,
                "technologies": True
            }
        }
    }

    client.post("/api/v1/settings", json=settings_v2)

    # Verify update
    response2 = client.get("/api/v1/settings")
    assert response2.json() == settings_v2
    assert response2.json() != settings_v1


def test_get_overview_endpoint():
    """Test GET /api/v1/overview endpoint"""
    response = client.get("/api/v1/overview")

    assert response.status_code == 200
    data = response.json()

    # Should have system_status and stats
    assert "system_status" in data
    assert "stats" in data

    # system_status structure
    assert "operational" in data["system_status"]
    assert "message" in data["system_status"]
    assert "last_updated" in data["system_status"]

    # stats structure
    assert "total_projects" in data["stats"]
    assert "total_repositories" in data["stats"]
    assert "active_projects" in data["stats"]
    assert "cloned_repositories" in data["stats"]


def test_overview_system_status_from_supabase():
    """Test that overview endpoint loads system_status from Supabase"""
    # Set a custom system status
    custom_status = {
        "operational": False,
        "message": "Test maintenance mode",
        "last_updated": "2025-01-03T15:30:00Z"
    }

    SystemSettingsRepository.set(
        "system_status",
        custom_status,
        "Test system status"
    )

    # Get overview
    response = client.get("/api/v1/overview")

    assert response.status_code == 200
    data = response.json()

    # Verify system_status matches what we set
    assert data["system_status"]["operational"] is False
    assert data["system_status"]["message"] == "Test maintenance mode"
    assert data["system_status"]["last_updated"] == "2025-01-03T15:30:00Z"


def test_overview_stats_are_dynamic():
    """Test that overview stats are calculated dynamically from database"""
    response = client.get("/api/v1/overview")

    assert response.status_code == 200
    data = response.json()

    # Stats should be integers (counts from database)
    assert isinstance(data["stats"]["total_projects"], int)
    assert isinstance(data["stats"]["total_repositories"], int)
    assert isinstance(data["stats"]["active_projects"], int)
    assert isinstance(data["stats"]["cloned_repositories"], int)

    # All counts should be non-negative
    assert data["stats"]["total_projects"] >= 0
    assert data["stats"]["total_repositories"] >= 0


def test_post_settings_with_invalid_json():
    """Test POST /api/v1/settings with invalid structure"""
    # This should still work since we accept any dict
    invalid_settings = {
        "random_key": "random_value"
    }

    response = client.post("/api/v1/settings", json=invalid_settings)

    # Should succeed (no strict validation)
    assert response.status_code == 200


def test_post_settings_with_empty_object():
    """Test POST /api/v1/settings with empty object"""
    response = client.post("/api/v1/settings", json={})

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Settings updated successfully"


def test_settings_endpoint_integration():
    """Integration test: Full flow of updating and retrieving settings"""
    # Step 1: Get initial settings
    initial_response = client.get("/api/v1/settings")
    assert initial_response.status_code == 200

    # Step 2: Update settings
    new_settings = {
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
                "timeline": False,
                "security": True,
                "ai-features": True
            }
        }
    }

    update_response = client.post("/api/v1/settings", json=new_settings)
    assert update_response.status_code == 200

    # Step 3: Verify update
    verify_response = client.get("/api/v1/settings")
    assert verify_response.status_code == 200
    assert verify_response.json() == new_settings

    # Step 4: Update again with different values
    modified_settings = {
        "menu_visibility": {
            "project_tabs": {
                "repositories": False,
                "backlog": False,
                "board": True,
                "roadmap": False,
                "insights": False
            },
            "repository_tabs": {
                "overview": True,
                "technologies": False,
                "complexity": False,
                "timeline": False,
                "security": False,
                "ai-features": False
            }
        }
    }

    update_response2 = client.post("/api/v1/settings", json=modified_settings)
    assert update_response2.status_code == 200

    # Step 5: Verify second update
    final_response = client.get("/api/v1/settings")
    assert final_response.status_code == 200
    assert final_response.json() == modified_settings
    assert final_response.json()["menu_visibility"]["project_tabs"]["repositories"] is False
