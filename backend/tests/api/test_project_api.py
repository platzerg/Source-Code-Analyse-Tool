import pytest

# --- Positive Tests ---

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

def test_get_project_by_id(client, test_project):
    """Test GET /projects/{id} endpoint."""
    response = client.get(f"/api/v1/projects/{test_project['id']}")

    assert response.status_code == 200
    project = response.json()
    assert project["id"] == test_project["id"]
    assert project["name"] == test_project["name"]
    assert "tasks" in project
    assert "milestones" in project

def test_delete_project_api(client):
    """Test DELETE /projects/{id} endpoint."""
    # Create a project to delete
    payload = {
        "name": "Project to Delete",
        "description": "Will be deleted",
        "owner": "TestUser",
        "start_date": "2026-01-01"
    }
    create_resp = client.post("/api/v1/projects", json=payload)
    project = create_resp.json()

    # Delete it
    delete_resp = client.delete(f"/api/v1/projects/{project['id']}")
    assert delete_resp.status_code == 200
    assert "success" in delete_resp.json()["status"]

    # Verify it's gone
    get_resp = client.get(f"/api/v1/projects/{project['id']}")
    assert get_resp.status_code == 404

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

def test_get_project_repositories(client, test_project, test_repo):
    """Test GET /projects/{id}/repositories endpoint."""
    # Link a repository first
    client.put(f"/api/v1/projects/{test_project['id']}/repositories", json=[test_repo["id"]])

    # Get repositories
    response = client.get(f"/api/v1/projects/{test_project['id']}/repositories")
    assert response.status_code == 200

    repos = response.json()
    assert isinstance(repos, list)
    assert len(repos) > 0
    assert any(r["id"] == test_repo["id"] for r in repos)

def test_create_task(client, test_project):
    """Test POST /projects/{id}/tasks endpoint."""
    task_data = {
        "title": "Test Task",
        "description": "Test task description",
        "status": "To Do",
        "assignee": "TestUser"
    }

    response = client.post(f"/api/v1/projects/{test_project['id']}/tasks", json=task_data)
    assert response.status_code == 200

    task = response.json()
    assert task["title"] == task_data["title"]
    assert task["status"] == task_data["status"]

def test_update_task_status(client, test_project):
    """Test PUT /projects/{id}/tasks/{task_id}/status endpoint."""
    # Create a task first
    task_data = {
        "title": "Task to Update",
        "description": "Will update status",
        "status": "To Do",
        "assignee": "TestUser"
    }
    create_resp = client.post(f"/api/v1/projects/{test_project['id']}/tasks", json=task_data)
    task = create_resp.json()

    # Update status
    response = client.put(
        f"/api/v1/projects/{test_project['id']}/tasks/{task['id']}/status",
        params={"status": "In Progress"}
    )
    assert response.status_code == 200
    assert "Task status updated" in response.json()["message"]

def test_create_milestone(client, test_project):
    """Test POST /projects/{id}/milestones endpoint."""
    milestone_data = {
        "label": "v1.0",
        "description": "First release"
    }

    response = client.post(f"/api/v1/projects/{test_project['id']}/milestones", json=milestone_data)
    assert response.status_code == 200

    milestone = response.json()
    assert milestone["label"] == milestone_data["label"]
    assert milestone["description"] == milestone_data["description"]

def test_update_milestone(client, test_project):
    """Test PUT /projects/{id}/milestones/{label} endpoint."""
    # Create a milestone first
    milestone_data = {
        "label": "v1.1",
        "description": "Original description"
    }
    client.post(f"/api/v1/projects/{test_project['id']}/milestones", json=milestone_data)

    # Update it
    updated_data = {
        "label": "v1.1",
        "description": "Updated description"
    }
    response = client.put(
        f"/api/v1/projects/{test_project['id']}/milestones/{milestone_data['label']}",
        json=updated_data
    )
    assert response.status_code == 200

    milestone = response.json()
    assert milestone["description"] == updated_data["description"]

def test_delete_milestone(client, test_project):
    """Test DELETE /projects/{id}/milestones/{label} endpoint."""
    # Create a milestone first
    milestone_data = {
        "label": "v2.0",
        "description": "To be deleted"
    }
    client.post(f"/api/v1/projects/{test_project['id']}/milestones", json=milestone_data)

    # Delete it
    response = client.delete(f"/api/v1/projects/{test_project['id']}/milestones/{milestone_data['label']}")
    assert response.status_code == 200
    assert "success" in response.json()["status"]


# --- Negative Tests ---

def test_get_project_not_found():
    """Test GET /projects/{id} with non-existent ID returns 404."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    response = client.get("/api/v1/projects/99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_delete_project_not_found():
    """Test DELETE /projects/{id} with non-existent ID returns 404."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    response = client.delete("/api/v1/projects/99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_update_project_repositories_not_found():
    """Test PUT /projects/{id}/repositories with non-existent project returns 404."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    response = client.put("/api/v1/projects/99999/repositories", json=[1, 2, 3])
    assert response.status_code == 404

def test_get_project_repositories_not_found():
    """Test GET /projects/{id}/repositories with non-existent project returns 404."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    response = client.get("/api/v1/projects/99999/repositories")
    assert response.status_code == 404

def test_create_task_project_not_found():
    """Test POST /projects/{id}/tasks with non-existent project returns 404."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    task_data = {"title": "Test Task", "status": "To Do"}
    response = client.post("/api/v1/projects/99999/tasks", json=task_data)
    assert response.status_code == 404

def test_update_task_status_not_found():
    """Test PUT /projects/{id}/tasks/{task_id}/status with non-existent task returns 404."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    response = client.put("/api/v1/projects/99999/tasks/fake-task-id/status", params={"status": "Done"})
    assert response.status_code == 404

def test_create_milestone_project_not_found():
    """Test POST /projects/{id}/milestones with non-existent project returns 404."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    milestone_data = {"label": "v1.0", "description": "Test"}
    response = client.post("/api/v1/projects/99999/milestones", json=milestone_data)
    assert response.status_code == 404

def test_delete_milestone_not_found():
    """Test DELETE /projects/{id}/milestones/{label} with non-existent milestone returns 404."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    response = client.delete("/api/v1/projects/99999/milestones/nonexistent")
    assert response.status_code == 404

def test_update_milestone_not_found():
    """Test PUT /projects/{id}/milestones/{label} with non-existent milestone returns 404."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    milestone_data = {"label": "v1.0", "description": "Updated"}
    response = client.put("/api/v1/projects/99999/milestones/nonexistent", json=milestone_data)
    assert response.status_code == 404
