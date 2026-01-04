"""
Repository service layer - refactored to use Supabase database.
"""
from typing import List, Optional
from app.models.schemas import Repository, RepositoryCreate, ProjectInsight, AIFeatureResult
from app.db.repositories import RepositoryRepository
from app.core.cache import cache_result
import asyncio


def get_all_repositories() -> List[Repository]:
    """Get all repositories from database."""
    return RepositoryRepository.get_all()


def get_repository_by_id(repo_id: int) -> Optional[Repository]:
    """Get repository by ID with analysis results (sync version)."""
    return asyncio.run(get_repository_by_id_async(repo_id))


@cache_result(ttl=1800, key_prefix="repo")
async def get_repository_by_id_async(repo_id: int) -> Optional[Repository]:
    """Get repository by ID with analysis results."""
    repo = RepositoryRepository.get_by_id(repo_id)
    # Simulate expensive operation
    await asyncio.sleep(0.1)
    if repo:
        # Pydantic model will drop extra fields if we just do Repository(**dict), 
        # but here we are modifying the object found.
        # Let's verify if repo is a Pydantic object or dict. 
        # It's returned as Repository object from RepositoryRepository.
        
        # MOCK COMPLEXITY DATA
        from app.models.schemas import ComplexityAnalysis, AIImpact, RiskAnalysis
        
        repo.complexity_analysis = ComplexityAnalysis(
            score=70,
            rating="High Complexity",
            technology_diversity=25,
            category_spread=6,
            learning_curve="High",
            risk_level="Medium",
            stack_complexity_analysis="This project utilizes a modern and comprehensive frontend stack with a strong emphasis on React, TypeScript, and a rich set of UI/UX libraries. The integration of various tools for linting, formatting, testing, and API generation adds to the complexity. Dockerization indicates a structured deployment approach.",
            ai_impact=AIImpact(
                standard_oss_technologies=95,
                estimated_time_savings="30% (~101 days)",
                ai_adjusted_effort="1880h"
            ),
            risk_analysis=RiskAnalysis(
                high_risk=1,
                medium_risk=287,
                low_risk=873
            ),
            recommendations=[
                "Mitigate Key Contributor Risk: Prioritize comprehensive knowledge transfer from start (63% of dev hours) on core architecture, complex features, and multi-target CI/CD deployments to mitigate significant single-point-of-failure risk.",
                "Frontend & DevOps Expertise: Ensure the transition team has strong expertise in React, TypeScript, Material-UI, and complex CI/CD pipelines (GitHub Actions, Docker, Nginx, AWS/Azure/Porsche/Mercedes deployments).",
                "Deep Dive into Architectural Shifts: Focus knowledge transfer on major architectural changes like Zustand to context refactoring, API service facade restructuring, and dynamic Nginx/OAuth2 proxy configurations.",
                "Leverage AI for Boilerplate & Code Comprehension: Utilize AI coding assistants to accelerate boilerplate generation for React/MUI components, Node.js API endpoints, TypeScript definitions, and to rapidly understand existing code patterns.",
                "Estimated FTE Savings with AI: Expect AI coding assistants to reduce the transition team's initial ramp-up time and common coding task effort by 15-20%, leading to faster productivity.",
                "Strategic AI Application: Deploy AI for standard technology tasks (React, TypeScript, Node.js, basic CI/CD scripting) but rely on human expertise for complex domain-specific integrations (Zephyr Scale, AI model APIs) and critical architectural decisions.",
                "Review Breaking Changes: Thoroughly review all identified breaking changes (API contracts, DTOs, NestJS upgrades) from the monthly summaries to anticipate necessary adjustments during transition."
            ]
        )
        
        # MOCK TECH STACK DATA
        from app.models.schemas import TechStackItem
        
        repo.tech_stack = [
            TechStackItem(name="React", fte=450.5, commits=1250, complexity=6.8, color="#61DAFB"),
            TechStackItem(name="TypeScript", fte=380.2, commits=980, complexity=7.2, color="#3178C6"),
            TechStackItem(name="Node.js", fte=220.8, commits=560, complexity=5.5, color="#339933"),
            TechStackItem(name="Python", fte=180.5, commits=420, complexity=6.1, color="#3776AB"),
            TechStackItem(name="Docker", fte=95.3, commits=180, complexity=4.8, color="#2496ED"),
            TechStackItem(name="PostgreSQL", fte=75.2, commits=150, complexity=5.2, color="#4169E1"),
            TechStackItem(name="FastAPI", fte=65.8, commits=120, complexity=5.9, color="#009688"),
            TechStackItem(name="Next.js", fte=55.4, commits=95, complexity=6.5, color="#000000"),
        ]
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
    """Return mock project insights data (sync version)."""
    return asyncio.run(get_mock_project_insights_async(project_id))

@cache_result(ttl=1800, key_prefix="project_insights")
async def get_mock_project_insights_async(project_id: int) -> List[ProjectInsight]:
    """Return mock project insights data."""
    # Simulate expensive analysis operation
    await asyncio.sleep(0.8)
    
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
    """Return mock AI features data (sync version)."""
    return asyncio.run(get_mock_ai_features_async(repo_id))


@cache_result(ttl=1800, key_prefix="ai_features")
async def get_mock_ai_features_async(repo_id: int) -> List[AIFeatureResult]:
    """Return mock AI features data."""
    # Simulate expensive AI operation
    await asyncio.sleep(1.2)
    
    return [
        AIFeatureResult(
            id="1",
            type="review",
            title="Code Quality Review",
            description="Automated analysis of code quality and style.",
            status="completed",
            content={
                "issues_found": 12,
                "critical_severity": "High",
                "suggestions": ["Reduce cyclomatic complexity", "Add more unit tests"]
            }
        ),
        AIFeatureResult(
            id="2",
            type="bug-prediction",
            title="Security Scan",
            description="Vulnerability and security risk assessment.",
            status="completed",
            content={
                "vulnerabilities": 3,
                "severity": "medium",
                "details": ["SQL injection risk in query builder", "Outdated dependency: requests"]
            }
        ),
        AIFeatureResult(
            id="3",
            type="documentation",
            title="Documentation Generator",
            description="AI-generated documentation for complex functions.",
            status="completed",
            content={
                "example_file": "backend/app/auth.py"
            }
        ),
        AIFeatureResult(
            id="4",
            type="refactor",
            title="Refactoring Suggestions",
            description="Identified opportunities for code refactoring.",
            status="completed",
            content={
                "complexity_reduction": "25%",
                "maintainability_index": "Increased by 15 points"
            }
        )
    ]
