"""
Repository layer for database access using the Repository pattern.
Provides clean abstraction over database operations (Supabase or PostgreSQL).
"""
from typing import List, Optional, Dict, Any
from app.models.schemas import (
    Project, ProjectCreate, 
    Repository, RepositoryCreate,
    ProjectTask, ProjectMilestone
)
from app.db.supabase_client import get_supabase
from app.core.config import get_settings


class ProjectRepository:
    """Repository for Project entity operations."""
    
    @staticmethod
    async def get_all() -> List[Project]:
        """Get all projects."""
        settings = get_settings()
        
        if settings.database_provider == "postgres":
            # Use PostgreSQL
            from app.db.postgres_repositories import get_postgres_pool, PostgresProjectRepository
            pool = await get_postgres_pool()
            repo = PostgresProjectRepository(pool)
            data = await repo.get_all()
            return [Project(**p) for p in data]
        else:
            # Use Supabase
            supabase = get_supabase()
            result = supabase.table("projects").select("*").execute()
            return [Project(**p) for p in result.data]
    
    @staticmethod
    async def get_by_id(project_id: int) -> Optional[Project]:
        """Get project by ID."""
        settings = get_settings()
        
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresProjectRepository
            pool = await get_postgres_pool()
            repo = PostgresProjectRepository(pool)
            data = await repo.get_by_id(project_id)
            return Project(**data) if data else None
        else:
            supabase = get_supabase()
            result = supabase.table("projects").select("*").eq("id", project_id).execute()
            if result.data:
                return Project(**result.data[0])
            return None
    
    @staticmethod
    async def create(project_data: Dict[str, Any]) -> Project:
        """Create a new project."""
        settings = get_settings()
        
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresProjectRepository
            pool = await get_postgres_pool()
            repo = PostgresProjectRepository(pool)
            data = await repo.create(project_data)
            return Project(**data)
        else:
            supabase = get_supabase()
            result = supabase.table("projects").insert(project_data).execute()
            return Project(**result.data[0])
    
    @staticmethod
    async def update(project_id: int, updates: Dict[str, Any]) -> Optional[Project]:
        """Update a project."""
        settings = get_settings()
        
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresProjectRepository
            pool = await get_postgres_pool()
            repo = PostgresProjectRepository(pool)
            data = await repo.update(project_id, updates)
            return Project(**data) if data else None
        else:
            supabase = get_supabase()
            result = supabase.table("projects").update(updates).eq("id", project_id).execute()
            if result.data:
                return Project(**result.data[0])
            return None
    
    @staticmethod
    async def delete(project_id: int) -> bool:
        """Delete a project."""
        settings = get_settings()
        
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresProjectRepository
            pool = await get_postgres_pool()
            repo = PostgresProjectRepository(pool)
            return await repo.delete(project_id)
        else:
            supabase = get_supabase()
            result = supabase.table("projects").delete().eq("id", project_id).execute()
            return len(result.data) > 0
    
    @staticmethod
    async def get_repositories(project_id: int) -> List[int]:
        """Get repository IDs for a project."""
        settings = get_settings()
        
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresProjectRepository
            pool = await get_postgres_pool()
            repo = PostgresProjectRepository(pool)
            return await repo.get_repositories(project_id)
        else:
            supabase = get_supabase()
            result = supabase.table("project_repositories")\
                .select("repository_id")\
                .eq("project_id", project_id)\
                .execute()
            return [r["repository_id"] for r in result.data]
    
    @staticmethod
    async def set_repositories(project_id: int, repository_ids: List[int]) -> bool:
        """Set repositories for a project (replaces existing)."""
        settings = get_settings()
        
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresProjectRepository
            pool = await get_postgres_pool()
            repo = PostgresProjectRepository(pool)
            return await repo.set_repositories(project_id, repository_ids)
        else:
            supabase = get_supabase()
            
            # Delete existing relationships
            supabase.table("project_repositories")\
                .delete()\
                .eq("project_id", project_id)\
                .execute()
            
            # Insert new relationships
            if repository_ids:
                relationships = [
                    {"project_id": project_id, "repository_id": repo_id}
                    for repo_id in repository_ids
                ]
                supabase.table("project_repositories").insert(relationships).execute()
            
            return True


