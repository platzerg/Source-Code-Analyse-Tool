import pytest
from app.db.repositories import RepositoryRepository

def test_create_repository(db):
    """Test repository creation."""
    import os
    repo_data = {
        "name": "Repo Layer Test Repo",
        "url": f"https://github.com/test/repo-{os.urandom(4).hex()}.git",
        "main_branch": "main",
        "status": "pending"
    }
    repo = RepositoryRepository.create(repo_data)
    assert repo.name == repo_data["name"]
    assert repo.url == repo_data["url"]
    
    # Cleanup
    RepositoryRepository.delete(repo.id)

def test_get_repositories_by_project(test_project, test_repo):
    """Test retrieval of repositories by project ID."""
    from app.db.repositories import ProjectRepository
    ProjectRepository.set_repositories(test_project["id"], [test_repo["id"]])
    
    repos = RepositoryRepository.get_by_project(test_project["id"])
    assert len(repos) == 1
    assert repos[0].id == test_repo["id"]
