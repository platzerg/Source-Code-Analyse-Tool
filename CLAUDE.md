# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **full-stack source code analysis and project management tool** built with FastAPI and Next.js. The application provides AI-driven insights into codebases, manages project workflows with Kanban boards and Gantt roadmaps, and tracks repositories with real-time scanning progress.

### Core Architecture

**Backend (FastAPI):**
- **Layered Architecture:**
  - **Routes Layer** (`app/api/`): API endpoints with request/response handling
  - **Service Layer** (`app/services/`): Business logic orchestration (project_service, repo_service, github_service)
  - **Repository Layer** (`app/db/repositories.py`): Data access abstraction with Supabase integration
  - **Storage Layer** (`app/db/storage.py`): Thread-safe JSON operations with atomic writes and automatic backups
  - **Models Layer** (`app/models/schemas.py`): Pydantic data validation
- **Dual Persistence:** JSON files for local data + Supabase for production/auth
- **Server-sent events (SSE):** Real-time repository clone/scan status streaming
- **Observability:** Optional Langfuse integration for API tracing

**RAG Pipeline (Separate Service):**
- **Independent Python service** (`backend_rag_pipeline/`) for repository analysis
- **Git Integration:** Shallow cloning with delta updates via `common/git_cloner.py`
- **Vector Storage:** Supabase pgvector for semantic code search
- **Document Processing:** Code parsing and chunking via `common/code_parser.py`
- **Two Modes:** Git repositories OR Google Drive/Local files
- **Continuous polling:** Watches for new repositories to process

**Frontend (Next.js 15):**
- React 19 with Tailwind CSS and Shadcn UI components
- Dynamic routing: `/projects/[id]`, `/repositories/[id]`
- **Authentication:** Supabase Auth with AuthGuard wrapper
- Real-time data fetching from backend API
- Drag-and-drop interfaces using @dnd-kit
- i18n support via react-i18next

**Key Feature:** The application is **100% dynamized** - all UI data comes from the backend. No hardcoded data except empty states and loading animations.

## Development Commands

### Environment Setup (Required First)

**Backend Environment** (`backend/.env`):
```bash
# Required: Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Optional: Langfuse Observability
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

**RAG Pipeline Environment** (`backend_rag_pipeline/.env`):
```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key

# RAG Configuration
ENVIRONMENT=production
RAG_PIPELINE_TYPE=local  # or 'git'
RUN_MODE=continuous      # or 'single'
RAG_POLL_INTERVAL=60

# Optional: Langfuse
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
```

### Backend Setup & Running

**Linux/Mac:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start backend server (port 8000)
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Windows (PowerShell):**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Start backend server (port 8000)
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Health check:** http://127.0.0.1:8000/api/v1/health
**API documentation:** http://127.0.0.1:8000/docs

### Frontend Setup & Running
```bash
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

### Testing

**Backend Tests** (pytest):
```bash
cd backend
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows

# Run all tests with verbose output
python -m pytest tests -v

# Run specific test file
python -m pytest tests/db/test_project_repository.py -v

# Run with coverage
python -m pytest tests --cov=app --cov-report=term-missing
```

**Test Structure:**
- `tests/db/` - Repository layer unit tests (ProjectRepository, RepositoryRepository)
- `tests/api/` - API endpoint tests (projects, repositories)
- `tests/integration/` - End-to-end integration tests
- `tests/conftest.py` - Shared pytest fixtures with automatic cleanup

### Linting & Formatting

**Backend (Ruff):**
```bash
cd backend
# Check for issues
ruff check app/

# Auto-format code
ruff format app/
```

Configuration in `backend/pyproject.toml`:
- Line length: 120 characters
- Target: Python 3.12+
- Auto-fix enabled

**Frontend (ESLint):**
```bash
cd frontend
npm run lint
```

### Docker Deployment

**Start all services** (backend, frontend, RAG pipeline):
```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f rag-pipeline

# Stop all services
docker compose down
```