class RepositoryRepository:
    """Repository for Repository entity operations."""
    
    @staticmethod
    async def get_all() -> List[Repository]:
        """Get all repositories."""
        settings = get_settings()
        
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresRepositoryRepository
            pool = await get_postgres_pool()
            repo = PostgresRepositoryRepository(pool)
            data = await repo.get_all()
            return [Repository(**r) for r in data]
        else:
            supabase = get_supabase()
            result = supabase.table("repositories").select("*").execute()
            return [Repository(**r) for r in result.data]
    
    @staticmethod
    async def get_by_id(repo_id: int) -> Optional[Repository]:
        """Get repository by ID."""
        settings = get_settings()
        
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresRepositoryRepository
            pool = await get_postgres_pool()
            repo = PostgresRepositoryRepository(pool)
            data = await repo.get_by_id(repo_id)
            return Repository(**data) if data else None
        else:
            supabase = get_supabase()
            result = supabase.table("repositories").select("*").eq("id", repo_id).execute()
            if result.data:
                return Repository(**result.data[0])
            return None
    
    @staticmethod
    async def get_by_project(project_id: int) -> List[Repository]:
        """Get all repositories for a project."""
        settings = get_settings()
        
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresRepositoryRepository
            pool = await get_postgres_pool()
            repo = PostgresRepositoryRepository(pool)
            data = await repo.get_by_project(project_id)
            return [Repository(**r) for r in data]
        else:
            supabase = get_supabase()
            result = supabase.table("project_repositories")\
                .select("repository_id")\
                .eq("project_id", project_id)\
                .execute()
            
            repo_ids = [r["repository_id"] for r in result.data]
            if not repo_ids:
                return []
            
            repos_result = supabase.table("repositories")\
                .select("*")\
                .in_("id", repo_ids)\
                .execute()
            
            return [Repository(**r) for r in repos_result.data]
    
    @staticmethod
    async def create(repository_data: Dict[str, Any]) -> Repository:
        """Create a new repository."""
        settings = get_settings()
        
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresRepositoryRepository
            pool = await get_postgres_pool()
            repo = PostgresRepositoryRepository(pool)
            data = await repo.create(repository_data)
            return Repository(**data)
        else:
            supabase = get_supabase()
            result = supabase.table("repositories").insert(repository_data).execute()
            return Repository(**result.data[0])
    
    @staticmethod
    async def update(repo_id: int, updates: Dict[str, Any]) -> Optional[Repository]:
        """Update a repository."""
        settings = get_settings()
        
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresRepositoryRepository
            pool = await get_postgres_pool()
            repo_obj = PostgresRepositoryRepository(pool)
            data = await repo_obj.update(repo_id, updates)
            return Repository(**data) if data else None
        else:
            supabase = get_supabase()
            result = supabase.table("repositories").update(updates).eq("id", repo_id).execute()
            if result.data:
                return Repository(**result.data[0])
            return None
    
    @staticmethod
    async def delete(repo_id: int) -> bool:
        """Delete a repository."""
        settings = get_settings()
        
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresRepositoryRepository
            pool = await get_postgres_pool()
            repo = PostgresRepositoryRepository(pool)
            return await repo.delete(repo_id)
        else:
            supabase = get_supabase()
            result = supabase.table("repositories").delete().eq("id", repo_id).execute()
            return len(result.data) > 0


class ProjectTaskRepository:
    """Repository for Project Tasks (Backlog/Board)."""
    
    @staticmethod
    async def get_by_project(project_id: int) -> List[ProjectTask]:
        """Get all tasks for a project."""
        settings = get_settings()
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresProjectTaskRepository
            pool = await get_postgres_pool()
            repo = PostgresProjectTaskRepository(pool)
            data = await repo.get_by_project(project_id)
            return [ProjectTask(**t) for t in data]
            
        supabase = get_supabase()
        
        # Try backlog first
        result = supabase.table("project_backlog_items")\
            .select("*")\
            .eq("project_id", project_id)\
            .execute()
        
        if result.data:
            return [ProjectTask(**t) for t in result.data]
        
        # Try board tasks
        result = supabase.table("project_board_tasks")\
            .select("*")\
            .eq("project_id", project_id)\
            .execute()
        
        return [ProjectTask(**t) for t in result.data]
    
    @staticmethod
    async def create(project_id: int, task: ProjectTask, table: str = "project_board_tasks") -> ProjectTask:
        """Create a new task."""
        supabase = get_supabase()
        data = task.dict()
        data["project_id"] = project_id
        result = supabase.table(table).insert(data).execute()
        return ProjectTask(**result.data[0])
    
    @staticmethod
    async def update_status(task_id: str, status: str, table: str = "project_board_tasks") -> bool:
        """Update task status."""
        supabase = get_supabase()
        result = supabase.table(table)\
            .update({"status": status})\
            .eq("id", task_id)\
            .execute()
        return len(result.data) > 0


