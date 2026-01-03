# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **full-stack source code analysis and project management tool** built with FastAPI, Next.js, and Supabase. The application provides AI-driven insights into codebases through RAG (Retrieval Augmented Generation), manages project workflows with Kanban boards and Gantt roadmaps, and enables semantic search and chat over repository code.

### Three-Tier Architecture

**Backend API (FastAPI):**
- Layered architecture: Routes → Services → Repository pattern
- Supabase for data persistence (PostgreSQL with pgvector)
- Pydantic models for validation (`app/models/schemas.py`)
- Optional Langfuse integration for observability/tracing
- Authentication via Supabase Auth

**RAG Pipeline Service (Python):**
- Independent worker service for repository analysis
- Clones Git repositories, parses source code files
- Generates embeddings and stores vectors in Supabase
- Supports Google Drive integration for document sync
- Modular architecture: `common/`, `Local_Files/`, `Google_Drive/`

**Frontend (Next.js 15):**
- React 19 with Tailwind CSS and Shadcn UI
- Supabase client for authentication
- Dynamic routing: `/projects/[id]`, `/repositories/[id]`
- Drag-and-drop interfaces using @dnd-kit
- Real-time data fetching from backend API

## Development Commands

### Backend Setup & Running (Local)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # PowerShell
# On Unix: source .venv/bin/activate
pip install -r requirements.txt

# Configure environment (see backend/.env.example)
# Required: SUPABASE_URL, SUPABASE_SERVICE_KEY
# Optional: LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST

# Start backend server (port 8000)
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Health check:** http://127.0.0.1:8000/api/v1/health
**API documentation:** http://127.0.0.1:8000/docs

### Frontend Setup & Running (Local)
```powershell
cd frontend
npm install

# Configure environment variables
# NEXT_PUBLIC_API_URL - Backend API URL (defaults to http://localhost:8359)
# NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anonymous key

# Development server (port 3000)
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint
```

**Application:** http://localhost:3000

### RAG Pipeline Setup & Running (Local)
```powershell
cd backend_rag_pipeline
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Configure environment (see .env.example)
# Required: SUPABASE_URL, SUPABASE_SERVICE_KEY, EMBEDDING_API_KEY
# Optional: LANGFUSE_*, GOOGLE_DRIVE_CREDENTIALS_JSON

# Run Git repository monitor
python docker_entrypoint.py --pipeline git --mode continuous

# Run local file monitor
python docker_entrypoint.py --pipeline local --mode continuous --directory ./data

# Run Google Drive sync
python docker_entrypoint.py --pipeline google_drive --mode continuous
```

### Docker Deployment (Recommended)
```powershell
# Start all services (backend, frontend, rag-pipeline)
docker compose up -d

# View logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f rag-pipeline

# Stop services
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

**Ports:**
- Frontend: http://localhost:3509
- Backend API: http://localhost:8359
- API Docs: http://localhost:8359/docs

### Testing
```powershell
cd backend

# Run all tests
.\.venv\Scripts\python.exe -m pytest tests -v

# Run specific test file
.\.venv\Scripts\python.exe -m pytest tests/db/test_project_repository.py -v

# Run with coverage
.\.venv\Scripts\python.exe -m pytest tests --cov=app --cov-report=term-missing
```

**Test structure:**
- `tests/db/` - Repository layer unit tests
- `tests/api/` - API endpoint integration tests
- `tests/integration/` - End-to-end workflow tests

## Backend Architecture

### Layered Design

The backend follows a strict layered architecture:

```
app/
├── main.py                    # FastAPI app initialization, CORS, router setup
├── api/
│   ├── endpoints.py          # API route handlers
│   └── auth.py               # Authentication endpoints
├── services/
│   ├── project_service.py    # Business logic for projects
│   ├── repo_service.py       # Business logic for repositories
│   └── github_service.py     # GitHub API integration
├── db/
│   ├── repositories.py       # Repository pattern (ProjectRepository, RepositoryRepository)
│   ├── supabase_client.py    # Supabase client initialization
│   └── storage.py            # Legacy JSON storage utilities
├── models/
│   └── schemas.py            # Pydantic models (Project, Repository, Task, etc.)
└── core/
    └── observability.py      # Langfuse configuration
