from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any
import asyncio
import json
from datetime import datetime

# Imports from new structure
from app.models.schemas import (
    Product, Stats, Project, ProjectCreate, ProjectTask, ProjectMilestone, 
    Repository, RepositoryCreate, AIFeatureResult, ProjectInsight,
    OverviewAnalysis
)
from app.core.config import OVERVIEW_FILE, SETTINGS_FILE
from app.db.storage import load_json, save_json
from app.services import project_service, repo_service

router = APIRouter()

# --- 1. Products & Dashboard Stats (Mock Data) ---
# Keeping this simple as it wasn't part of core refactoring scope yet
MOCK_PRODUCTS = [
    Product(id=1, name="Laptop Pro", price=1299.99, category="Electronics", stock=15),
    Product(id=2, name="Wireless Mouse", price=29.99, category="Electronics", stock=50),
    Product(id=3, name="Ergonomic Chair", price=349.00, category="Furniture", stock=8),
    Product(id=4, name="Coffee Maker", price=89.99, category="Appliances", stock=20),
]

@router.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "service": "product-catalog-api"}

@router.get("/products", response_model=List[Product], tags=["Products"])
async def get_products():
    return MOCK_PRODUCTS

@router.get("/stats", response_model=Stats, tags=["Dashboard"])
async def get_stats():
    total_value = sum(p.price * p.stock for p in MOCK_PRODUCTS)
    categories = set(p.category for p in MOCK_PRODUCTS)
    return Stats(
        total_products=len(MOCK_PRODUCTS),
        total_value=round(total_value, 2),
        active_categories=len(categories)
    )

# --- 2. Projects Endpoints (Delegating to Service) ---

@router.get("/projects", response_model=List[Project], tags=["Projects"])
async def get_projects():
    from app.main import tracer
    from contextlib import nullcontext
    
    span_context = tracer.start_as_current_span("GET /api/v1/projects") if tracer else nullcontext()
    with span_context as span:
        if tracer and span:
            span.set_attribute("http.method", "GET")
            span.set_attribute("http.route", "/api/v1/projects")
        
        projects = project_service.get_all_projects()
        
        if tracer and span:
            span.set_attribute("output.count", len(projects))
        
        return projects

@router.post("/projects", response_model=Project, tags=["Projects"])
async def create_project(project: ProjectCreate):
    from app.main import tracer
    from contextlib import nullcontext
    
    span_context = tracer.start_as_current_span("POST /api/v1/projects") if tracer else nullcontext()
    with span_context as span:
        if tracer and span:
            span.set_attribute("http.method", "POST")
            span.set_attribute("http.route", "/api/v1/projects")
            span.set_attribute("input.project_name", project.name)
            span.set_attribute("input.owner", project.owner)
        
        new_project = project_service.create_project(project)
        
        if tracer and span:
            span.set_attribute("output.project_id", new_project.id)
        
        return new_project

@router.delete("/projects/{project_id}", tags=["Projects"])
async def delete_project(project_id: int):
    from app.main import tracer
    from contextlib import nullcontext
    
    span_context = tracer.start_as_current_span(f"DELETE /api/v1/projects/{project_id}") if tracer else nullcontext()
    with span_context as span:
        if tracer and span:
            span.set_attribute("http.method", "DELETE")
            span.set_attribute("http.route", "/api/v1/projects/{project_id}")
            span.set_attribute("input.project_id", project_id)
        
        success = project_service.delete_project(project_id)
        if not success:
            if tracer and span:
                span.set_attribute("error", "Project not found")
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {"status": "success", "message": f"Project {project_id} deleted"}

@router.get("/projects/{project_id}", response_model=Project, tags=["Projects"])
async def get_project(project_id: int):
    from app.main import tracer
    from contextlib import nullcontext
    
    span_context = tracer.start_as_current_span(f"GET /api/v1/projects/{project_id}") if tracer else nullcontext()
    with span_context as span:
        if tracer and span:
            span.set_attribute("http.method", "GET")
            span.set_attribute("http.route", "/api/v1/projects/{project_id}")
            span.set_attribute("input.project_id", project_id)
        
        project = project_service.get_project_by_id(project_id)
        if not project:
            if tracer and span:
                span.set_attribute("error", "Project not found")
            raise HTTPException(status_code=404, detail="Project not found")
        
        if tracer and span:
            span.set_attribute("output.project_name", project.name)
            span.set_attribute("output.task_count", len(project.tasks) if project.tasks else 0)
            span.set_attribute("output.milestone_count", len(project.milestones) if project.milestones else 0)
        
        return project

