import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.supabase_client import get_supabase
import os

@pytest.fixture(scope="session")
def client():
    """FastAPI test client fixture."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="session")
def db():
    """Supabase client fixture (Production/Dev DB)."""
    # For now, we use the actual DB provided in .env
    # User can set a different DB for tests if needed
    return get_supabase()

@pytest.fixture
def test_project(db):
    """Fixture to create and cleanup a test project."""
    project_data = {
        "name": "Pytest Test Project",
        "description": "Created during automated testing",
        "owner": "PytestBot",
        "start_date": "2026-01-01"
    }
    result = db.table("projects").insert(project_data).execute()
    project = result.data[0]
    yield project
    # Cleanup
    db.table("projects").delete().eq("id", project["id"]).execute()

@pytest.fixture
def test_repo(db):
    """Fixture to create and cleanup a test repository."""
    repo_data = {
        "name": "Pytest Test Repo",
        "url": f"https://github.com/test/repo-{os.urandom(4).hex()}.git",
        "main_branch": "main",
        "status": "pending"
    }
    result = db.table("repositories").insert(repo_data).execute()
    repo = result.data[0]
    yield repo
    # Cleanup
    db.table("repositories").delete().eq("id", repo["id"]).execute()
