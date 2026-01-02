"""
Repository service layer - refactored to use Supabase database.
"""
from typing import List, Optional
from app.models.schemas import Repository, RepositoryCreate
from app.db.repositories import RepositoryRepository


def get_all_repositories() -> List[Repository]:
    """Get all repositories from database."""
    return RepositoryRepository.get_all()


def get_repository_by_id(repo_id: int) -> Optional[Repository]:
    """Get repository by ID from database."""
    return RepositoryRepository.get_by_id(repo_id)


def get_repositories_by_project(project_id: int) -> List[Repository]:
    """Get all repositories for a project."""
    return RepositoryRepository.get_by_project(project_id)


def create_repository(repository_in: RepositoryCreate) -> Repository:
    """Create a new repository in database."""
    return RepositoryRepository.create(repository_in)


def update_repository_status(repo_id: int, status: str) -> Optional[Repository]:
    """Update repository status."""
    return RepositoryRepository.update(repo_id, {"status": status})


def delete_repository(repo_id: int) -> bool:
    """Delete a repository from database."""
    return RepositoryRepository.delete(repo_id)


def update_repository(repo_id: int, updates: dict) -> Optional[Repository]:
    """Update repository fields."""
    return RepositoryRepository.update(repo_id, updates)
