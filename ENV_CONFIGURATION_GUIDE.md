# Environment Configuration Guide

**Last Updated**: 2026-01-07
**Status**: Active Configuration

---

## Overview

This project uses a **clean, environment-based configuration system** with intelligent fallbacks to support different deployment scenarios.

### Key Principles
- ✅ **One source of truth** per environment
- ✅ **Template-based** setup via `.env.example` files
- ✅ **Never commit** actual credentials to Git
- ✅ **Intelligent fallbacks** in `config.ts` based on `NODE_ENV`

---

## File Structure

```
Source-Code-Analyse-Tool/
├── .env.example                      # Master template (IN Git)
├── .env.local                        # Local development (NOT in Git)
├── .env.docker                       # Docker Compose (NOT in Git)
├── .env.production                   # Production deployment (NOT in Git)
├── backend/
│   ├── .env.example                 # Backend template (IN Git)
│   └── .env                         # Backend config (NOT in Git)
├── backend_rag_pipeline/
│   ├── .env.example                 # RAG template (IN Git)
│   └── .env                         # RAG config (NOT in Git)
└── frontend/
    ├── .env.example                 # Frontend template (IN Git)
    ├── .env.local                   # Local dev (NOT in Git)
    └── .env.docker                  # Docker (NOT in Git)
```

### What's in Git?
- ✅ `.env.example` - Template with placeholders
- ✅ `.env.*.example` - Environment-specific templates
- ✅ `config.ts` - Configuration logic with fallbacks

### What's NOT in Git?
- ❌ `.env` - Any file with actual credentials
- ❌ `.env.local` - Local development config
- ❌ `.env.docker` - Docker config
- ❌ `.env.production` - Production config
- ❌ `.env-backup/` - Backup directory

---

## Setup for Different Environments

### 1. Local Development (No Docker)

**Use when**: Active development with hot-reload

**Setup:**
```bash
# 1. Copy templates
cp .env.example .env.local
cp backend/.env.example backend/.env
cp backend_rag_pipeline/.env.example backend_rag_pipeline/.env
cp frontend/.env.example frontend/.env.local

# 2. Edit files and set:
# - NEXT_PUBLIC_API_URL=http://localhost:8000
# - SUPABASE_URL=https://your-project.supabase.co
# - SUPABASE_SERVICE_KEY=your_actual_key
# - Add your actual credentials

# 3. Start services
cd backend && .venv/Scripts/python.exe -m uvicorn app.main:app --reload
cd frontend && npm run dev
```

**Expected Ports:**
- Frontend: `http://localhost:3000` (npm run dev)
- Backend: `http://localhost:8000` (uvicorn)

**config.ts behavior:**
```typescript
// NODE_ENV=development automatically uses:
API_BASE_URL = http://localhost:8000
```

---

### 2. Docker Compose (Local)

**Use when**: Testing Docker setup locally

**Setup:**
```bash
# 1. Copy templates
cp .env.example .env.docker
cp backend/.env.example backend/.env
cp backend_rag_pipeline/.env.example backend_rag_pipeline/.env
cp frontend/.env.example frontend/.env.docker

# 2. Edit files and set:
# - NEXT_PUBLIC_API_URL=http://localhost:8359
# - DATABASE_PROVIDER=postgres (for local PostgreSQL)
# - REDIS_URL=redis://scat-redis:6379
# - Add your actual credentials

# 3. Start Docker Compose
docker compose -f docker-compose.yml up -d --build
```

**Expected Ports:**
- Frontend: `http://localhost:3509`
- Backend: `http://localhost:8359`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

**config.ts behavior:**
```typescript
// NODE_ENV=production uses:
API_BASE_URL = http://localhost:8359 (or from .env.docker)
```

---

### 3. Production Deployment

**Use when**: Deploying to VPS/Cloud

