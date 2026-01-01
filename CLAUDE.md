# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **full-stack source code analysis and project management tool** built with FastAPI and Next.js. The application provides AI-driven insights into codebases, manages project workflows with Kanban boards and Gantt roadmaps, and tracks repositories with real-time scanning progress.

### Core Architecture

**Backend (FastAPI):**
- Single-file API (`backend/app/api/endpoints.py`) with ~793 lines
- JSON file-based persistence (`projects.json`, `repositories.json`)
- Server-sent events (SSE) for real-time repository status streaming
- No database - all data stored in local JSON files

**Frontend (Next.js 15):**
- React 19 with Tailwind CSS and Shadcn UI components
- Dynamic routing: `/projects/[id]`, `/repositories/[id]`
- Real-time data fetching from backend API
- Drag-and-drop interfaces using @dnd-kit

**Key Feature:** The application is **100% dynamized** - all UI data comes from the backend JSON files. No hardcoded data except empty states and loading animations.

## Development Commands

### Backend Setup & Running
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # PowerShell
pip install -r requirements.txt  # Install from pyproject.toml dependencies

# Start backend server (port 8000)
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Health check:** http://127.0.0.1:8000/api/v1/health
**API documentation:** http://127.0.0.1:8000/docs

### Frontend Setup & Running
```powershell
cd frontend
npm install

# Development server (port 3000)
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint
```

**Application:** http://localhost:3000

### Linting (Backend)
```powershell
cd backend
# Backend uses Ruff for linting and formatting
ruff check app/
ruff format app/
```

Configuration in `backend/pyproject.toml`:
- Line length: 120 characters
- Target: Python 3.12+
- Auto-fix enabled

## Data Architecture

### JSON Storage Pattern

All application state lives in two JSON files in the `backend/` directory:

**`projects.json`** - Project-level data:
```json
{
  "id": 1,
  "name": "Project Name",
  "description": "...",
  "status": "active",
  "tasks": [...],           // Backlog and Board tasks
  "milestones": [...],      // Roadmap timeline data
  "stats": {...},           // Dashboard metrics
  "repository_ids": [...]   // Linked repositories
}
```

**`repositories.json`** - Repository-level data:
```json
{
  "id": 1,
  "name": "repo-name",
  "status": "Cloned",
  "repo_scan": "Completed",
  "tech_stack": [...],           // Technology analysis
  "overview_analysis": {...},    // AI insights
  "chat_history": [...],         // Ask Questions tab
  "feature_requests": [...],     // Prompt Generation
  "code_flow_requests": [...],   // Code Flows
  "team_staffing": [...],        // Team recommendations
  "dead_code": [...],            // Quality metrics
  "vulnerabilities": [...],      // Security audit
  "pull_requests": [...],        // PR tracking
  "dependency_graph": {...},     // Module dependencies
  "feature_map": {...}           // Feature visualization
}
```

### Data Flow Pattern

1. **Frontend requests data:** `fetch('http://localhost:8000/api/v1/...')`
2. **Backend loads JSON:** `load_projects()` or `load_repositories()`
3. **Backend returns Pydantic models:** FastAPI serializes to JSON
4. **Frontend renders:** React components display data

**CRITICAL:** When modifying data structures:
1. Update Pydantic models in `backend/app/api/endpoints.py`
2. Modify JSON files directly or via API endpoints
3. Frontend automatically reflects changes (no type updates needed)

## API Endpoint Patterns

### Key Endpoints

**Projects:**
- `GET /api/v1/projects` - List all projects
- `POST /api/v1/projects` - Create new project
- `GET /api/v1/projects/{id}` - Get project details
- `PUT /api/v1/projects/{id}/repositories` - Link repositories to project
- `POST /api/v1/projects/{id}/tasks` - Create task
- `PUT /api/v1/projects/{id}/tasks/{task_id}/status` - Update task status
- `POST /api/v1/projects/{id}/milestones` - Create milestone
- `PUT /api/v1/projects/{id}/milestones/{label}/date` - Update milestone dates
- `DELETE /api/v1/projects/{id}` - Delete project

**Repositories:**
- `GET /api/v1/repositories` - List all repositories
- `POST /api/v1/repositories` - Add new repository
- `GET /api/v1/repositories/{id}` - Get repository details
- `GET /api/v1/repositories/{id}/stream-status` - SSE for clone/scan progress
- `POST /api/v1/repositories/{id}/actions/analyze` - Trigger analysis
- `DELETE /api/v1/repositories/{id}` - Delete repository

**Dashboard:**
- `GET /api/v1/overview` - System overview with aggregated stats
- `GET /api/v1/settings` - Global application settings
- `POST /api/v1/settings` - Update settings

### Server-Sent Events (SSE) for Real-time Updates

The repository scanning uses SSE streaming at `endpoints.py:359-415`:

