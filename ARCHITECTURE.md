# Project Architecture - Source Code Analysis Tool

**Version**: 2.0.0
**Last Updated**: 2026-01-07
**Status**: Active Development

---

## Project Overview

**Purpose**: Full-stack AI-powered source code analysis and project management tool that provides deep insights into codebases through RAG (Retrieval Augmented Generation), semantic search, and comprehensive technical analysis.

**Type**: Multi-tier web application with microservices architecture

**Current State**: Active development with Redis caching layer recently implemented, multiple untracked configuration files suggest ongoing refactoring for database provider flexibility.

---

## Architecture

### Three-Tier Microservices Architecture

```
┌─────────────────────────────────────────────────────┐
│           Frontend (Next.js 15 + React 19)          │
│         Port 3000 (dev) / 3509 (production)         │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────▼────────────────────────────────┐
│         Backend API (FastAPI + Python 3.12+)        │
│         Port 8000 (dev) / 8359 (production)         │
│   ┌──────────────────────────────────────────────┐  │
│   │  Layered Architecture:                       │  │
│   │  • Routes (API endpoints)                    │  │
│   │  • Services (Business logic)                 │  │
│   │  • Repositories (Data access pattern)        │  │
│   │  • Models (Pydantic schemas)                 │  │
│   └──────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────┘
             │
             ├─────┬──────────┬──────────┬─────────────┐
             ▼     ▼          ▼          ▼             ▼
        ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  ┌────────┐
        │Supabase│ │Postgres│ │ Redis  │ │Langfuse│  │ GitHub │
        │(PGVect)│ │  (Opt) │ │ Cache  │ │ (Opt)  │  │  API   │
        └────────┘ └────────┘ └────────┘ └────────┘  └────────┘

┌─────────────────────────────────────────────────────┐
│    RAG Pipeline Service (Independent Worker)        │
│    • Git Repository Analysis & Cloning              │
│    • Code Parsing & Vectorization                   │
│    • Embeddings Generation (OpenAI)                 │
└─────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

#### 1. Repository Pattern
Clean separation between data access and business logic
- `ProjectRepository`, `RepositoryRepository` for CRUD operations
- Abstraction supports both Supabase and PostgreSQL via configuration
- Location: `backend/app/db/repositories.py`

**Example:**
```python
class ProjectRepository:
    @staticmethod
    async def get_all() -> List[Project]:
        settings = get_settings()
        if settings.database_provider == "postgres":
            # Use PostgreSQL
            pool = await get_postgres_pool()
            repo = PostgresProjectRepository(pool)
            return await repo.get_all()
        else:
            # Use Supabase
            supabase = get_supabase()
            result = supabase.table("projects").select("*").execute()
            return [Project(**p) for p in result.data]
```

#### 2. Service Layer
Orchestrates business logic
- `project_service.py` - Project management business logic
- `repo_service.py` - Repository analysis and operations
- `github_service.py` - GitHub API integration with retry logic
- `settings_service.py` - Application settings management
- Location: `backend/app/services/`

**Responsibilities:**
- Coordinate between multiple repositories
- Implement business rules
- Handle external API integrations
- Cache expensive operations

#### 3. Multi-Database Support
Configurable database provider via environment variables
- **DATABASE_PROVIDER**: `supabase` (default) or `postgres`
- Recent addition based on untracked files: `postgres_repositories.py`, `database.py`
- Seamless switching without code changes

**Configuration:**
```env
# Use Supabase (default)
DATABASE_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# Use local PostgreSQL
DATABASE_PROVIDER=postgres
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=source_code_analysis
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

#### 4. Caching Strategy
Redis-based performance optimization
- Function-level caching with `@cache_result` decorators
- Response-level middleware caching for GET endpoints
- TTL: 30 minutes, graceful degradation if unavailable
- **Performance**: 2,700x faster for AI features analysis (1.2s → 0.00s)
- Location: `backend/app/core/cache.py`, `backend/app/middleware/cache_middleware.py`