class ProjectMilestoneRepository:
    """Repository for Project Milestones (Roadmap)."""
    
    @staticmethod
    async def get_by_project(project_id: int) -> List[ProjectMilestone]:
        """Get all milestones for a project."""
        settings = get_settings()
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresProjectMilestoneRepository
            pool = await get_postgres_pool()
            repo = PostgresProjectMilestoneRepository(pool)
            data = await repo.get_by_project(project_id)
            return [ProjectMilestone(**m) for m in data]
            
        supabase = get_supabase()
        result = supabase.table("project_milestones")\
            .select("*")\
            .eq("project_id", project_id)\
            .execute()
        return [ProjectMilestone(**m) for m in result.data]
    
    @staticmethod
    async def create(project_id: int, milestone: ProjectMilestone) -> ProjectMilestone:
        """Create a new milestone."""
        supabase = get_supabase()
        data = milestone.dict(exclude={"id"})
        data["project_id"] = project_id
        result = supabase.table("project_milestones").insert(data).execute()
        return ProjectMilestone(**result.data[0])
    
    @staticmethod
    async def update(milestone_id: int, updates: Dict[str, Any]) -> Optional[ProjectMilestone]:
        """Update a milestone."""
        supabase = get_supabase()
        result = supabase.table("project_milestones")\
            .update(updates)\
            .eq("id", milestone_id)\
            .execute()
        if result.data:
            return ProjectMilestone(**result.data[0])
        return None
    
    @staticmethod
    async def delete(milestone_id: int) -> bool:
        """Delete a milestone."""
        supabase = get_supabase()
        result = supabase.table("project_milestones")\
            .delete()\
            .eq("id", milestone_id)\
            .execute()
        return len(result.data) > 0
    
    @staticmethod
    async def delete_by_label(project_id: int, label: str) -> bool:
        """Delete milestone by label (for backward compatibility)."""
        supabase = get_supabase()
        result = supabase.table("project_milestones")\
            .delete()\
            .eq("project_id", project_id)\
            .eq("label", label)\
            .execute()
        return len(result.data) > 0
    
    @staticmethod
    async def update_by_label(project_id: int, label: str, updates: Dict[str, Any]) -> bool:
        """Update milestone by label."""
        supabase = get_supabase()
        result = supabase.table("project_milestones")\
            .update(updates)\
            .eq("project_id", project_id)\
            .eq("label", label)\
            .execute()
        return len(result.data) > 0


class SystemSettingsRepository:
    """Repository for System Settings operations."""

    @staticmethod
    async def get(key: str) -> Optional[Dict[str, Any]]:
        """Get a system setting by key."""
        settings = get_settings()
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresSystemSettingsRepository
            pool = await get_postgres_pool()
            repo = PostgresSystemSettingsRepository(pool)
            return await repo.get(key)
            
        supabase = get_supabase()
        result = supabase.table("system_settings").select("*").eq("key", key).execute()
        if result.data:
            return result.data[0]
        return None

    @staticmethod
    async def get_all() -> List[Dict[str, Any]]:
        """Get all system settings."""
        settings = get_settings()
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresSystemSettingsRepository
            pool = await get_postgres_pool()
            repo = PostgresSystemSettingsRepository(pool)
            return await repo.get_all()
            
        supabase = get_supabase()
        result = supabase.table("system_settings").select("*").execute()
        return result.data

    @staticmethod
    async def set(key: str, value: Dict[str, Any], description: str = None) -> Dict[str, Any]:
        """Set or update a system setting."""
        settings = get_settings()
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresSystemSettingsRepository
            pool = await get_postgres_pool()
            repo = PostgresSystemSettingsRepository(pool)
            return await repo.set(key, value, description)
            
        supabase = get_supabase()
        data = {
            "key": key,
            "value": value
        }
        if description:
            data["description"] = description

        # Upsert with conflict resolution on 'key' column
        result = supabase.table("system_settings").upsert(data, on_conflict="key").execute()
        return result.data[0] if result.data else None

    @staticmethod
    async def delete(key: str) -> bool:
        """Delete a system setting by key."""
        settings = get_settings()
        if settings.database_provider == "postgres":
            from app.db.postgres_repositories import get_postgres_pool, PostgresSystemSettingsRepository
            pool = await get_postgres_pool()
            repo = PostgresSystemSettingsRepository(pool)
            return await repo.delete(key)
            
        supabase = get_supabase()
        result = supabase.table("system_settings").delete().eq("key", key).execute()
        return len(result.data) > 0
