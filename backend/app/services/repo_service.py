from typing import List, Optional
from datetime import datetime
from app.core.config import REPOSITORIES_FILE
from app.db.storage import load_json, save_json
from app.models.schemas import Repository, RepositoryCreate, AIFeatureResult, ProjectInsight
from app.services.github_service import GitHubService
import asyncio

def get_all_repositories() -> List[Repository]:
    data = load_json(REPOSITORIES_FILE, [])
    # Handle potential missing fields by defaulting via Pydantic model
    return [Repository(**r) for r in data]

def get_repository_by_id(repo_id: int) -> Optional[Repository]:
    repos = get_all_repositories()
    return next((r for r in repos if r.id == repo_id), None)

async def create_repository(repo_in: RepositoryCreate) -> Repository:
    repos = get_all_repositories()
    new_id = (max([r.id for r in repos]) if repos else 0) + 1
    
    # Enrich with Real GitHub Data
    github_data = {}
    if repo_in.username and repo_in.name:
        gh = GitHubService(token=repo_in.token)
        github_data = await gh.get_repo_details(repo_in.username, repo_in.name)

    new_repo = Repository(
        id=new_id,
        name=repo_in.name,
        url=repo_in.url,
        username=repo_in.username,
        main_branch=repo_in.main_branch,
        status="Cloned",
        commit_analysis="Not Started",
        repo_scan="Not Started",
        added_at=datetime.now().strftime("%b %d, %Y, %I:%M %p"),
        # Determine strict analysis status based on connection
        security_score="A" if github_data else "Unknown"
    )
    
    # Store fetched metadata in analysis_metrics (flexible dict)
    if github_data:
        new_repo.analysis_metrics = {
            "stars": github_data.get("stars"),
            "open_issues": github_data.get("open_issues")
        }

    repos.append(new_repo)
    _save_repositories(repos)
    return new_repo

def delete_repository(repo_id: int) -> bool:
    repos = get_all_repositories()
    initial_len = len(repos)
    updated_repos = [r for r in repos if r.id != repo_id]
    if len(updated_repos) < initial_len:
        _save_repositories(updated_repos)
        return True
    return False

def update_scan_status(repo_id: int, status: str) -> bool:
    repos = get_all_repositories()
    for r in repos:
        if r.id == repo_id:
            r.repo_scan = status
            if status == "Completed":
                r.scanned_at = datetime.now().strftime("%b %d, %y, %I:%M %p")
            _save_repositories(repos)
            return True
    return False

def _save_repositories(repos: List[Repository]):
    save_json(REPOSITORIES_FILE, [r.dict() for r in repos])


# Mock AI Features ( Moved from endpoints )

def get_mock_ai_features(repo_id: int) -> List[AIFeatureResult]:
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

def get_mock_project_insights(project_id: int) -> List[ProjectInsight]:
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
        ),
        ProjectInsight(
            type="deployment",
            data={
                "frequency": "4.2/day",
                "trend": "+12%",
                "status": "High velocity"
            }
        ),
        ProjectInsight(
            type="changelog",
            data={
                "version": "v0.2.1-beta",
                "date": "Dec 2025",
                "changes": [
                    {"type": "New", "text": "Added Project Insights dashboard tab"},
                    {"type": "Fix", "text": "Resolved navigation lag on repository lists"}
                ],
                "next_version": "v0.3.0"
            }
        )
    ]