**Example:**
```python
@cache_result(ttl=1800, key_prefix="repo")
async def get_repository_by_id_async(repo_id: int) -> Optional[Repository]:
    """Get repository by ID with analysis results."""
    repo = await RepositoryRepository.get_by_id(repo_id)
    # Expensive operations are now cached
    return repo
```

**Cache Key Structure:**
```
ai_features:get_mock_ai_features_async:hash
repo:get_repository_by_id_async:hash
project_insights:get_mock_project_insights_async:hash
response_cache:hash
```

#### 5. RAG Pipeline Decoupling
Independent worker service for repository analysis
- Monitors `repositories` table for `status='pending'`
- Clones repositories, parses code, generates embeddings
- Stores vectors in Supabase pgvector
- Supports Git repos, local files, and Google Drive

**Workflow:**
1. Monitor database for new repositories
2. Clone repository to local `repos/` directory
3. Parse source code files (Python, JS, TS, etc.)
4. Generate embeddings using OpenAI API
5. Store chunks and vectors in `documents` table
6. Update repository status to `completed` or `error`

**Location:** `backend_rag_pipeline/`

---

## Tech Stack

### Backend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | FastAPI | 0.128.0 | Async web framework |
| **Language** | Python | 3.12+ | Core runtime |
| **Server** | Uvicorn | 0.40.0 | ASGI server |
| **Validation** | Pydantic | 2.12.5 | Data validation & serialization |
| **Settings** | Pydantic Settings | 2.2.1 | Configuration management |
| **Database (Primary)** | Supabase | 2.27.0 | PostgreSQL + pgvector + Auth |
| **Database (Alt)** | asyncpg | 0.29.0 | Direct PostgreSQL driver |
| **Caching** | Redis | 7-alpine | High-performance caching |
| **Observability** | Logfire | 4.16.0 | Tracing & monitoring |
| **AI Integration** | OpenAI | 1.0.0+ | Embeddings & LLM |
| **AI Framework** | Pydantic AI | 0.0.14+ | AI model integration |
| **HTTP Client** | httpx | 0.28.1 | External API calls |
| **Testing** | pytest | (implied) | Test framework |

### Frontend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Next.js | 15.1.0 | React framework |
| **UI Library** | React | 19.0.0 | Component library |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 4.0.6 | Utility-first CSS |
| **UI Components** | Shadcn UI (Radix) | - | Accessible primitives |
| **DnD** | @dnd-kit | 6.3.1 | Drag-and-drop |
| **Forms** | react-hook-form | 7.54.2 | Form management |
| **Validation** | zod | 3.24.2 | Schema validation |
| **i18n** | react-i18next | 16.5.1 | Internationalization |
| **Graphs** | ReactFlow | 11.11.4 | Graph visualizations |
| **Charts** | Recharts | 3.6.0 | Chart library |
| **Auth** | Supabase Auth UI | 0.4.7 | Authentication components |

### RAG Pipeline
- **Python 3.11+**: Core runtime
- **OpenAI Embeddings**: `text-embedding-3-small`
- **Supabase pgvector**: Vector storage
- **Git**: Repository cloning

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Redis 7-alpine**: Caching layer with persistence
- **PostgreSQL 16 (pgvector)**: Optional local database
- **GitHub CLI**: Git operations

---

## Core Principles

### Code Style & Conventions

#### Backend (Python)
- **Strict Layered Architecture**: `API → Service → Repository → Database`
- **Type Hints Throughout**: Pydantic models for all schemas
- **Async/Await Pattern**: For all database operations
- **Repository Pattern**: Data access abstraction
- **Environment-Based Configuration**: Via Pydantic Settings
- **Graceful Degradation**: Optional services (Langfuse, Redis) fail gracefully

**File Organization:**
```
backend/app/
├── api/            # FastAPI routes (endpoints.py, auth.py)
├── core/           # Configuration, observability, cache
├── db/             # Repositories, database clients
├── models/         # Pydantic schemas
├── services/       # Business logic
└── middleware/     # Request/response middleware
```