```

### Repository Pattern

Data access is abstracted through repository classes:

**ProjectRepository** (`db/repositories.py:14-90`)
- `get_all()` - Fetch all projects
- `get_by_id(project_id)` - Fetch single project
- `create(project_data)` - Create new project
- `update(project_id, updates)` - Update project
- `delete(project_id)` - Delete project
- `link_repository(project_id, repo_id)` - Link repo to project
- `get_repositories(project_id)` - Get linked repositories

**RepositoryRepository** (`db/repositories.py:93-220`)
- Similar CRUD operations for repositories
- Includes methods for managing analysis status

### Key API Endpoints

**Authentication:**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/user` - Get current user

**Projects:**
- `GET /api/v1/projects` - List all projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/{id}` - Get project details
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

**Repositories:**
- `GET /api/v1/repositories` - List all repositories
- `POST /api/v1/repositories` - Add repository
- `GET /api/v1/repositories/{id}` - Get repository details
- `DELETE /api/v1/repositories/{id}` - Delete repository

**Health:**
- `GET /api/v1/health` - Health check endpoint

## Database Schema (Supabase)

The application uses PostgreSQL via Supabase with the following tables:

**Core Tables:**
- `projects` - Project metadata and configuration
- `repositories` - Repository information and analysis status
- `project_repositories` - Many-to-many relationship table
- `user_profiles` - User account information

**RAG Tables:**
- `documents` - Vectorized code chunks with embeddings (pgvector)
- `document_metadata` - Metadata about processed files
- `document_rows` - Individual document rows for tracking
- `rag_pipeline_state` - Pipeline execution state and history

**SQL Migration Files:** Located in `backend/sql/` directory

## RAG Pipeline Architecture

The RAG pipeline is a separate service that processes repositories for semantic search:

### Workflow
1. Monitor `repositories` table for new entries with `status='pending'`
2. Clone repository to local `repos/` directory
3. Parse source code files (Python, JavaScript, TypeScript, etc.)
4. Generate embeddings using OpenAI API or compatible provider
5. Store chunks and vectors in `documents` table
6. Update repository status to `completed` or `error`

### Key Modules
- `common/db_handler.py` - Database operations for RAG
- `common/text_processor.py` - Code parsing and chunking
- `common/state_manager.py` - Track processed files
- `repo_watcher.py` - Git repository monitoring
- `Local_Files/file_watcher.py` - Local directory monitoring
- `Google_Drive/drive_watcher.py` - Google Drive sync

### Configuration
- `RAG_PIPELINE_TYPE` - `git`, `local`, or `google_drive`
- `RUN_MODE` - `continuous` (daemon) or `single` (one-time)
- `RAG_POLL_INTERVAL` - Polling frequency in seconds (default: 60)

## Frontend Architecture

### Page Structure
```
frontend/src/app/
├── page.tsx                  # Dashboard (/)
├── login/page.tsx           # Login page
├── signup/page.tsx          # Registration page
├── dashboard/page.tsx       # Main dashboard
├── projects/
│   ├── page.tsx             # Projects list
│   └── [id]/page.tsx        # Project detail
├── repositories/
│   ├── page.tsx             # Repositories list
│   └── [id]/page.tsx        # Repository detail
└── settings/page.tsx        # Global settings
```

### Key Components
- `components/layout/sidebar.tsx` - Main navigation
- `components/auth/` - Authentication components
- `components/ui/` - Shadcn UI primitives
- `components/CreateTaskDialog.tsx` - Task creation modal
- `components/CreateMilestoneDialog.tsx` - Milestone modal
- `components/DragDropBoard.tsx` - Kanban board
- `components/DragDropRoadmap.tsx` - Gantt timeline

### Configuration
**API Base URL:** Configured in `src/lib/config.ts`
- Client-side: Uses `NEXT_PUBLIC_API_URL` (default: `http://localhost:8359`)
- Server-side: Uses `INTERNAL_API_URL` (default: `http://backend:8000/api/v1`)