from fastapi import APIRouter, HTTPException, Body
# ... (existing imports)

# ... (inside file)

@router.put("/projects/{project_id}/repositories")
def update_project_repositories(project_id: int, repository_ids: List[int] = Body(...)):
    success = project_service.update_project_repos(project_id, repository_ids)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Repositories updated successfully", "repository_ids": repository_ids}

@router.get("/projects/{project_id}/repositories", response_model=List[Repository])
def get_project_repositories(project_id: int):
    project = project_service.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    all_repos = repo_service.get_all_repositories()
    # Filter
    project_repos = [r for r in all_repos if r.id in (project.repository_ids or [])]
    return project_repos

# --- Task Management ---

@router.post("/projects/{project_id}/tasks")
def create_task(project_id: int, task: ProjectTask):
    created_task = project_service.add_task(project_id, task)
    if not created_task:
        raise HTTPException(status_code=404, detail="Project not found")
    return created_task

@router.put("/projects/{project_id}/tasks/{task_id}/status")
def update_task_status(project_id: int, task_id: str, status: str):
    success = project_service.update_task_status(project_id, task_id, status)
    if not success:
        raise HTTPException(status_code=404, detail="Project or task not found")
    return {"message": "Task status updated", "task_id": task_id, "status": status}

# --- Milestone Management ---

@router.post("/projects/{project_id}/milestones")
def create_milestone(project_id: int, milestone: ProjectMilestone):
    created = project_service.add_milestone(project_id, milestone)
    if not created:
        raise HTTPException(status_code=404, detail="Project not found")
    return created

@router.delete("/projects/{project_id}/milestones/{milestone_label}")
def delete_milestone(project_id: int, milestone_label: str):
    success = project_service.delete_milestone(project_id, milestone_label)
    if not success:
        raise HTTPException(status_code=404, detail="Project or milestone not found")
    return {"status": "success", "message": f"Milestone '{milestone_label}' deleted"}