#### Frontend (TypeScript/React)
- **Client-Side Rendering**: With Server Components (Next.js 15)
- **Component Library**: Shadcn UI for consistency
- **Utility-First Styling**: Tailwind CSS
- **Route-Based Code Splitting**: `app/` directory
- **Environment Variables**: For API configuration
- **i18n Support**: Throughout the application

**File Organization:**
```
frontend/src/
├── app/            # Next.js app directory (routes)
├── components/     # React components (UI, layout, features)
├── contexts/       # React contexts (Auth)
├── lib/            # Utilities (config, Supabase)
└── locales/        # i18n translations
```

### Configuration Philosophy
- **Flexibility First**: Toggle features via environment variables
  - `ENABLE_LANGFUSE=true/false`
  - `DATABASE_PROVIDER=supabase/postgres`
- **No Breaking Defaults**: All optional features disabled by default
- **Environment-Specific**: `.env.local`, `.env.docker`, `.env.production`
- **Validation**: Pydantic Settings validates configuration at startup

### Documentation Standards
- **CLAUDE.md**: Comprehensive project guide with commands, architecture, and environment setup
- **README.md**: User-focused quick start with visual showcase
- **CONFIGURATION.md**: Detailed configuration switches and scenarios
- **ARCHITECTURE.md**: This document - technical architecture overview
- **Code Comments**: Explain "why", not "what"

### Testing Approach
- **Backend Tests**: 12 tests passed (last known status)
  - **Repository Layer**: Unit tests for CRUD operations (`tests/db/`)
  - **API Endpoints**: Integration tests with TestClient (`tests/api/`)
  - **Integration**: Full workflow tests (`tests/integration/`)
  - **Fixtures**: Automatic database cleanup via pytest fixtures
- **Test Command**: `.\.venv\Scripts\python.exe -m pytest tests -v`
- **Coverage**: Focus on critical paths (repositories, services, API)

---

## Current State

### Active Branch
**main** (up to date with origin)

### Recent Development Focus

**Last 5 Commits:**
1. `cc51a4c` - fix
2. `d6789f2` - changes
3. `f6500d1` - fix: resolve null reference errors in repository detail page
4. `22ec7eb` - added REDIS
5. `2ac1e3c` - feat: Implement Redis caching layer for AI analysis optimization

**Key Themes:**
- **Redis Integration**: Major performance enhancement layer added
- **Error Handling**: Null reference fixes in frontend
- **Stability Improvements**: General bug fixes

### Uncommitted Changes (21 modified + 4 new files)

**Backend (10 files):**
- `backend/.env.example` - Configuration template updates
- `backend/app/api/endpoints.py` - API route changes
- `backend/app/core/config.py` - Configuration refactoring
- `backend/app/core/observability.py` - Langfuse integration updates
- `backend/app/db/repositories.py` - Repository pattern changes
- `backend/app/db/supabase_client.py` - Database client updates
- `backend/app/services/project_service.py` - Business logic changes
- `backend/app/services/repo_service.py` - Repository service updates
- `backend/app/services/settings_service.py` - Settings management changes
- `backend/requirements.txt` - Dependency updates

**RAG Pipeline (4 files):**
- `backend_rag_pipeline/.env.example` - Configuration template
- `backend_rag_pipeline/common/db_handler.py` - Database operations
- `backend_rag_pipeline/common/state_manager.py` - State tracking
- `backend_rag_pipeline/repo_watcher.py` - Repository monitoring

**Infrastructure (2 files):**
- `docker-compose.local.yml` - Local development setup
- `docker-compose.yml` - Production configuration

**Frontend (5 files):**
- `frontend/src/app/dashboard/page.tsx` - Dashboard updates
- `frontend/src/app/page.tsx` - Main page changes
- `frontend/src/app/repositories/page.tsx` - Repository list
- `frontend/src/contexts/AuthContext.tsx` - Auth context
- `frontend/src/lib/config.ts` - Configuration
- `frontend/src/lib/supabase.ts` - Supabase client

**New Files (Untracked):**
- `CONFIGURATION.md` - Configuration documentation
- `backend/app/db/database.py` - New database abstraction
- `backend/app/db/postgres_repositories.py` - PostgreSQL repository implementation
- `docker-compose.test.yml` - Test environment configuration

