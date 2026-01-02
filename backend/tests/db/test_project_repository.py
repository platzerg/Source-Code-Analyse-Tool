import pytest
from app.db.repositories import ProjectRepository

def test_create_project(db):
    """Test project creation."""
    project_data = {
        "name": "Repo Layer Test Project",
        "description": "Testing repository layer",
        "owner": "RepoTester",
        "start_date": "2026-01-01"
    }
    project = ProjectRepository.create(project_data)
    assert project.name == project_data["name"]
    assert project.id is not None
    
    # Cleanup
    ProjectRepository.delete(project.id)

def test_get_project_by_id(test_project):
    """Test project retrieval."""
    project = ProjectRepository.get_by_id(test_project["id"])
    assert project is not None
    assert project.id == test_project["id"]

def test_link_repositories(test_project, test_repo):
    """Test linking repositories to projects."""
    success = ProjectRepository.set_repositories(test_project["id"], [test_repo["id"]])
    assert success is True
    
    repo_ids = ProjectRepository.get_repositories(test_project["id"])
    assert test_repo["id"] in repo_ids
