from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

# Data Models
class Product(BaseModel):
    id: int
    name: str
    price: float
    category: str
    stock: int

class Stats(BaseModel):
    total_products: int
    total_value: float
    active_categories: int

class ProjectCreate(BaseModel):
    name: str
    description: str
    owner: str
    start_date: str

class Project(BaseModel):
    id: int
    name: str
    description: str
    owner: str
    start_date: str
    status: str

class RepositoryCreate(BaseModel):
    name: str
    url: str
    token: str = ""
    username: str = ""
    date_range: int = 365
    main_branch: str = "main"

class Repository(BaseModel):
    id: int
    name: str
    url: str
    username: str = ""
    main_branch: str = "main"
    status: str = "Cloned"
    commit_analysis: str = "Not Started"
    repo_scan: str = "Not Started"
    added_at: str
    scanned_at: str = ""

# Mock Data
import json
import os
from datetime import datetime

PROJECTS_FILE = "projects.json"
REPOSITORIES_FILE = "repositories.json"

def load_projects():
    if not os.path.exists(PROJECTS_FILE):
        return []
    try:
        with open(PROJECTS_FILE, "r") as f:
            data = json.load(f)
            return [Project(**p) for p in data]
    except Exception:
        return []

def save_projects(projects: List[Project]):
    with open(PROJECTS_FILE, "w") as f:
        data = [p.dict() for p in projects]
        json.dump(data, f, indent=4)

def load_repositories():
    if not os.path.exists(REPOSITORIES_FILE):
        return []
    try:
        with open(REPOSITORIES_FILE, "r") as f:
            data = json.load(f)
            return [Repository(**r) for r in data]
    except Exception:
        return []

def save_repositories(repositories: List[Repository]):
    with open(REPOSITORIES_FILE, "w") as f:
        data = [r.dict() for r in repositories]
        json.dump(data, f, indent=4)

# Mock Data (initialization)
if not os.path.exists(REPOSITORIES_FILE):
    initial_repos = [
        Repository(id=1, name="msg-zen-test-ai-backend", url="https://github.com/msggroup-AGKI/msg-zen-test-ai-backend", username="msggroup-agki", main_branch="main", added_at="Dec 12, 2025, 12:08 PM"),
        Repository(id=2, name="msg-zen-test-ai-runner", url="https://github.com/msggroup-AGKI/msg-zen-test-ai-runner", username="msggroup-agki", main_branch="develop", added_at="Dec 11, 2025, 08:22 PM"),
        Repository(id=3, name="msg-zen-test-ai-frontend", url="https://github.com/msggroup-AGKI/msg-zen-test-ai-frontend", username="msggroup-agki", main_branch="master", added_at="Dec 11, 2025, 11:31 AM"),
    ]
    save_repositories(initial_repos)

MOCK_PRODUCTS = [
    Product(id=1, name="Laptop Pro", price=1299.99, category="Electronics", stock=15),
    Product(id=2, name="Wireless Mouse", price=29.99, category="Electronics", stock=50),
    Product(id=3, name="Ergonomic Chair", price=349.00, category="Furniture", stock=8),
    Product(id=4, name="Coffee Maker", price=89.99, category="Appliances", stock=20),
]

# 1. Health Check Endpoint
@router.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "service": "product-catalog-api"}

# 2. Products Endpoint
@router.get("/products", response_model=List[Product], tags=["Products"])
async def get_products():
    return MOCK_PRODUCTS

# 3. Stats Endpoint (Dashboard Metrics)
@router.get("/stats", response_model=Stats, tags=["Dashboard"])
async def get_stats():
    total_value = sum(p.price * p.stock for p in MOCK_PRODUCTS)
    categories = set(p.category for p in MOCK_PRODUCTS)
    return Stats(
        total_products=len(MOCK_PRODUCTS),
        total_value=round(total_value, 2),
        active_categories=len(categories)
    )

# 4. Projects Endpoints

@router.get("/projects", response_model=List[Project], tags=["Projects"])
async def get_projects():
    return load_projects()

@router.post("/projects", response_model=Project, tags=["Projects"])
async def create_project(project: ProjectCreate):
    current_projects = load_projects()
    new_id = len(current_projects) + 1
    new_project = Project(
        id=new_id,
        name=project.name,
        description=project.description,
        owner=project.owner,
        start_date=project.start_date,
        status="active"
    )
    current_projects.append(new_project)
    save_projects(current_projects)
    return new_project

# 5. Repository Endpoints

@router.get("/repositories", response_model=List[Repository], tags=["Repositories"])
async def get_repositories():
    return load_repositories()

@router.post("/repositories", response_model=Repository, tags=["Repositories"])
async def create_repository(repo: RepositoryCreate):
    current_repos = load_repositories()
    new_id = (max([r.id for r in current_repos]) if current_repos else 0) + 1
    new_repo = Repository(
        id=new_id,
        name=repo.name,
        url=repo.url,
        username=repo.username,
        main_branch=repo.main_branch,
        status="Cloned",
        commit_analysis="Not Started",
        repo_scan="Not Started",
        added_at=datetime.now().strftime("%b %d, %Y, %I:%M %p")
    )
    current_repos.append(new_repo)
    save_repositories(current_repos)
    return new_repo

@router.delete("/projects/{project_id}", tags=["Projects"])
async def delete_project(project_id: int):
    current_projects = load_projects()
    updated_projects = [p for p in current_projects if p.id != project_id]
    save_projects(updated_projects)
    return {"status": "success", "message": f"Project {project_id} deleted"}

