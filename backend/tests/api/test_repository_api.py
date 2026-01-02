import pytest
import os

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

def test_stream_status_api(client, test_repo):
    """Test streaming status endpoint (initial response)."""
    response = client.get(f"/api/v1/repositories/{test_repo['id']}/stream-status")
    # StreamingResponse should return 200 and custom headers
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