**Setup:**
```bash
# 1. Copy templates
cp .env.example .env.production
cp backend/.env.example backend/.env
cp backend_rag_pipeline/.env.example backend_rag_pipeline/.env
cp frontend/.env.example frontend/.env.production

# 2. Edit files and set:
# - NEXT_PUBLIC_API_URL=https://your-backend-domain.com
# - DATABASE_PROVIDER=supabase (or managed PostgreSQL)
# - ENABLE_LANGFUSE=true (for production monitoring)
# - Add production credentials

# 3. Deploy with Docker Compose
docker compose -f docker-compose.prod.yml up -d --build
```

**Expected Configuration:**
- Frontend: `https://your-frontend-domain.com`
- Backend: `https://your-backend-domain.com`
- Database: Managed Supabase or PostgreSQL
- Redis: Managed Redis or container

---

## Configuration Variables Reference

### Frontend Variables (NEXT_PUBLIC_*)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No* | `http://localhost:8000` | Backend API URL<br/>*Has intelligent fallback |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://xxx.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | `eyJhbGc...` | Supabase anonymous key |

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_PROVIDER` | No | `supabase` | Database provider (`supabase` or `postgres`) |
| `ENABLE_LANGFUSE` | No | `false` | Enable Langfuse observability |
| `SUPABASE_URL` | Conditional | - | Required if `DATABASE_PROVIDER=supabase` |
| `SUPABASE_SERVICE_KEY` | Conditional | - | Required if `DATABASE_PROVIDER=supabase` |
| `POSTGRES_HOST` | Conditional | `localhost` | Required if `DATABASE_PROVIDER=postgres` |
| `POSTGRES_DB` | Conditional | `source_code_analysis` | Database name |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL |
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for embeddings |

### RAG Pipeline Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RAG_PIPELINE_TYPE` | No | `git` | Pipeline type (`git`, `local`, `google_drive`) |
| `RUN_MODE` | No | `continuous` | Run mode (`continuous`, `single`) |
| `EMBEDDING_API_KEY` | Yes | - | OpenAI API key for embeddings |
| `SUPABASE_URL` | Yes | - | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | - | Supabase service role key |

---

## Intelligent Fallbacks in config.ts

The `frontend/src/lib/config.ts` provides intelligent fallbacks:

```typescript
// Detects environment automatically
const isDevelopment = process.env.NODE_ENV === 'development';

// Priority system:
// 1. Explicit environment variable
// 2. Development fallback: http://localhost:8000
// 3. Production fallback: http://localhost:8359
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (isDevelopment ? 'http://localhost:8000' : 'http://localhost:8359');
```

**Benefits:**
- ✅ Works without .env file in development
- ✅ Correct defaults for each environment
- ✅ Can override with environment variable
- ✅ Type-safe configuration object

**Usage in components:**
```typescript
import { API_BASE_URL, config } from '@/lib/config';

// Option 1: Direct import
const response = await fetch(`${API_BASE_URL}/api/v1/health`);

// Option 2: Config object
const response = await fetch(`${config.api.baseUrl}/api/v1/health`);
```

---

## Common Scenarios

### Scenario 1: Fresh Project Setup
```bash
# Clone repository
git clone <repo-url>
cd Source-Code-Analyse-Tool

# Setup backend
cd backend
cp .env.example .env
# Edit .env with your credentials
python -m venv .venv
.venv/Scripts/Activate.ps1
pip install -r requirements.txt

# Setup frontend
cd ../frontend
cp .env.example .env.local
# Edit .env.local with your credentials
npm install

# Start development
cd ../backend && .venv/Scripts/python.exe -m uvicorn app.main:app --reload
cd ../frontend && npm run dev
```

### Scenario 2: Switch from Supabase to PostgreSQL
```bash
# 1. Edit backend/.env
DATABASE_PROVIDER=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=source_code_analysis
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# 2. Start PostgreSQL (Docker)
docker compose up postgres -d

# 3. Run migrations
docker exec -it scat-postgres psql -U postgres -d source_code_analysis -f /docker-entrypoint-initdb.d/000_complete_schema.sql

# 4. Restart backend
# Backend will automatically use PostgreSQL
```

### Scenario 3: Enable Langfuse Monitoring
```bash
# 1. Get Langfuse credentials from https://cloud.langfuse.com

# 2. Edit backend/.env
ENABLE_LANGFUSE=true
LANGFUSE_PUBLIC_KEY=pk-lf-your-key
LANGFUSE_SECRET_KEY=sk-lf-your-key
LANGFUSE_HOST=https://cloud.langfuse.com

# 3. Restart backend
# Langfuse tracing will now be active
```