@router.delete("/repositories/{repo_id}", tags=["Repositories"])
async def delete_repository(repo_id: int):
    current_repos = load_repositories()
    updated_repos = [r for r in current_repos if r.id != repo_id]
    save_repositories(updated_repos)
    return {"status": "success", "message": f"Repository {repo_id} deleted"}

@router.get("/projects/{project_id}", response_model=Project, tags=["Projects"])
async def get_project(project_id: int):
    current_projects = load_projects()
    for p in current_projects:
        if p.id == project_id:
            return p
    return None # Or raise 404

@router.get("/repositories/{repo_id}/stream-status", tags=["Repositories"])
async def stream_repository_status(repo_id: int, mode: str = "clone"):
    from fastapi.responses import StreamingResponse
    from fastapi import HTTPException
    import asyncio
    import json

    current_repos = load_repositories()
    repo = next((r for r in current_repos if r.id == repo_id), None)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    async def event_generator():
        if mode == "scan":
            steps = [
                (10, "Starting repository scan..."),
                (25, "Analyzing individual files... (5/27 files)"),
                (45, "Analyzing individual files... (12/27 files)"),
                (65, "Analyzing individual files... (21/27 files)"),
                (85, "Analyzing individual files... (27/27 files)"),
                (92, "Aggregating folder summaries..."),
                (98, "Finalizing code analysis..."),
                (100, "Ready!")
            ]
        else:
            steps = [
                (5, "Initializing connection..."),
                (10, "Authenticating with provider..."),
                (20, f"Cloning repository: {repo.name}..."),
                (30, "Cloning complete. Starting repository scan..."),
                (40, "Analyzing individual files... (5/27 files)"),
                (55, "Analyzing individual files... (12/27 files)"),
                (70, "Analyzing individual files... (21/27 files)"),
                (85, "Analyzing individual files... (27/27 files)"),
                (92, "Aggregating folder summaries..."),
                (100, "Ready!")
            ]

        for progress, message in steps:
            data = json.dumps({"progress": progress, "message": message})
            yield f"data: {data}\n\n"
            
            if progress == 100:
                # Update persistent state
                current_repos = load_repositories()
                for r in current_repos:
                    if r.id == repo_id:
                        r.repo_scan = "Completed"
                        r.scanned_at = datetime.now().strftime("%b %d, %y, %I:%M %p")
                        break
                save_repositories(current_repos)
                
            await asyncio.sleep(1.2) # Simulate work

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/repositories/{repo_id}", response_model=Repository, tags=["Repositories"])
async def get_repository(repo_id: int):
    from fastapi import HTTPException
    current_repos = load_repositories()
    for r in current_repos:
        if r.id == repo_id:
            return r
    raise HTTPException(status_code=404, detail="Repository not found")

# 6. AI Features & Insights Endpoints (Mock/Simulated)

class AIFeatureResult(BaseModel):
    id: str
    type: str # 'documentation', 'review', 'refactor', 'bug-prediction'
    title: str
    description: str
    status: str # 'completed', 'pending', 'failed'
    content: dict # Flexible content payload

class ProjectInsight(BaseModel):
    type: str # 'contributors', 'churn', 'debt', 'changelog'
    data: dict

@router.get("/repositories/{repo_id}/ai-features", response_model=List[AIFeatureResult], tags=["AI Features"])
async def get_repo_ai_features(repo_id: int):
    # Simulate processing time or return pre-calculated mock data
    return [
        AIFeatureResult(
            id="1",
            type="documentation",
            title="Auto-Documentation Generator",
            description="Generates JSDoc/DocStrings for complex files.",
            status="completed",
            content={
                "files_documented": 5,
                "example_file": "src/utils/helpers.ts"
            }
        ),
        AIFeatureResult(
            id="2",
            type="review",
            title="Code Review Suggestions",
            description="AI-driven code quality checks.",
            status="completed",
            content={
                "issues_found": 3,
                "critical_severity": 0
            }
        ),
         AIFeatureResult(
            id="3",
            type="refactor",
            title="Refactoring Recommendations",
            description="Suggestions for code structure improvements.",
            status="completed",
            content={
                "recommendation": "Extract 'UserProfile' component from 'Header.tsx'"
            }
        ),
         AIFeatureResult(
            id="4",
            type="bug-prediction",
            title="Bug Prediction",
            description="Identifies high-risk files.",
            status="completed",
            content={
                "high_risk_files": ["src/api/payment.ts"]
            }
        )
    ]

@router.post("/repositories/{repo_id}/actions/analyze", tags=["AI Features"])
async def trigger_ai_analysis(repo_id: int, feature_type: str):
    # In a real app, this would trigger a background job (Celery/redis-queue)
    # For now, we simulate a successful trigger
    return {"status": "success", "message": f"Analysis for {feature_type} started."}

@router.get("/projects/{project_id}/insights", response_model=List[ProjectInsight], tags=["Project Insights"])
async def get_project_insights(project_id: int):
    return [
        ProjectInsight(
            type="contributors",
            data={
                "labels": ["Alice", "Bob", "Charlie", "Dave"],
                "datasets": [{
                    "label": "Commits",
                    "data": [45, 30, 15, 10],
                    "backgroundColor": ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
                }]
            }
        ),
        ProjectInsight(
            type="churn",
            data={
                "high_risk_files": [
                    {"name": "src/App.tsx", "changes": 52},
                    {"name": "src/utils/api.ts", "changes": 34},
                    {"name": "backend/main.py", "changes": 28}
                ]
            }
        ),
        ProjectInsight(
            type="debt",
            data={
                "total_debt_hours": 128,
                "debt_ratio": "15%",
                "top_offenders": ["LegacyAuth.tsx", "DataParser.js"]
            }
        )
    ]
