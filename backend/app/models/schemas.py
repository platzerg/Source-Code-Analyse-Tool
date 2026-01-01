from pydantic import BaseModel
from typing import List, Optional, Dict, Any

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

class ProjectTask(BaseModel):
    id: str
    title: str
    status: str
    assignee: str
    priority: str
    due_date: str

class ProjectMilestone(BaseModel):
    label: str
    progress: int
    date: str
    end_date: Optional[str] = None

class ProjectStats(BaseModel):
    active_issues: int
    open_prs: int
    contributors: int

class Project(BaseModel):
    id: int
    name: str
    description: str
    owner: str
    start_date: str
    status: str
    tasks: Optional[List[ProjectTask]] = None
    milestones: Optional[List[ProjectMilestone]] = None
    stats: Optional[ProjectStats] = None
    repository_ids: Optional[List[int]] = []

class RepositoryCreate(BaseModel):
    name: str
    url: str
    token: str = ""
    username: str = ""
    date_range: int = 365
    main_branch: str = "main"

class TechStackItem(BaseModel):
    name: str
    fte: float
    commits: int
    complexity: float
    color: str

class Vulnerability(BaseModel):
    id: str
    severity: str
    package: str
    version: str
    description: str

class DetectedSecret(BaseModel):
    file: str
    line: int
    type: str
    snippet: str

class TeamStaffingRole(BaseModel):
    id: int
    title: str
    level: str
    initials: str
    skills: List[str]
    fte: str
    description: str

class DeadCodeItem(BaseModel):
    type: str
    name: str
    file: str
    line: int

class DuplicationBlock(BaseModel):
    similarity: int
    files: List[str]
    lines: int

class FlowNode(BaseModel):
    id: str
    position: Dict[str, float]
    data: Dict[str, str]
    style: Optional[Dict[str, Any]] = None

class FlowEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None

class ChatMessage(BaseModel):
    id: str
    title: str
    text: str
    date: str

class FeatureRequest(BaseModel):
    id: str
    title: str
    description: str
    date: str
    status: str
    complexity: str
    type: str
    summary: str
    identifiedFiles: List[str]
    prompt: str

class CodeFlowRequest(BaseModel):
    id: str
    title: str
    description: str
    date: str
    status: str
    content: Optional[Dict[str, Any]] = None # { "summary": str, "steps": List[Dict], "nodes": List, "edges": List }

class PullRequest(BaseModel):
    id: str
    title: str
    status: str # 'Open', 'Merged', 'Closed'
    author: str
    date: str
    files_changed: int
    additions: int
    deletions: int

class FeatureMap(BaseModel):
    nodes: List[FlowNode]
    edges: List[FlowEdge]

class DependencyStats(BaseModel):
    total: int
    internal: int
    external: int
    circular: int

class DependencyCircularPath(BaseModel):
    files: List[str]
    description: str

class ImportExportItem(BaseModel):
    name: str
    exports: int
    usedBy: int
    maturity: str

class OverviewAnalysis(BaseModel):
    stack_complexity_text: str
    ai_impact_text: str
    recommendations: List[Dict[str, str]]
    project_state: str

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
    analysis_metrics: Optional[Dict[str, Any]] = None
    tech_stack: Optional[List[TechStackItem]] = None
    vulnerabilities: Optional[List[Vulnerability]] = None
    secrets: Optional[List[DetectedSecret]] = None
    compliance: Optional[List[Dict[str, Any]]] = None
    team_staffing: Optional[List[TeamStaffingRole]] = None
    dead_code: Optional[List[DeadCodeItem]] = None
    duplication_blocks: Optional[List[DuplicationBlock]] = None
    complexity_by_file: Optional[List[Dict[str, Any]]] = None # { "name": str, "complexity": float }
    test_coverage: Optional[Dict[str, Any]] = None # { "total": int, "by_folder": List[Dict[str, Any]] }
    code_flows: Optional[Dict[str, Any]] = None # { "nodes": List[FlowNode], "edges": List[FlowEdge] }
    chat_history: Optional[List[ChatMessage]] = None
    feature_requests: Optional[List[FeatureRequest]] = None
    code_flow_requests: Optional[List[CodeFlowRequest]] = None
    dependency_stats: Optional[DependencyStats] = None
    dependency_graph: Optional[Dict[str, Any]] = None # { "nodes": List[FlowNode], "edges": List[FlowEdge] }
    circular_dependencies: Optional[List[DependencyCircularPath]] = None
    import_export_analysis: Optional[List[ImportExportItem]] = None
    security_score: Optional[str] = "B+"
    overview_analysis: Optional[OverviewAnalysis] = None
    pull_requests: Optional[List[PullRequest]] = None
    feature_map: Optional[FeatureMap] = None
    commits_count: Optional[str] = "0"
    vulnerabilities_count: Optional[int] = 0

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