**Access Points:**
- Frontend: http://localhost:3509
- Backend API: http://localhost:8359
- API Docs: http://localhost:8359/docs

**Health Checks:**
- Backend: `curl http://localhost:8359/api/v1/health`
- Frontend: `curl http://localhost:3509/`

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
1. Update Pydantic models in `backend/app/models/schemas.py`
2. Update service layer if business logic changes (`app/services/`)
3. Update repository layer if data access changes (`app/db/repositories.py`)
4. Modify JSON files directly or via API endpoints
5. Frontend automatically reflects changes (no TypeScript type updates needed)

## Backend Layered Architecture

The backend follows a **clean architecture pattern** with clear separation of concerns:

### Layer 1: Routes (`app/api/`)
- **`endpoints.py`** - Core API endpoints (projects, repositories, settings)
- **`auth.py`** - Authentication endpoints (login, signup, session management)
- **Responsibilities:** Request validation, response formatting, HTTP concerns
- **Pattern:** Use Pydantic models for request/response, delegate to service layer

### Layer 2: Services (`app/services/`)
- **`project_service.py`** - Project business logic, task/milestone management
- **`repo_service.py`** - Repository operations, analysis coordination
- **`github_service.py`** - External GitHub API integration with retry logic
- **Responsibilities:** Business logic, orchestration, external API calls
- **Pattern:** Accept domain objects, call repositories for data, return domain objects

### Layer 3: Repositories (`app/db/`)
- **`repositories.py`** - Data access layer (ProjectRepository, RepositoryRepository)
- **`supabase_client.py`** - Supabase client initialization
- **Responsibilities:** CRUD operations, data mapping, Supabase queries
- **Pattern:** Abstract data source (Supabase/JSON), return domain models

### Layer 4: Storage (`app/db/`)
- **`storage.py`** - Low-level JSON file operations
- **Responsibilities:** Thread-safe file I/O, atomic writes, backup management
- **Key Features:**
  - **Thread-safe:** Uses locks per file path to prevent race conditions
  - **Atomic writes:** Writes to `.tmp` file, then renames (prevents corruption)
  - **Auto-backup:** Creates `.bak` file before overwriting
  - **Error recovery:** Falls back to backup if main file is corrupted

### Layer 5: Models (`app/models/`)
- **`schemas.py`** - Pydantic models for data validation
- **Domain objects:** Project, Repository, Task, Milestone, etc.
- **Responsibilities:** Data validation, serialization, type safety

### Architecture Benefits:
- **Testability:** Each layer can be tested independently (see `tests/` structure)
- **Flexibility:** Swap JSON storage for database without changing services
- **Maintainability:** Clear boundaries make code easier to understand and modify
- **Type Safety:** Pydantic models throughout ensure data integrity

### Request Flow Example:
```
1. POST /api/v1/projects → endpoints.py:create_project()
2. → project_service.create_project(data)
3. → project_repo.create(project_obj)
4. → supabase_client.insert() OR storage.save_json()
5. ← Returns Project model
6. ← FastAPI serializes to JSON
7. ← 201 Created response
```

## RAG Pipeline Architecture

The RAG (Retrieval-Augmented Generation) pipeline is a **separate microservice** that handles repository analysis and semantic code search.

### Key Components

**Entry Point:** `backend_rag_pipeline/docker_entrypoint.py`
- Orchestrates the entire RAG workflow
- Supports two modes: `continuous` (polling) or `single` (one-time run)

**Core Modules:**
- **`common/git_cloner.py`** - Shallow clones repositories with delta updates
- **`common/code_parser.py`** - Parses source code files into chunks
- **`common/text_processor.py`** - Chunks and processes documents
- **`common/db_handler.py`** - Manages Supabase vector storage operations
- **`common/state_manager.py`** - Tracks processing state and prevents duplicates
- **`common/observability.py`** - Langfuse integration for tracing