@router.put("/projects/{project_id}/milestones/{milestone_label}")
def update_milestone(project_id: int, milestone_label: str, update_data: ProjectMilestone):
    updated = project_service.update_milestone(project_id, milestone_label, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Project or milestone not found")
    return updated

@router.put("/projects/{project_id}/milestones/{milestone_label}/date")
def update_milestone_date(project_id: int, milestone_label: str, date: str):
    success = project_service.update_milestone_date(project_id, milestone_label, date)
    if not success:
        raise HTTPException(status_code=404, detail="Project or milestone not found")
    return {"message": "Milestone date updated", "label": milestone_label, "date": date}


# --- 3. Repository Endpoints (Delegating to Service) ---

@router.get("/repositories", response_model=List[Repository], tags=["Repositories"])
async def get_repositories():
    from app.main import tracer
    from contextlib import nullcontext
    
    span_context = tracer.start_as_current_span("GET /api/v1/repositories") if tracer else nullcontext()
    with span_context as span:
        if tracer and span:
            span.set_attribute("http.method", "GET")
            span.set_attribute("http.route", "/api/v1/repositories")
        
        repos = repo_service.get_all_repositories()
        
        if tracer and span:
            span.set_attribute("output.count", len(repos))
        
        return repos

@router.post("/repositories", response_model=Repository, tags=["Repositories"])
async def create_repository(repo: RepositoryCreate):
    from app.main import tracer
    from contextlib import nullcontext
    
    span_context = tracer.start_as_current_span("POST /api/v1/repositories") if tracer else nullcontext()
    with span_context as span:
        if tracer and span:
            span.set_attribute("http.method", "POST")
            span.set_attribute("http.route", "/api/v1/repositories")
            span.set_attribute("input.repo_name", repo.name)
            span.set_attribute("input.repo_url", repo.url)
            span.set_attribute("input.username", repo.username)
        
        new_repo = await repo_service.create_repository(repo)
        
        if tracer and span:
            span.set_attribute("output.repo_id", new_repo.id)
            if new_repo.analysis_metrics:
                span.set_attribute("output.stars", new_repo.analysis_metrics.get("stars", 0))
        
        return new_repo

@router.delete("/repositories/{repo_id}", tags=["Repositories"])
async def delete_repository(repo_id: int):
    from app.main import tracer
    from contextlib import nullcontext
    
    span_context = tracer.start_as_current_span(f"DELETE /api/v1/repositories/{repo_id}") if tracer else nullcontext()
    with span_context as span:
        if tracer and span:
            span.set_attribute("http.method", "DELETE")
            span.set_attribute("http.route", "/api/v1/repositories/{repo_id}")
            span.set_attribute("input.repo_id", repo_id)
        
        success = repo_service.delete_repository(repo_id)
        if not success:
            if tracer and span:
                span.set_attribute("error", "Repository not found")
            raise HTTPException(status_code=404, detail="Repository not found")
        
        return {"status": "success", "message": f"Repository {repo_id} deleted"}

@router.get("/repositories/{repo_id}", response_model=Repository, tags=["Repositories"])
async def get_repository(repo_id: int):
    from app.main import tracer
    from contextlib import nullcontext
    
    span_context = tracer.start_as_current_span(f"GET /api/v1/repositories/{repo_id}") if tracer else nullcontext()
    with span_context as span:
        if tracer and span:
            span.set_attribute("http.method", "GET")
            span.set_attribute("http.route", "/api/v1/repositories/{repo_id}")
            span.set_attribute("input.repo_id", repo_id)
        
        repo = repo_service.get_repository_by_id(repo_id)
        if not repo:
            if tracer and span:
                span.set_attribute("error", "Repository not found")
            raise HTTPException(status_code=404, detail="Repository not found")
        
        if tracer and span:
            span.set_attribute("output.repo_name", repo.name)
            span.set_attribute("output.status", repo.status)
        
        return repo

@router.get("/repositories/{repo_id}/stream-status", tags=["Repositories"])
async def stream_repository_status(repo_id: int, mode: str = "clone"):
    # This logic involves generator/stream, kept in route for now but calls service for updates
    repo = repo_service.get_repository_by_id(repo_id)
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
                # Update persistent state via service
                repo_service.update_scan_status(repo_id, "Completed")
                
            await asyncio.sleep(1.2) # Simulate work

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# --- 4. AI Features & Insights (Delegating to Service/Mock) ---

@router.get("/repositories/{repo_id}/ai-features", response_model=List[AIFeatureResult], tags=["AI Features"])
async def get_repo_ai_features(repo_id: int):
    return repo_service.get_mock_ai_features(repo_id)

@router.post("/repositories/{repo_id}/actions/analyze", tags=["AI Features"])
async def trigger_ai_analysis(repo_id: int, feature_type: str):
    # Mock trigger
    return {"status": "success", "message": f"Analysis for {feature_type} started."}

@router.get("/projects/{project_id}/insights", response_model=List[ProjectInsight], tags=["Project Insights"])
async def get_project_insights(project_id: int):
    return repo_service.get_mock_project_insights(project_id)


# --- 5. Overview and Settings (Direct Storage Access for now) ---

@router.get("/overview")
def get_overview():
    """Get dashboard overview data including system status"""
    overview = load_json(OVERVIEW_FILE, {
        "system_status": {
            "operational": True, 
            "message": "System operational", 
            "last_updated": datetime.now().isoformat()
        },
        "stats": {}
    })
    
    # Update stats dynamically
    projects = project_service.get_all_projects()
    repositories = repo_service.get_all_repositories()
    
    overview["stats"] = {
        "total_projects": len(projects),
        "total_repositories": len(repositories),
        "active_projects": len([p for p in projects if p.status == "Active"]),
        "cloned_repositories": len([r for r in repositories if r.status == "Cloned"])
    }
    return overview

@router.get("/settings")
def get_settings():
    """Get application settings including menu visibility"""
    return load_json(SETTINGS_FILE, {})

@router.post("/settings")
def update_settings(settings: dict):
    """Update application settings"""
    save_json(SETTINGS_FILE, settings)
    return {"message": "Settings updated successfully"}
