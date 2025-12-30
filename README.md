# Source-Code-Analyse-Tool

A modern web application designed to analyze and manage source code repositories. It provides insights into transition planning, technical debt, and AI-driven code reviews.

## ✨ Visual Showcase

### Project Management
<table>
  <tr>
    <td width="50%"><img src="screenshots/dashboard_overview.png" alt="Dashboard Overview"/><br/><sub><b>System Overview</b>: Real-time status and cross-project metrics at a glance.</sub></td>
    <td width="50%"><img src="screenshots/projects_list.png" alt="Projects List"/><br/><sub><b>Project Hub</b>: Centralized management and access to all analysis projects.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="screenshots/project_details.png" alt="Project Details"/><br/><sub><b>Project Deep-Dive</b>: Detailed view of repositories assigned to a specific project.</sub></td>
    <td width="50%"><img src="screenshots/project_backlog.png" alt="Project Backlog"/><br/><sub><b>Backlog Management</b>: Prioritized list of tasks and feature requests.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="screenshots/kanban_board.png" alt="Kanban Board"/><br/><sub><b>Agile Tracking</b>: Interactive board for managing development tasks.</sub></td>
    <td width="50%"><img src="screenshots/project_roadmap.png" alt="Project Roadmap"/><br/><sub><b>Strategic Planning</b>: Multi-quarter roadmap visualization.</sub></td>
  </tr>
</table>

### Repository Operations
<table>
  <tr>
    <td width="50%"><img src="screenshots/repositories_list.png" alt="Repositories List"/><br/><sub><b>Repo Management</b>: Live progress tracking for clones and scans.</sub></td>
    <td width="50%"><img src="screenshots/add_repository.png" alt="Add Repository"/><br/><sub><b>Smart Integration</b>: Streamlined onboarding for remote or local repos.</sub></td>
  </tr>
</table>

### AI-Driven Analysis & Development assistance
<table>
  <tr>
    <td width="50%"><img src="screenshots/code_analysis.png" alt="Code Analysis"/><br/><sub><b>Impact Assessment</b>: AI recommendations and development effort estimation.</sub></td>
    <td width="50%"><img src="screenshots/tech_stack_analysis.png" alt="Tech Stack"/><br/><sub><b>Architectural Audit</b>: Deep-dive into technical composition and complexity.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="screenshots/project_insights.png" alt="Project Insights"/><br/><sub><b>Health Analytics</b>: Contributor analysis, code churn, and debt hotspots.</sub></td>
    <td width="50%"><img src="screenshots/ai_chat_new.png" alt="AI Chat Interface"/><br/><sub><b>Contextual AI</b>: Interactive chat for deep codebase querying and understanding.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="screenshots/prompt_generation_list.png" alt="Prompt Generation"/><br/><sub><b>Feature Request Hub</b>: Track and manage AI-generated implementation prompts.</sub></td>
    <td width="50%"><img src="screenshots/new_feature_request.png" alt="New Feature Request"/><br/><sub><b>Guided Prompting</b>: Structured interface for defining new features for AI analysis.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="screenshots/generated_implementation_prompt.png" alt="Generated Prompt"/><br/><sub><b>Implementation Blueprints</b>: AI-generated documentation for developers.</sub></td>
    <td width="50%"><img src="screenshots/ai_advanced_features.png" alt="Advanced AI"/><br/><sub><b>AI Automation</b>: Auto-documentation, code review suggestions, and bug prediction.</sub></td>
  </tr>
</table>

### Deep Technical Analysis
<table>
  <tr>
    <td width="50%"><img src="screenshots/code_flow_graph.png" alt="Code Flow Graph"/><br/><sub><b>Logic Visualization</b>: Automated mapping of application flows and logic paths.</sub></td>
    <td width="50%"><img src="screenshots/new_code_flow_analysis.png" alt="New Code Flow"/><br/><sub><b>Scenario Analysis</b>: Define and analyze specific use-cases across the codebase.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="screenshots/module_dependency_graph.png" alt="Dependency Graph"/><br/><sub><b>Structural Audit</b>: Visualizing module interactions and circular dependency detection.</sub></td>
    <td width="50%"><img src="screenshots/code_quality_metrics.png" alt="Code Quality"/><br/><sub><b>Quality Guardrails</b>: Dead code detection, complexity hotspots, and coverage trends.</sub></td>
  </tr>
  <tr>
    <td colspan="2"><img src="screenshots/team_staffing_recommendations.png" alt="Team Staffing"/><br/><sub><b>Resource Optimization</b>: AI-recommended team composition based on complexity.</sub></td>
  </tr>
