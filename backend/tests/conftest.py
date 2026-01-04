import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.supabase_client import get_supabase
from app.core.redis_client import get_redis, reset_redis_client
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

@pytest.fixture
async def redis_fixture():
    """Redis test fixture with cleanup."""
    client = await get_redis()
    if client:
        # Clean up any existing test keys
        await client.flushdb()
    yield client
    if client:
        # Clean up after test
        await client.flushdb()
    # Reset client for next test
    reset_redis_client()

@pytest.fixture
def test_redis_fixture():
    """Sync wrapper for Redis fixture."""
    import asyncio
    return asyncio.run(redis_fixture())
