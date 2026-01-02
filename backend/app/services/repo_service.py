"""
Repository service layer - refactored to use Supabase database.
"""
from typing import List, Optional
from app.models.schemas import Repository, RepositoryCreate, ProjectInsight, AIFeatureResult
from app.db.repositories import RepositoryRepository


def get_all_repositories() -> List[Repository]:
    """Get all repositories from database."""
    return RepositoryRepository.get_all()


def get_repository_by_id(repo_id: int) -> Optional[Repository]:
    """Get repository by ID with analysis results."""
    repo = RepositoryRepository.get_by_id(repo_id)
    if repo:
        # In a real system, we'd fetch these from their respective tables
        # For now, we ensure the Repository object can hold them
        pass
    return repo


def get_repositories_by_project(project_id: int) -> List[Repository]:
    """Get all repositories for a project."""
    return RepositoryRepository.get_by_project(project_id)


def create_repository(repository_in: RepositoryCreate, user_id: str = None) -> Repository:
    """Create a new repository in database."""
    # Only include fields that exist in the database schema
    repo_data = {
        "name": repository_in.name,
        "url": repository_in.url,
        "username": repository_in.username,
        "main_branch": repository_in.main_branch,
        "status": "pending"  # Initial status
    }
    if user_id:
        repo_data["user_id"] = user_id
    return RepositoryRepository.create(repo_data)


def update_repository_status(repo_id: int, status: str) -> Optional[Repository]:
    """Update repository status."""
    return RepositoryRepository.update(repo_id, {"status": status})


def delete_repository(repo_id: int) -> bool:
    """Delete a repository from database."""
    return RepositoryRepository.delete(repo_id)


def update_repository(repo_id: int, updates: dict) -> Optional[Repository]:
    """Update repository fields."""
    return RepositoryRepository.update(repo_id, updates)


def update_scan_status(repo_id: int, status: str) -> None:
    """Update repository scan status."""
    RepositoryRepository.update(repo_id, {"repo_scan": status})


def get_mock_project_insights(project_id: int) -> List[ProjectInsight]:
    """Return mock project insights data."""
    return [
        ProjectInsight(
            type="debt",
            data={
                "debt_ratio": "12.5%",
                "total_debt_hours": 48,
                "top_offenders": ["Authentication Module", "Database Layer", "API Routes"]
            }
        ),
        ProjectInsight(
            type="deployment",
            data={
                "frequency": "2.4/week",
                "trend": "+15%",
                "status": "Healthy deployment cadence"
            }
        ),
        ProjectInsight(
            type="contributors",
            data={
                "labels": ["Alice", "Bob", "Charlie", "Diana"],
                "datasets": [{"data": [45, 32, 28, 15]}]
            }
        ),
        ProjectInsight(
            type="churn",
            data={
                "high_risk_files": [
                    {"name": "auth/login.py", "changes": 23},
                    {"name": "api/endpoints.py", "changes": 18},
                    {"name": "db/models.py", "changes": 15}
                ]
            }
        ),
        ProjectInsight(
            type="changelog",
            data={
                "version": "v1.2.0",
                "date": "2026-01-02",
                "next_version": "v1.3.0",
                "changes": [
                    {"type": "feat", "text": "Added project insights dashboard"},
                    {"type": "fix", "text": "Fixed authentication bug"},
                    {"type": "docs", "text": "Updated API documentation"}
                ]
            }
        )
    ]


def get_mock_ai_features(repo_id: int) -> List[AIFeatureResult]:
    """Return mock AI features data."""
    return [
        AIFeatureResult(
            feature_name="Code Quality Analysis",
            status="completed",
            result={
                "score": 8.5,
                "issues": 12,
                "suggestions": ["Reduce cyclomatic complexity", "Add more unit tests"]
            },
            timestamp="2026-01-02T10:30:00Z"
        ),
        AIFeatureResult(
            feature_name="Security Scan",
            status="completed",
            result={
                "vulnerabilities": 3,
                "severity": "medium",
                "details": ["SQL injection risk in query builder", "Outdated dependency: requests"]
            },
            timestamp="2026-01-02T10:35:00Z"
        ),
        AIFeatureResult(
            feature_name="Documentation Generator",
            status="in_progress",
            result={},
            timestamp="2026-01-02T10:40:00Z"
        )
    ]
