"""
Project service layer - refactored to use Supabase database.
"""
from typing import List, Optional
from app.models.schemas import Project, ProjectCreate, ProjectTask, ProjectMilestone
from app.db.repositories import (
    ProjectRepository,
    ProjectTaskRepository,
    ProjectMilestoneRepository
)


def get_all_projects() -> List[Project]:
    """Get all projects from database."""
    return ProjectRepository.get_all()


def get_project_by_id(project_id: int) -> Optional[Project]:
    """Get project by ID from database."""
    return ProjectRepository.get_by_id(project_id)


def create_project(project_in: ProjectCreate, user_id: str = None) -> Project:
    """Create a new project in database."""
    project_data = project_in.dict()
    if user_id:
        project_data["user_id"] = user_id
    return ProjectRepository.create(project_data)


def delete_project(project_id: int) -> bool:
    """Delete a project from database."""
    return ProjectRepository.delete(project_id)


def update_project_repos(project_id: int, repo_ids: List[int]) -> bool:
    """Update project-repository relationships."""
    return ProjectRepository.set_repositories(project_id, repo_ids)


def get_project_repositories(project_id: int) -> List[int]:
    """Get repository IDs for a project."""
    return ProjectRepository.get_repositories(project_id)


def add_task(project_id: int, task: ProjectTask) -> Optional[ProjectTask]:
    """Add a task to a project."""
    return ProjectTaskRepository.create(project_id, task)


def update_task_status(project_id: int, task_id: str, status: str) -> bool:
    """Update task status."""
    return ProjectTaskRepository.update_status(task_id, status)


def get_project_tasks(project_id: int) -> List[ProjectTask]:
    """Get all tasks for a project."""
    return ProjectTaskRepository.get_by_project(project_id)


def add_milestone(project_id: int, milestone: ProjectMilestone) -> Optional[ProjectMilestone]:
    """Add a milestone to a project."""
    return ProjectMilestoneRepository.create(project_id, milestone)


def delete_milestone(project_id: int, label: str) -> bool:
    """Delete a milestone by label."""
    return ProjectMilestoneRepository.delete_by_label(project_id, label)


def update_milestone(project_id: int, label: str, update_data: ProjectMilestone) -> Optional[ProjectMilestone]:
    """Update a milestone."""
    # Find milestone by label first
    milestones = ProjectMilestoneRepository.get_by_project(project_id)
    milestone = next((m for m in milestones if m.label == label), None)
    
    if milestone:
        updates = update_data.dict(exclude_unset=True, exclude={"id"})
        return ProjectMilestoneRepository.update(milestone.id, updates)
    return None


def update_milestone_date(project_id: int, label: str, date: str) -> bool:
    """Update milestone date."""
    # Find milestone by label first
    milestones = ProjectMilestoneRepository.get_by_project(project_id)
    milestone = next((m for m in milestones if m.label == label), None)
    
    if milestone:
        result = ProjectMilestoneRepository.update(milestone.id, {"start_date": date})
        return result is not None
    return False


def get_project_milestones(project_id: int) -> List[ProjectMilestone]:
    """Get all milestones for a project."""
    return ProjectMilestoneRepository.get_by_project(project_id)