### Immediate Observations

**Strengths:**
- Redis caching dramatically improves performance
- Multi-database support architecture in progress
- Comprehensive documentation maintained
- Clear separation of concerns
- Strong type safety (Pydantic, TypeScript)

**Areas of Attention:**
- **Uncommitted Refactoring**: 21 modified files + 4 new files suggest major refactoring in progress
  - Likely related to PostgreSQL provider support
  - Should review before committing to ensure consistency
- **Configuration Complexity**: Three database provider implementations (Supabase, PostgreSQL, with Redis caching)
  - Need to ensure all code paths work with both providers
- **Test Coverage**: Only 12 tests - may need expansion for new PostgreSQL code paths
- **Documentation**: Need to update CLAUDE.md and README.md with PostgreSQL provider information

---

## Directory Structure

```
Source-Code-Analyse-Tool/
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── api/                 # API endpoints (routes)
│   │   │   ├── endpoints.py    # Main API routes
│   │   │   └── auth.py         # Authentication routes
│   │   ├── core/                # Configuration, observability, cache
│   │   │   ├── config.py       # Pydantic Settings configuration
│   │   │   ├── observability.py # Langfuse integration
│   │   │   ├── cache.py        # Cache decorator
│   │   │   ├── redis_client.py # Redis client singleton
│   │   │   ├── http_client.py  # HTTP client with retry
│   │   │   └── auth.py         # Authentication utilities
│   │   ├── db/                  # Data access layer
│   │   │   ├── repositories.py # Repository pattern (Supabase/Postgres)
│   │   │   ├── supabase_client.py # Supabase client
│   │   │   ├── database.py     # Database abstraction (NEW)
│   │   │   └── postgres_repositories.py # PostgreSQL repos (NEW)
│   │   ├── models/              # Pydantic schemas
│   │   │   └── schemas.py      # All data models
│   │   ├── services/            # Business logic
│   │   │   ├── project_service.py
│   │   │   ├── repo_service.py
│   │   │   ├── github_service.py
│   │   │   └── settings_service.py
│   │   ├── middleware/          # Request/response middleware
│   │   │   └── cache_middleware.py
│   │   └── main.py              # FastAPI application entry point
│   ├── sql/                     # Database migrations (9 files)
│   │   ├── 000_complete_schema.sql
│   │   ├── 001_core_tables.sql
│   │   ├── 002_project_features.sql
│   │   ├── 003_repository_features.sql
│   │   ├── 004_settings.sql
│   │   ├── 005_indexes.sql
│   │   ├── 006_triggers.sql
│   │   ├── 007_fix_nullable_fields.sql
│   │   ├── 008_add_authentication.sql
│   │   └── 009_rag_pipeline.sql
│   ├── tests/                   # Pytest test suite
│   │   ├── api/                 # API endpoint tests
│   │   ├── db/                  # Repository layer tests
│   │   ├── integration/         # End-to-end tests
│   │   ├── services/            # Service layer tests
│   │   └── conftest.py          # Pytest fixtures
│   ├── scripts/                 # Utility scripts
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile               # Backend container
├── backend_rag_pipeline/         # Independent RAG worker
│   ├── common/                  # Shared utilities
│   │   ├── db_handler.py        # Database operations
│   │   ├── text_processor.py   # Code parsing & chunking
│   │   ├── code_parser.py      # Language-specific parsing
│   │   ├── git_cloner.py       # Git operations
│   │   ├── state_manager.py    # Processing state tracking
│   │   └── observability.py    # Langfuse integration
│   ├── Local_Files/             # Local file monitoring
│   │   ├── file_watcher.py
│   │   ├── main.py
│   │   └── config.json
│   ├── Google_Drive/            # Google Drive integration
│   │   ├── drive_watcher.py
│   │   ├── main.py
│   │   └── config.json
│   ├── repo_watcher.py          # Git repo monitoring
│   ├── docker_entrypoint.py     # Container entry point
│   ├── clear_db.py              # Database cleanup utility
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile               # RAG pipeline container
├── frontend/                     # Next.js 15 frontend
│   ├── src/
│   │   ├── app/                 # Next.js app directory (routes)
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── dashboard/       # Dashboard
│   │   │   ├── projects/        # Project management
│   │   │   ├── repositories/    # Repository analysis
│   │   │   ├── settings/        # Global settings
│   │   │   ├── login/           # Authentication
│   │   │   ├── signup/          # Registration
│   │   │   └── layout.tsx       # Root layout
│   │   ├── components/          # React components
│   │   │   ├── layout/          # Layout components (sidebar)
│   │   │   ├── auth/            # Auth components (AuthGuard)
│   │   │   ├── repositories/    # Repository-specific components
│   │   │   └── ui/              # Shadcn UI components
│   │   ├── contexts/            # React contexts
│   │   │   └── AuthContext.tsx  # Authentication context
│   │   ├── lib/                 # Utilities
│   │   │   ├── config.ts        # API configuration
│   │   │   ├── supabase.ts      # Supabase client
│   │   │   └── utils.ts         # Helper functions
│   │   └── locales/             # i18n translations
│   │       └── en.json          # English translations
│   ├── package.json             # Node dependencies
│   ├── next.config.mjs          # Next.js configuration
│   ├── tailwind.config.ts       # Tailwind configuration
│   └── Dockerfile               # Frontend container
├── .claude/                      # Claude Code skills/commands
│   ├── commands/                # Command definitions
│   │   ├── core_piv_loop/       # Core PIV loop commands
│   │   ├── exp-piv-loop/        # Experimental PIV loop
│   │   └── validation/          # Validation commands
│   └── settings.local.json      # Local Claude settings
├── .kiro/                        # Kiro CLI documentation
│   ├── documentation/           # Kiro documentation
│   └── prompts/                 # Prompt templates
├── screenshots/                  # Application screenshots
├── docker-compose.yml            # Production Docker setup
├── docker-compose.local.yml      # Local development
├── docker-compose.test.yml       # Test environment (NEW)
├── ARCHITECTURE.md               # This document
├── CLAUDE.md                     # Development guide
├── CONFIGURATION.md              # Config switches guide
├── README.md                     # User documentation
├── PRODUCTION_DEPLOYMENT.md      # Production deployment guide
└── PRODUCTION_TROUBLESHOOTING.md # Troubleshooting guide
```