**Data Flow:**
1. **Monitor** - Polls Supabase for new repositories to process
2. **Clone** - Shallow clone via `git_cloner.py` into `repos/` directory
3. **Parse** - Extract code files and metadata via `code_parser.py`
4. **Chunk** - Split documents into semantic chunks via `text_processor.py`
5. **Embed** - Generate embeddings using configured embedding model
6. **Store** - Insert vectors into Supabase pgvector via `db_handler.py`
7. **Update State** - Mark repository as processed in state manager

**Supported Modes:**
- **Git Mode** (`RAG_PIPELINE_TYPE=git`): Processes Git repositories
- **Local Mode** (`RAG_PIPELINE_TYPE=local`): Watches local file directories
- **Google Drive Mode**: Syncs and processes Google Drive folders

**Integration with Main Backend:**
- Backend creates repository records in Supabase
- RAG pipeline detects new records via polling
- Pipeline updates status fields as processing progresses
- Frontend queries vector embeddings for "Ask Questions" feature

**Key Configuration:**
- `RAG_POLL_INTERVAL` - How often to check for new repositories (default: 60s)
- `RUN_MODE` - `continuous` for daemon mode, `single` for one-time processing
- `ENVIRONMENT` - `production` or `development`

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
- **FastAPI** 0.128.0+ (Python 3.12+)
- **Pydantic** 2.12.5+ (data validation)
- **Uvicorn** 0.40.0+ (ASGI server)
- **Supabase** 2.27.0+ (auth + pgvector database)
- **Langfuse** 4.16.0+ (observability/tracing)
- **httpx** 0.28.1+ (async HTTP client with retry logic)
- **pytest** 8.3.5+ (testing framework)

**RAG Pipeline:**
- **Python** 3.12+
- **Supabase** (vector storage with pgvector)
- **Git** (shallow cloning for repositories)
- **Langfuse** (optional tracing)
- Embedding models via OpenAI/custom API

**Frontend:**
- **Next.js** 15.1.0 (App Router)
- **React** 19.0.0
- **TypeScript** 5
- **Tailwind CSS** 4.0.6
- **Shadcn UI** (Radix UI primitives)
- **ReactFlow** 11.11.4 (graph visualizations)
- **Recharts** 3.6.0 (charts)
- **@dnd-kit** 6.3.1 (drag-and-drop)
- **react-i18next** 25.7.3 (internationalization)
- **React Hook Form** 7.54.2 + **Zod** 3.24.2 (form validation)
- **Supabase JS** (auth client)

**Development:**
- **Ruff** (Python linting/formatting, 120 char line length)
- **ESLint** (TypeScript linting)
- **pytest** (backend testing with fixtures and coverage)
- **Docker Compose** (container orchestration)

## Deployment Notes

The application supports both **local development** and **production deployment**.

**Production Deployment:**
- **Docker Compose** orchestration for all services (backend, frontend, RAG pipeline)
- **Supabase** integration for authentication and vector storage
- **Dual persistence:** JSON for local/cache + Supabase for production data
- **Observability:** Langfuse tracing for monitoring API performance
- **Health checks** built into Docker containers

**Deployment Options:**
1. **Docker Compose** (recommended) - Ports: frontend:3509, backend:8359
2. **DigitalOcean/Render** - Managed Docker deployment
3. **Google Cloud Run** - Serverless container deployment

**Production Checklist:**
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in backend/.env
- Configure RAG pipeline environment variables
- Optional: Set Langfuse credentials for observability
- Update CORS origins in `backend/app/main.py` (currently allows all `*`)
- Use volume mounts for persistent data directories

**Local Development:**
- Uses JSON files in `backend/data/` for quick iteration
- No Supabase required for basic functionality (auth will be disabled)
- Hot-reload enabled for both frontend and backend

**Note:** The `9_Agent_SaaS/` directory contains a separate, standalone AI agent SaaS application (see `9_Agent_SaaS/CLAUDE.md`).
