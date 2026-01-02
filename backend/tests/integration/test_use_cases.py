import pytest
import time

def test_full_project_lifecycle(client):
    """
    Use Case: End-to-end Project Lifecycle
    1. Create Project
    2. Create Repository
    3. Link Repository to Project
    4. Fetch Project Details and verify aggregation
    """
    print("\nStarting Lifecycle Test...")
    
    # 1. Create Project
    proj_payload = {
        "name": f"Lifecycle Project {int(time.time())}",
        "description": "Integration Test",
        "owner": "IntegrationBot",
        "start_date": "2026-01-01"
    }
    resp = client.post("/api/v1/projects", json=proj_payload)
    assert resp.status_code == 200
    project = resp.json()
    project_id = project["id"]
    
    # 2. Create Repository
    repo_payload = {
        "name": f"Lifecycle Repo {int(time.time())}",
        "url": f"https://github.com/integration/repo-{int(time.time())}.git",
        "main_branch": "main"
    }
    resp = client.post("/api/v1/repositories", json=repo_payload)
    assert resp.status_code == 200
    repo = resp.json()
    repo_id = repo["id"]
    
    # 3. Link Repository
    resp = client.put(f"/api/v1/projects/{project_id}/repositories", json=[repo_id])
    assert resp.status_code == 200
    
    # 4. Verify Aggregation
    resp = client.get(f"/api/v1/projects/{project_id}")
    assert resp.status_code == 200
    details = resp.json()
    assert details["id"] == project_id
    assert repo_id in details["repository_ids"]
    
    # Final Cleanup
    client.delete(f"/api/v1/projects/{project_id}")
    client.delete(f"/api/v1/repositories/{repo_id}")