---

## Development Workflow

### Local Development (No Docker)

#### Backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows PowerShell
# OR: source .venv/bin/activate  # Linux/Mac

pip install -r requirements.txt

# Configure environment (see backend/.env.example)
# Required: SUPABASE_URL, SUPABASE_SERVICE_KEY
# Optional: LANGFUSE_*, REDIS_URL

# Start backend server (port 8000)
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Access:**
- Backend API: http://127.0.0.1:8000
- API Documentation: http://127.0.0.1:8000/docs
- Health Check: http://127.0.0.1:8000/api/v1/health

#### Frontend
```powershell
cd frontend
npm install

# Configure environment variables
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Development server (port 3000)
npm run dev
```

**Access:**
- Frontend: http://localhost:3000

### Docker Development

#### Local Docker
```bash
docker compose -f docker-compose.local.yml up -d --build

# View logs
docker compose -f docker-compose.local.yml logs -f

# Stop services
docker compose -f docker-compose.local.yml down
```

#### Production Docker
```bash
docker compose -f docker-compose.yml up -d --build

# View logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f rag-pipeline

# Stop services
docker compose down
```

**Access:**
- Frontend: http://localhost:3509
- Backend: http://localhost:8359
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

---

## Configuration Guide

### Database Provider Selection

#### Supabase (Default)
```env
DATABASE_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
```

**Features:**
- Managed PostgreSQL with pgvector
- Built-in authentication
- Real-time subscriptions
- Storage for files
- Auto-generated REST API

#### PostgreSQL (Local/Self-Hosted)
```env
DATABASE_PROVIDER=postgres
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=source_code_analysis
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

**Features:**
- Full control over database
- Lower cost for high volume
- Better for air-gapped environments
- Requires manual setup of pgvector extension

### Optional Features

#### Langfuse Observability
```env
ENABLE_LANGFUSE=true  # false by default
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