</table>

### Security, Compliance & Customization
<table>
  <tr>
    <td width="50%"><img src="screenshots/security_audit.png" alt="Security Audit"/><br/><sub><b>Security Shield</b>: Vulnerability scanning, secret detection, and best-practice checks.</sub></td>
    <td width="50%"><img src="screenshots/global_settings.png" alt="Settings"/><br/><sub><b>Configuration</b>: Global application preferences and menu visibility control.</sub></td>
  </tr>
</table>

## 🚀 Features

- **Project Management**: Organize and track multiple source code projects.
- **Repository Integration**: Clone or upload repositories for deep analysis.
- **AI-Driven Insights**: Automated documentation, code reviews, and bug predictions using AI.
- **Dashboard Metrics**: Visualize total value, active categories, and project health.
- **Real-time Status**: Live streaming of repository cloning and scanning progress.

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Analysis**: Custom AI simulation and static analysis logic
- **Server**: Uvicorn with Auto-reload
- **Data Persistence**: Local JSON-based storage (managed via `projects.json` and `repositories.json`)

### Frontend
- **Framework**: Next.js 15 (React)
- **Styling**: Tailwind CSS
- **Components**: Lucide Icons, Custom UI components
- **State Management**: React Hooks & Fetch API

## 📊 Data Sources & Architecture

This application is **100% dynamized**, meaning all displayed data is fetched from the backend API and stored in JSON files. Below is a comprehensive overview of all tabs and their data sources.

### Backend Data Storage
- **`projects.json`**: Stores all project-level data (tasks, milestones, stats, insights)
- **`repositories.json`**: Stores all repository-level data (analysis, security, AI features, etc.)

### Dashboard (`/`)
| Tab | Data Source | JSON Fields Used |
|-----|-------------|------------------|
| **Overview** | `projects.json` + `repositories.json` | `projects[]`, `repositories[]`, `status` |
| **Status** | `projects.json` + `repositories.json` | `projects[].name`, `projects[].status`, `repositories[].name`, `repositories[].repo_scan` |

### Projects View (`/projects`)
| Section | Data Source | JSON Fields Used |
|---------|-------------|------------------|
| **Project List** | `projects.json` | `projects[].id`, `projects[].name`, `projects[].description`, `projects[].status`, `projects[].start_date` |

### Project Detail Page (`/projects/[id]`)
| Tab | Data Source | JSON Fields Used | Hardcoded/Client-Side Data |
|-----|-------------|------------------|---------------------------|
| **Repositories** | `projects.json` + `repositories.json` | `projects[].stats.active_issues`, `projects[].stats.open_prs`, `projects[].stats.contributors`, `repositories[].commits_count`, `repositories[].vulnerabilities_count` | Repository filtering logic |
| **Backlog** | `projects.json` | `projects[].tasks[]` (id, title, status, assignee, priority, due_date) | Task filtering by status |
| **Board** | `projects.json` | `projects[].tasks[]` | Kanban column grouping (To Do, In Progress, Done) |
| **Roadmap** | `projects.json` | `projects[].milestones[]` (label, progress, quarter) | Timeline visualization |
| **Insights** | `/api/v1/projects/{id}/insights` | `insights[]` (type: contributors, churn, debt, deployment, changelog) | Chart rendering (Recharts) |

### Repositories View (`/repositories`)
| Section | Data Source | JSON Fields Used |
|---------|-------------|------------------|
| **Repository List** | `repositories.json` | `repositories[].id`, `repositories[].name`, `repositories[].url`, `repositories[].status`, `repositories[].repo_scan`, `repositories[].added_at` |

