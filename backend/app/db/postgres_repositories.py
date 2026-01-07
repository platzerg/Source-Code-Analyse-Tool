"""
PostgreSQL repository implementations using asyncpg.
"""
from typing import List, Optional, Dict, Any
import asyncpg
from datetime import datetime, date
from app.core.config import get_settings


def _convert_datetimes(row_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Convert datetime and date objects to ISO format strings for Pydantic."""
    result = {}
    for key, value in row_dict.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, date):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result


class PostgresProjectRepository:
    """PostgreSQL implementation of Project repository."""
    
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
    
    async def get_all(self) -> List[Dict[str, Any]]:
        """Get all projects."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM projects ORDER BY created_at DESC")
            return [_convert_datetimes(dict(row)) for row in rows]
    
    async def get_by_id(self, project_id: int) -> Optional[Dict[str, Any]]:
        """Get project by ID."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM projects WHERE id = $1", project_id)
            return _convert_datetimes(dict(row)) if row else None
    
    async def create(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new project."""
        async with self.pool.acquire() as conn:
            # Convert start_date string to date object if needed
            start_date_value = project_data.get("start_date")
            if isinstance(start_date_value, str):
                start_date_value = date.fromisoformat(start_date_value)
            
            row = await conn.fetchrow(
                """
                INSERT INTO projects (name, description, owner, start_date, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
                """,
                project_data.get("name"),
                project_data.get("description"),
                project_data.get("owner"),
                start_date_value,
                project_data.get("status", "active")
            )
            return _convert_datetimes(dict(row))
    
    async def update(self, project_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update a project."""
        # Build dynamic UPDATE query
        set_clauses = []
        values = []
        param_count = 1
        
        for key, value in updates.items():
            set_clauses.append(f"{key} = ${param_count}")
            values.append(value)
            param_count += 1
        
        values.append(project_id)
        
        query = f"""
            UPDATE projects 
            SET {', '.join(set_clauses)}
            WHERE id = ${param_count}
            RETURNING *
        """
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, *values)
            return _convert_datetimes(dict(row)) if row else None
    
    async def delete(self, project_id: int) -> bool:
        """Delete a project."""
        async with self.pool.acquire() as conn:
            result = await conn.execute("DELETE FROM projects WHERE id = $1", project_id)
            return result == "DELETE 1"
    
    async def get_repositories(self, project_id: int) -> List[int]:
        """Get repository IDs for a project."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT repository_id FROM project_repositories WHERE project_id = $1",
                project_id
            )
            return [row["repository_id"] for row in rows]

    async def set_repositories(self, project_id: int, repository_ids: List[int]) -> bool:
        """Set repositories for a project."""
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                # Delete existing
                await conn.execute("DELETE FROM project_repositories WHERE project_id = $1", project_id)
                # Insert new
                if repository_ids:
                    records = [(project_id, repo_id) for repo_id in repository_ids]
                    await conn.executemany(
                        "INSERT INTO project_repositories (project_id, repository_id) VALUES ($1, $2)",
                        records
                    )
                return True