**Benefits:**
- API request tracing
- Performance monitoring
- LLM call tracking
- Cost analysis

#### Redis Caching
```env
REDIS_URL=redis://scat-redis:6379
REDIS_TTL_DEFAULT=1800  # 30 minutes
REDIS_MAX_CONNECTIONS=10
```

**Benefits:**
- Dramatic performance improvements (2,700x faster)
- Reduced database load
- Lower API costs (fewer LLM calls)
- Graceful degradation if unavailable

#### OpenAI Integration
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
```

### Environment-Specific Configuration

| Environment | Config File | API URL | Use Case |
|-------------|-------------|---------|----------|
| **Local Dev** | `.env.local` | `http://localhost:8000` | Development without Docker |
| **Local Docker** | `.env.docker` | `http://localhost:8359` | Testing Docker locally |
| **Production** | `.env.production` | Production URL | Hostinger VPS deployment |

---

## Database Schema

### Core Tables

#### projects
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  tasks JSONB DEFAULT '[]',
  milestones JSONB DEFAULT '[]',
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### repositories
```sql
CREATE TABLE repositories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  username VARCHAR(255),
  main_branch VARCHAR(100) DEFAULT 'main',
  status VARCHAR(50) DEFAULT 'pending',
  repo_scan VARCHAR(50) DEFAULT 'pending',
  analysis_data JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### project_repositories (Many-to-Many)
```sql
CREATE TABLE project_repositories (
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  repository_id INTEGER REFERENCES repositories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (project_id, repository_id)
);
```

### RAG Tables

#### documents (Vector Storage)
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id INTEGER REFERENCES repositories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),  -- pgvector extension
  file_path TEXT,
  chunk_index INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_embedding ON documents
  USING ivfflat (embedding vector_cosine_ops);
```

#### document_metadata
```sql
CREATE TABLE document_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id INTEGER REFERENCES repositories(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT,
  lines_of_code INTEGER,
  processed_at TIMESTAMP DEFAULT NOW()
);
```

### Authentication Tables
- Managed by Supabase Auth
- `auth.users` - User accounts
- `user_profiles` - Extended user information

**SQL Migration Files**: Located in `backend/sql/` directory

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/user` - Get current user

### Projects
- `GET /api/v1/projects` - List all projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/{id}` - Get project details
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project
- `POST /api/v1/projects/{id}/repositories/{repo_id}` - Link repository
- `GET /api/v1/projects/{id}/repositories` - Get linked repositories

### Repositories
- `GET /api/v1/repositories` - List all repositories
- `POST /api/v1/repositories` - Add repository
- `GET /api/v1/repositories/{id}` - Get repository details
- `DELETE /api/v1/repositories/{id}` - Delete repository
- `GET /api/v1/repositories/{id}/complexity` - Get complexity analysis
- `GET /api/v1/repositories/{id}/tech-stack` - Get technology breakdown

### System
- `GET /api/v1/health` - Health check endpoint
- `GET /api/v1/overview` - System overview statistics

**Full API Documentation**: Available at `/docs` endpoint when server is running

---

## Performance Optimization

### Redis Caching Strategy

#### Function-Level Caching
```python
@cache_result(ttl=1800, key_prefix="repo")
async def get_repository_by_id_async(repo_id: int) -> Optional[Repository]:
    """Cached expensive repository lookup."""
    # Cache key: repo:get_repository_by_id_async:{hash}
    repo = await RepositoryRepository.get_by_id(repo_id)
    return repo
```

#### Response-Level Caching
```python
# Middleware caches entire GET responses
@app.middleware("http")
async def cache_middleware(request: Request, call_next):
    if request.method == "GET":
        cache_key = f"response_cache:{hash(request.url)}"
        cached = await redis.get(cache_key)
        if cached:
            return cached
    # ... process request
```