### Repository Detail Page (`/repositories/[id]`)
| Tab | Data Source | JSON Fields Used | Hardcoded/Client-Side Data |
|-----|-------------|------------------|---------------------------|
| **Overview** | `repositories.json` | `overview_analysis.stack_complexity_text`, `overview_analysis.ai_impact_text`, `overview_analysis.recommendations[]`, `overview_analysis.project_state` | None |
| **Technologies** | `repositories.json` | `tech_stack[]` (name, fte, commits, complexity, color) | Chart rendering, color mapping |
| **Ask Questions** | `repositories.json` | `chat_history[]` (id, title, text, date) | Chat UI, message formatting |
| **Prompt Generation** | `repositories.json` | `feature_requests[]` (id, title, description, date, status, complexity, type, summary, identifiedFiles, prompt) | Loading animation states, prompt formatting |
| **Code Flows** | `repositories.json` | `code_flow_requests[]` (id, title, description, date, status), `code_flows.nodes[]`, `code_flows.edges[]` | ReactFlow rendering, initial hardcoded nodes/edges (fallback) |
| **Team Staffing** | `repositories.json` | `team_staffing[]` (id, title, level, initials, skills, fte, description) | Avatar generation, skill badges |
| **Code Quality** | `repositories.json` | `dead_code[]`, `duplication_blocks[]`, `complexity_by_file[]`, `test_coverage` | Complexity calculations, chart rendering |
| **Dependencies** | `repositories.json` | `dependency_stats`, `dependency_graph.nodes[]`, `dependency_graph.edges[]`, `circular_dependencies[]`, `import_export_analysis[]` | ReactFlow rendering, graph layout |
| **Security** | `repositories.json` | `vulnerabilities[]`, `secrets[]`, `compliance[]`, `security_score` | Severity color coding, compliance status icons |
| **Pull Requests** | `repositories.json` | `pull_requests[]` (id, title, status, author, date, files_changed, additions, deletions) | Status badges, date formatting |
| **Feature Map** | `repositories.json` | `feature_map.nodes[]`, `feature_map.edges[]` | ReactFlow rendering, node positioning |
| **AI Features** | `/api/v1/repositories/{id}/ai-features` | Dynamic endpoint (not in JSON) | Placeholder UI, feature cards |

### Settings Page (`/settings`)
| Section | Data Source | JSON Fields Used | Hardcoded/Client-Side Data |
|---------|-------------|------------------|---------------------------|
| **Menu Visibility** | None | None | `localStorage` (client-side persistence) |

### Data Not Sourced from JSON Files

The following UI elements and features are **not** stored in `projects.json` or `repositories.json`:

1. **Client-Side State Management**:
   - Tab visibility settings (stored in `localStorage`)
   - Active tab selection
   - Dialog/modal open states
   - Form input values

2. **Hardcoded UI Elements**:
   - Navigation menu structure
   - Tab names and icons
   - Color schemes and styling
   - Loading animations and spinners
   - Empty state messages

3. **Computed/Derived Data**:
   - Chart visualizations (rendered from JSON data using Recharts)
   - ReactFlow graph layouts (positions computed from node/edge data)
   - Date formatting and relative time displays
   - Aggregated statistics (e.g., total issues, average complexity)
   - Filtered/sorted lists

4. **Fallback/Initial Data**:
   - Initial ReactFlow nodes/edges in Code Flows tab (lines 79-94 in `repositories/[id]/page.tsx`)
   - Loading step animations for AI features

5. **Future/Placeholder Features**:
   - `/api/v1/repositories/{id}/ai-features` endpoint (not yet implemented in JSON)
   - Auto-fix buttons (UI only, no backend logic)
   - Edit/Regenerate buttons in AI features

## 📋 Getting Started

### Prerequisites
- Python 3.12 or higher
- Node.js 18 or higher
- npm or yarn

### Installation & Setup

#### 1. Backend Setup
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt  # Or use the pyproject.toml dependencies
```

#### 2. Frontend Setup
```powershell
cd frontend
npm install
```

### Running the Application

#### Start Backend
```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Start Frontend
```powershell
cd frontend
npm run dev
```
The application will be available at `http://localhost:3000`.

## 📂 Project Structure

- `backend/`: FastAPI application, API endpoints, and local data storage.
- `frontend/`: Next.js application with a modern, responsive UI.
- `9_Agent_SaaS/`: Integration modules for Agent-based SaaS features.

## 🛡 License
Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by Platzer Günter