---

## Troubleshooting

### Problem: Frontend can't reach backend

**Check:**
```bash
# 1. Verify API URL in config
cat frontend/.env.local | grep NEXT_PUBLIC_API_URL

# 2. Verify backend is running
curl http://localhost:8000/api/v1/health

# 3. Check CORS in backend (app/main.py)
# Ensure allow_origins includes your frontend URL
```

**Solution:**
```bash
# Edit frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000  # For local dev
# OR
NEXT_PUBLIC_API_URL=http://localhost:8359  # For Docker
```

### Problem: Config changes not reflected

**Cause**: Next.js caches environment variables at build time

**Solution:**
```bash
# 1. Stop dev server
# 2. Delete .next cache
rm -rf frontend/.next

# 3. Restart dev server
npm run dev
```

### Problem: Multiple .env files, which one is used?

**Priority** (Next.js):
1. `.env.local` (highest priority, local overrides)
2. `.env.development` (when NODE_ENV=development)
3. `.env.production` (when NODE_ENV=production)
4. `.env` (lowest priority, shared defaults)

**Best Practice**: Use `.env.local` for local development

---

## Security Best Practices

### ✅ DO:
- Use `.env.example` as templates
- Keep production credentials in secure vaults
- Use different credentials for dev/staging/prod
- Rotate credentials regularly
- Enable Langfuse in production for monitoring

### ❌ DON'T:
- Commit `.env` files with actual credentials
- Share credentials via Slack/Email
- Use production credentials in development
- Hardcode credentials in code
- Disable HTTPS in production

---

## Migration from Old Structure

If you have old `.env` files from before this cleanup:

### Step 1: Backup
```bash
mkdir .env-backup
cp .env .env-backup/
cp backend/.env .env-backup/backend.env
cp frontend/.env .env-backup/frontend.env
cp frontend/.env.local .env-backup/frontend.env.local
```

### Step 2: Clean Up
```bash
# Remove old files
rm .env
rm frontend/.env
rm frontend/.env.local

# Keep backend/.env (it's still used)
# Keep backend_rag_pipeline/.env (it's still used)
```

### Step 3: Create New Files
```bash
# For local development
cp .env.example .env.local
cp frontend/.env.example frontend/.env.local

# Edit with your credentials
nano .env.local
nano frontend/.env.local
```

### Step 4: Verify
```bash
# Check what's in Git
git status

# Should see:
# modified: .gitignore
# modified: frontend/src/lib/config.ts
# modified: frontend/.env.example
# modified: backend/.env.example
# new: .env.example
# new: ENV_CONFIGURATION_GUIDE.md

# Should NOT see:
# .env, .env.local, .env.docker, .env.production
```

---

## Quick Reference

### Development Workflow
```bash
# Start local development
npm run dev  # Frontend (port 3000, uses http://localhost:8000)
uvicorn app.main:app --reload  # Backend (port 8000)

# Start Docker development
docker compose up -d  # All services (frontend 3509, backend 8359)

# Check configuration
cat frontend/.env.local | grep NEXT_PUBLIC_API_URL
cat backend/.env | grep DATABASE_PROVIDER
```

### Environment Files Checklist
- [ ] `.env.example` - Master template (in Git)
- [ ] `backend/.env` - Backend config with credentials (not in Git)
- [ ] `backend_rag_pipeline/.env` - RAG config with credentials (not in Git)
- [ ] `frontend/.env.local` - Frontend local dev (not in Git)
- [ ] All `.env.example` files documented and up-to-date

---

## Support

- **Configuration Issues**: Check this guide
- **API Connection Errors**: See Troubleshooting section
- **Security Concerns**: Review Security Best Practices
- **Architecture Questions**: See `ARCHITECTURE.md`

---

**Last Cleanup**: 2026-01-07
**Backup Location**: `.env-backup/` (not in Git)
**Next Review**: As needed for configuration changes