**Supabase Client:** Configured in `src/lib/supabase.ts`
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Environment Variables

### Backend (`backend/.env`)
```env
# Required - Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# Optional - Langfuse Observability
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

### RAG Pipeline (`backend_rag_pipeline/.env`)
```env
# Required - Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# Required - AI Embeddings
EMBEDDING_API_KEY=sk-...
EMBEDDING_MODEL_CHOICE=text-embedding-3-small

# Pipeline Configuration
RAG_PIPELINE_TYPE=git
RUN_MODE=continuous
RAG_POLL_INTERVAL=60

# Optional - Google Drive
GOOGLE_DRIVE_CREDENTIALS_JSON={"type": "service_account", ...}
RAG_WATCH_FOLDER_ID=folder_id
```

### Frontend (Environment Variables)
```env
NEXT_PUBLIC_API_URL=http://localhost:8359
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Common Development Tasks

### Adding a New Pydantic Model
1. Add model class to `backend/app/models/schemas.py`
2. Use in service layer for validation
3. Return from API endpoints - FastAPI auto-serializes

### Adding a New API Endpoint
1. Define route in `backend/app/api/endpoints.py` or `auth.py`
2. Add business logic to appropriate service in `app/services/`
3. Use repository layer for database access
4. Add tests in `tests/api/`

### Adding a New Database Table
1. Create SQL migration in `backend/sql/`
2. Run migration via Supabase dashboard or CLI
3. Add repository methods in `app/db/repositories.py`
4. Create Pydantic models in `app/models/schemas.py`

### Debugging RAG Pipeline
```powershell
# View RAG pipeline logs
docker compose logs -f rag-pipeline

# Clear all vectorized data (DESTRUCTIVE)
docker compose exec rag-pipeline python clear_db.py

# Or locally:
cd backend_rag_pipeline
python clear_db.py
```

## Observability

The application supports **optional** Langfuse integration for tracing and monitoring:

- Configured in `backend/app/core/observability.py`
- Automatically disabled if credentials not provided
- Traces API requests, LLM calls, and pipeline operations
- Access dashboard at https://cloud.langfuse.com

**No Langfuse credentials?** The application works perfectly without them.

## Tech Stack

**Backend:**
- FastAPI 0.128.0+ (Python 3.12+)
- Supabase client 2.27.0+
- Pydantic 2.12+ for validation
- Uvicorn 0.40.0+ for ASGI server
- Logfire 4.16.0+ for observability

**RAG Pipeline:**
- Python 3.11+
- OpenAI embeddings (or compatible)
- Supabase pgvector for vector storage

**Frontend:**
- Next.js 15 (React 19, TypeScript 5)
- Tailwind CSS 4
- Shadcn UI (Radix UI primitives)
- @supabase/supabase-js 2.89.0+
- ReactFlow 11 (graph visualizations)
- @dnd-kit (drag-and-drop)

## Important Notes

### Docker Compose Ports
- **Production ports** (Docker): Frontend 3509, Backend 8359
- **Development ports** (local): Frontend 3000, Backend 8000
- Frontend `config.ts` defaults to port 8359 for Docker compatibility

### Authentication Flow
1. User signs up/logs in via Supabase Auth UI
2. Frontend receives session from Supabase client
3. Session token sent in requests to backend API
4. Backend validates token via Supabase Auth

### RAG Pipeline Triggers
- Automatically monitors `repositories` table
- Triggered when new repository added with `status='pending'`
- Updates status to `cloning` → `analyzing` → `completed`

### Testing Database
Tests use a test Supabase instance or mock data - configure in `tests/conftest.py`