class PostgresRepositoryRepository:
    """PostgreSQL implementation of Repository repository."""
    
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
    
    async def get_all(self) -> List[Dict[str, Any]]:
        """Get all repositories."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM repositories ORDER BY added_at DESC")
            return [_convert_datetimes(dict(row)) for row in rows]
    
    async def get_by_id(self, repo_id: int) -> Optional[Dict[str, Any]]:
        """Get repository by ID."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM repositories WHERE id = $1", repo_id)
            return _convert_datetimes(dict(row)) if row else None
    
    async def get_by_project(self, project_id: int) -> List[Dict[str, Any]]:
        """Get all repositories for a project."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT r.* FROM repositories r
                JOIN project_repositories pr ON r.id = pr.repository_id
                WHERE pr.project_id = $1
                """,
                project_id
            )
            return [_convert_datetimes(dict(row)) for row in rows]
    
    async def create(self, repository_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new repository."""
        async with self.pool.acquire() as conn:
            # Ensure status is lowercase
            status = repository_data.get("status", "pending").lower()
            row = await conn.fetchrow(
                """
                INSERT INTO repositories (name, url, username, main_branch, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
                """,
                repository_data.get("name"),
                repository_data.get("url"),
                repository_data.get("username"),
                repository_data.get("main_branch", "main"),
                status
            )
            return _convert_datetimes(dict(row))
    
    async def update(self, repo_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update a repository."""
        set_clauses = []
        values = []
        param_count = 1
        
        for key, value in updates.items():
            if key == "status" and isinstance(value, str):
                value = value.lower()
            set_clauses.append(f"{key} = ${param_count}")
            values.append(value)
            param_count += 1
        
        values.append(repo_id)
        
        query = f"""
            UPDATE repositories 
            SET {', '.join(set_clauses)}
            WHERE id = ${param_count}
            RETURNING *
        """
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, *values)
            return _convert_datetimes(dict(row)) if row else None
    
    async def delete(self, repo_id: int) -> bool:
        """Delete a repository."""
        async with self.pool.acquire() as conn:
            result = await conn.execute("DELETE FROM repositories WHERE id = $1", repo_id)
            return result == "DELETE 1"


class PostgresProjectTaskRepository:
    """PostgreSQL implementation of Project Task repository."""
    
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
        
    async def get_by_project(self, project_id: int) -> List[Dict[str, Any]]:
        """Get all tasks for a project."""
        async with self.pool.acquire() as conn:
            # Check project_board_tasks first
            rows = await conn.fetch("SELECT * FROM project_board_tasks WHERE project_id = $1", project_id)
            if not rows:
                rows = await conn.fetch("SELECT * FROM project_backlog_items WHERE project_id = $1", project_id)
            return [_convert_datetimes(dict(row)) for row in rows]

    async def create(self, project_id: int, task_data: Dict[str, Any], table: str = "project_board_tasks") -> Dict[str, Any]:
        """Create a new task."""
        async with self.pool.acquire() as conn:
            # Dynamic insert based on table
            cols = list(task_data.keys())
            if "project_id" not in cols:
                cols.append("project_id")
                task_data["project_id"] = project_id
            
            vals = [task_data[c] for c in cols]
            placeholders = [f"${i+1}" for i in range(len(cols))]
            
            query = f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join(placeholders)}) RETURNING *"
            row = await conn.fetchrow(query, *vals)
            return _convert_datetimes(dict(row))


class PostgresProjectMilestoneRepository:
    """PostgreSQL implementation of Project Milestone repository."""
    
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
        
    async def get_by_project(self, project_id: int) -> List[Dict[str, Any]]:
        """Get all milestones for a project."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM project_milestones WHERE project_id = $1", project_id)
            return [_convert_datetimes(dict(row)) for row in rows]


class PostgresSystemSettingsRepository:
    """PostgreSQL implementation of System Settings repository."""
    
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
        
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get a setting by key."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM system_settings WHERE key = $1", key)
            if row:
                d = dict(row)
                if isinstance(d.get('value'), str):
                    import json
                    try:
                        d['value'] = json.loads(d['value'])
                    except: pass
                return d
            return None

    async def get_all(self) -> List[Dict[str, Any]]:
        """Get all settings."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM system_settings")
            result = []
            for row in rows:
                d = dict(row)
                if isinstance(d.get('value'), str):
                    import json
                    try: d['value'] = json.loads(d['value'])
                    except: pass
                result.append(d)
            return result

    async def set(self, key: str, value: Any, description: str = None) -> Dict[str, Any]:
        """Set a setting."""
        import json
        val_str = json.dumps(value) if not isinstance(value, str) else value
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO system_settings (key, value, description)
                VALUES ($1, $2, $3)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description
                RETURNING *
                """,
                key, val_str, description
            )
            return dict(row)


# Connection pool singleton
_postgres_pool: Optional[asyncpg.Pool] = None


async def get_postgres_pool() -> asyncpg.Pool:
    """Get or create PostgreSQL connection pool."""
    global _postgres_pool
    
    if _postgres_pool is None:
        settings = get_settings()
        _postgres_pool = await asyncpg.create_pool(
            settings.postgres_connection_string,
            min_size=2,
            max_size=10
        )
        print(f"[PostgreSQL] Connection pool created: {settings.postgres_host}:{settings.postgres_port}", flush=True)
    
    return _postgres_pool


async def close_postgres_pool():
    """Close PostgreSQL connection pool."""
    global _postgres_pool
    if _postgres_pool:
        await _postgres_pool.close()
        _postgres_pool = None
        print("[PostgreSQL] Connection pool closed", flush=True)
