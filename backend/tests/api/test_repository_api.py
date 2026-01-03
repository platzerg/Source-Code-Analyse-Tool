import pytest
import os

# --- Positive Tests ---

def test_get_repositories_api(client, test_repo):
    """Test GET /repositories endpoint."""
    response = client.get("/api/v1/repositories")
    assert response.status_code == 200
    repos = response.json()
    assert any(r["id"] == test_repo["id"] for r in repos)

def test_create_repository_api(client):
    """Test POST /repositories endpoint."""
    payload = {
        "name": "API Test Repo",
        "url": f"https://github.com/test/api-repo-{os.urandom(4).hex()}.git",
        "main_branch": "main"
    }
    response = client.post("/api/v1/repositories", json=payload)
    assert response.status_code == 200
    repo = response.json()
    assert repo["url"] == payload["url"]

    # Cleanup
    client.delete(f"/api/v1/repositories/{repo['id']}")

def test_get_repository_by_id(client, test_repo):
    """Test GET /repositories/{id} endpoint."""
    response = client.get(f"/api/v1/repositories/{test_repo['id']}")

    assert response.status_code == 200
    repo = response.json()
    assert repo["id"] == test_repo["id"]
    assert repo["name"] == test_repo["name"]
    assert "url" in repo
    assert "status" in repo

def test_delete_repository_api(client):
    """Test DELETE /repositories/{id} endpoint."""
    # Create a repository to delete
    payload = {
        "name": "Repo to Delete",
        "url": f"https://github.com/test/delete-repo-{os.urandom(4).hex()}.git",
        "main_branch": "main"
    }
    create_resp = client.post("/api/v1/repositories", json=payload)
    repo = create_resp.json()

    # Delete it
    delete_resp = client.delete(f"/api/v1/repositories/{repo['id']}")
    assert delete_resp.status_code == 200
    assert "success" in delete_resp.json()["status"]

    # Verify it's gone
    get_resp = client.get(f"/api/v1/repositories/{repo['id']}")
    assert get_resp.status_code == 404

def test_stream_status_api(client, test_repo):
    """Test streaming status endpoint (initial response)."""
    response = client.get(f"/api/v1/repositories/{test_repo['id']}/stream-status")
    # StreamingResponse should return 200 and custom headers
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]

def test_stream_status_scan_mode(client, test_repo):
    """Test streaming status endpoint with scan mode."""
    response = client.get(f"/api/v1/repositories/{test_repo['id']}/stream-status?mode=scan")

    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]

def test_get_repo_ai_features(client, test_repo):
    """Test GET /repositories/{id}/ai-features endpoint."""
    response = client.get(f"/api/v1/repositories/{test_repo['id']}/ai-features")

    assert response.status_code == 200
    features = response.json()
    assert isinstance(features, list)

    # If there are features, validate structure
    if len(features) > 0:
        feature = features[0]
        assert "feature_type" in feature
        assert "status" in feature

def test_trigger_ai_analysis(client, test_repo):
    """Test POST /repositories/{id}/actions/analyze endpoint."""
    response = client.post(
        f"/api/v1/repositories/{test_repo['id']}/actions/analyze",
        params={"feature_type": "code_quality"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "message" in data


# --- Negative Tests ---

def test_get_repository_not_found():
    """Test GET /repositories/{id} with non-existent ID returns 404."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    response = client.get("/api/v1/repositories/99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_delete_repository_not_found():
    """Test DELETE /repositories/{id} with non-existent ID returns 404."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    response = client.delete("/api/v1/repositories/99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_stream_status_repository_not_found():
    """Test GET /repositories/{id}/stream-status with non-existent repository returns 404."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    response = client.get("/api/v1/repositories/99999/stream-status")
    assert response.status_code == 404
