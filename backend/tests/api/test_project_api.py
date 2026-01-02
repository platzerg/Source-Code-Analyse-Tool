import pytest

def test_get_projects_api(client, test_project):
    """Test GET /projects endpoint."""
    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    projects = response.json()
    assert any(p["id"] == test_project["id"] for p in projects)

def test_create_project_api(client):
    """Test POST /projects endpoint."""
    payload = {
        "name": "API Test Project",
        "description": "Created via API test",
        "owner": "APIBot",
        "start_date": "2026-01-01"
    }
    response = client.post("/api/v1/projects", json=payload)
    assert response.status_code == 200
    project = response.json()
    assert project["name"] == payload["name"]
    
    # Cleanup
    client.delete(f"/api/v1/projects/{project['id']}")

def test_link_repos_api(client, test_project, test_repo):
    """Test project-repository linking via API."""
    payload = [test_repo["id"]]
    response = client.put(f"/api/v1/projects/{test_project['id']}/repositories", json=payload)
    assert response.status_code == 200
    
    # Verify via detail view
    detail_resp = client.get(f"/api/v1/projects/{test_project['id']}")
    assert detail_resp.status_code == 200
    project = detail_resp.json()
    assert test_repo["id"] in project["repository_ids"]
