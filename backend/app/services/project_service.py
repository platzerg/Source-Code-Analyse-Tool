from typing import List, Optional
from app.core.config import PROJECTS_FILE
from app.db.storage import load_json, save_json
from app.models.schemas import Project, ProjectCreate, ProjectTask, ProjectMilestone

def get_all_projects() -> List[Project]:
    data = load_json(PROJECTS_FILE, [])
    return [Project(**p) for p in data]

def get_project_by_id(project_id: int) -> Optional[Project]:
    projects = get_all_projects()
    return next((p for p in projects if p.id == project_id), None)

def create_project(project_in: ProjectCreate) -> Project:
    projects = get_all_projects()
    new_id = len(projects) + 1
    new_project = Project(
        id=new_id,
        name=project_in.name,
        description=project_in.description,
        owner=project_in.owner,
        start_date=project_in.start_date,
        status="active"
    )
    projects.append(new_project)
    _save_projects(projects)
    return new_project

def delete_project(project_id: int) -> bool:
    projects = get_all_projects()
    initial_len = len(projects)
    projects = [p for p in projects if p.id != project_id]
    if len(projects) < initial_len:
        _save_projects(projects)
        return True
    return False

def update_project_repos(project_id: int, repo_ids: List[int]) -> bool:
    projects = get_all_projects()
    for p in projects:
        if p.id == project_id:
            p.repository_ids = repo_ids
            _save_projects(projects)
            return True
    return False

def add_task(project_id: int, task: ProjectTask) -> Optional[ProjectTask]:
    projects = get_all_projects()
    for p in projects:
        if p.id == project_id:
            if not p.tasks:
                p.tasks = []
            p.tasks.append(task)
            _save_projects(projects)
            return task
    return None

def update_task_status(project_id: int, task_id: str, status: str) -> bool:
    projects = get_all_projects()
    for p in projects:
        if p.id == project_id and p.tasks:
            for t in p.tasks:
                if t.id == task_id:
                    t.status = status
                    _save_projects(projects)
                    return True
    return False

def add_milestone(project_id: int, milestone: ProjectMilestone) -> Optional[ProjectMilestone]:
    projects = get_all_projects()
    for p in projects:
        if p.id == project_id:
            if not p.milestones:
                p.milestones = []
            p.milestones.append(milestone)
            _save_projects(projects)
            return milestone
    return None

def delete_milestone(project_id: int, label: str) -> bool:
    projects = get_all_projects()
    for p in projects:
        if p.id == project_id and p.milestones:
            initial_count = len(p.milestones)
            p.milestones = [m for m in p.milestones if m.label != label]
            if len(p.milestones) < initial_count:
                _save_projects(projects)
                return True
    return False

def update_milestone(project_id: int, label: str, update_data: ProjectMilestone) -> Optional[ProjectMilestone]:
    projects = get_all_projects()
    for p in projects:
        if p.id == project_id and p.milestones:
            for i, m in enumerate(p.milestones):
                if m.label == label:
                    p.milestones[i] = update_data
                    _save_projects(projects)
                    return update_data
    return None

def update_milestone_date(project_id: int, label: str, date: str) -> bool:
    projects = get_all_projects()
    for p in projects:
        if p.id == project_id and p.milestones:
            for m in p.milestones:
                if m.label == label:
                    m.date = date
                    _save_projects(projects)
                    return True
    return False

def _save_projects(projects: List[Project]):
    save_json(PROJECTS_FILE, [p.dict() for p in projects])