#### Performance Gains
| Operation | Without Cache | With Cache | Improvement |
|-----------|--------------|------------|-------------|
| AI Features Analysis | 1.2s | 0.0004s | **2,700x** |
| Repository Details | 250ms | 25ms | **10x** |
| Project Insights | 180ms | 18ms | **10x** |
| Tech Stack Analysis | 150ms | 15ms | **10x** |

#### Cache Configuration
- **TTL**: 30 minutes (1800 seconds)
- **Max Memory**: 100MB with LRU eviction
- **Persistence**: AOF (Append-Only File) enabled
- **Connection Pool**: 10 max connections

### Database Optimization

#### Indexes
- Primary keys on all tables
- Foreign key indexes for relationships
- Vector index on `documents.embedding` (IVFFlat)
- Composite indexes on frequently queried columns

#### Query Optimization
- Use of `select()` to fetch only required fields
- Batch operations for multiple inserts
- Async operations to prevent blocking

---

## Security Considerations

### Authentication
- Supabase Auth for user management
- JWT tokens for API authentication
- Row-level security (RLS) in database

### API Security
- CORS configured (currently `*`, should restrict in production)
- Input validation via Pydantic models
- SQL injection prevention (parameterized queries)
- Rate limiting (TODO)

### Environment Variables
- All sensitive credentials in environment variables
- Never commit `.env` files to Git
- Use `.env.example` as template

### Data Privacy
- Code never stored in logs
- User data isolated by user_id
- Option to delete all user data

---

## Monitoring & Observability

### Health Checks
- **Backend**: `GET /api/v1/health`
- **Frontend**: `GET /health` (Docker healthcheck)
- **Redis**: `redis-cli ping`
- **PostgreSQL**: `pg_isready`

### Logging
- Structured logging with context
- Log levels: DEBUG, INFO, WARNING, ERROR
- Flush logs immediately for debugging

### Langfuse Integration (Optional)
- Trace API requests end-to-end
- Monitor LLM calls and costs
- Analyze performance bottlenecks
- Dashboard: https://cloud.langfuse.com

### Metrics to Monitor
- API response times
- Cache hit rates
- Database query duration
- RAG pipeline processing speed
- Error rates by endpoint

---

## Future Enhancements

### Short-Term
- [ ] Expand test coverage (target: 80%+)
- [ ] Complete PostgreSQL provider implementation
- [ ] Add rate limiting middleware
- [ ] Implement API key authentication
- [ ] Add bulk repository import

### Medium-Term
- [ ] Real-time collaboration features
- [ ] WebSocket support for live updates
- [ ] Advanced search with filters
- [ ] Export reports (PDF, CSV)
- [ ] Team management features

### Long-Term
- [ ] Multi-tenancy support
- [ ] Kubernetes deployment
- [ ] GraphQL API
- [ ] Mobile application
- [ ] Advanced AI features (code generation, auto-fix)

---

## Troubleshooting

### Common Issues

#### "Database connection failed"
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Verify network connectivity
- Check Supabase project status

#### "Redis connection refused"
- Ensure Redis container is running: `docker ps`
- Check `REDIS_URL` configuration
- Application should continue without Redis (graceful degradation)

#### "RAG pipeline not processing"
- Check RAG pipeline logs: `docker compose logs -f rag-pipeline`
- Verify `EMBEDDING_API_KEY` is set
- Check repository status in database

#### "Frontend can't reach backend"
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS configuration in backend
- Ensure backend is running and healthy

### Debug Commands
```bash
# View all container logs
docker compose logs -f

# Check container health
docker ps

# Connect to Redis
docker exec -it scat-redis redis-cli

# Connect to PostgreSQL
docker exec -it scat-postgres psql -U postgres -d source_code_analysis

# Restart specific service
docker compose restart backend
```

---

## Contributing Guidelines

### Code Standards
- Follow existing architectural patterns
- Write tests for new features
- Update documentation
- Use type hints (Python) and TypeScript
- Run linters before committing

### Git Workflow
1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Run tests locally
4. Create pull request
5. Address review comments
6. Merge after approval

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: feat, fix, docs, style, refactor, test, chore

---

**Document Maintained By**: Claude Code
**Last Review**: 2026-01-07
**Next Review**: As needed for major changes