```python
@router.get("/repositories/{repo_id}/stream-status")
async def stream_repository_status(repo_id: int, mode: str = "clone"):
    async def event_generator():
        for progress, message in steps:
            yield f"data: {json.dumps({'progress': progress, 'message': message})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Frontend consumption:** Uses `EventSource` API for live progress bars.

## Frontend Architecture

### Page Structure

```
frontend/src/app/
├── page.tsx                  # Dashboard (/)
├── projects/
│   ├── page.tsx             # Projects list
│   ├── add/page.tsx         # Create project
│   └── [id]/page.tsx        # Project detail (tabs: Repositories, Backlog, Board, Roadmap, Insights)
├── repositories/
│   ├── page.tsx             # Repositories list
│   ├── add/page.tsx         # Add repository
│   ├── cloning/page.tsx     # Clone progress
│   └── [id]/page.tsx        # Repository detail (13 tabs)
└── settings/page.tsx        # Global settings
```

### Component Organization

**Shared Components (`src/components/`):**
- `layout/sidebar.tsx` - Main navigation sidebar
- `ui/` - Shadcn UI primitives (button, dialog, select, etc.)
- `CreateTaskDialog.tsx` - Task creation modal
- `CreateMilestoneDialog.tsx` - Milestone creation modal
- `DragDropBoard.tsx` - Kanban board with drag-and-drop
- `DragDropRoadmap.tsx` - Gantt timeline with drag-and-drop
- `ManageRepositoriesDialog.tsx` - Multi-select repository linking

### Drag-and-Drop Patterns

Both Board and Roadmap use `@dnd-kit` for drag-and-drop:

**Board (Kanban):**
- Drag tasks between columns (To Do, In Progress, Done)
- Updates task status via `PUT /api/v1/projects/{id}/tasks/{task_id}/status`

**Roadmap (Gantt):**
- Drag milestones to change dates
- Updates milestone dates via `PUT /api/v1/projects/{id}/milestones/{label}/date`

## Key Development Patterns

### Adding a New Project Tab

1. **Backend:** Add data field to `Project` model in `endpoints.py`
2. **Backend:** Create endpoint to return data (if needed)
3. **Frontend:** Add tab to `projects/[id]/page.tsx` tab array
4. **Frontend:** Create tab content component
5. **Data:** Manually add field to `projects.json` or generate via API

### Adding a New Repository Analysis Feature

1. **Backend:** Add field to `Repository` model in `endpoints.py`
2. **Backend:** Create endpoint to populate data (e.g., `/analyze` action)
3. **Frontend:** Add tab to `repositories/[id]/page.tsx`
4. **Frontend:** Create visualization component (chart, graph, table)
5. **Data:** Add sample data to `repositories.json`

### ReactFlow Graph Pattern

Code Flows, Dependencies, and Feature Map use ReactFlow:

```typescript
import ReactFlow, { Node, Edge } from 'reactflow';

// Load from backend JSON
const { nodes, edges } = repositoryData.dependency_graph;

// Render graph
<ReactFlow nodes={nodes} edges={edges} />
```

**Node structure:**
```json
{
  "id": "node-1",
  "type": "default",
  "data": { "label": "Component Name" },
  "position": { "x": 100, "y": 200 }
}
```

**Edge structure:**
```json
{
  "id": "edge-1",
  "source": "node-1",
  "target": "node-2"
}
```

## Important Notes

### Repository Status Flow
1. **Created** → User adds repository via `/repositories/add`
2. **Cloning** → SSE stream shows progress at `/repositories/cloning?id={id}&mode=clone`
3. **Cloned** → Clone complete, scan starts automatically
4. **Scanning** → SSE stream continues with `mode=scan`
5. **Completed** → All analysis data populated in `repositories.json`

### Task Status Values
- `"Todo"` - Not started
- `"In Progress"` - Currently working
- `"Done"` - Completed

(Note: API uses exact casing as shown)

### Milestone Date Fields
- `date` - Start date (YYYY-MM-DD format)
- `end_date` - End date for Gantt bar length

### Settings Storage
Global settings stored in `backend/settings.json`:
- Menu visibility toggles
- Application preferences

Per-user settings (menu visibility) also stored in browser `localStorage`.

## Common Troubleshooting

### Backend Not Starting
- **Check port 8000:** Another process may be using it
- **Virtual environment:** Ensure `.venv` is activated
- **Python version:** Requires Python 3.12+

### Frontend API Errors
- **CORS issues:** Backend already has `allow_origins=["*"]` configured
- **Wrong API URL:** Check fetch URLs use `http://localhost:8000/api/v1/`
- **Backend not running:** Start backend first

### JSON File Corruption
- **Syntax errors:** Validate JSON with `python -m json.tool backend/projects.json`
- **Missing fields:** Compare with working examples in repository
- **Backup:** Git history maintains previous versions

### Drag-and-Drop Not Working
- **Check API response:** Ensure status update endpoints return success
- **Console errors:** Look for React state update warnings
- **Re-fetch data:** Component should refetch after drag operation

## Tech Stack Summary

**Backend:**
- FastAPI 0.118.0+
- Pydantic 2.11.10+ (data validation)
- Uvicorn 0.37.0+ (ASGI server)
- Python 3.12+

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Shadcn UI (Radix UI primitives)
- ReactFlow 11 (graph visualizations)
- Recharts 3.6 (charts)
- @dnd-kit (drag-and-drop)

**Development:**
- Ruff (Python linting/formatting)
- ESLint (TypeScript linting)
- Biome (optional TypeScript formatter)

## Deployment Notes

This is a **development/local application** designed for analyzing source code repositories. Not currently designed for production deployment.

**Current limitations:**
- JSON file storage (not production-grade)
- No authentication/authorization
- Single-user design
- No data persistence layer beyond JSON files

The `9_Agent_SaaS/` directory contains a separate, production-ready AI agent application with proper database integration (see `9_Agent_SaaS/CLAUDE.md`).
