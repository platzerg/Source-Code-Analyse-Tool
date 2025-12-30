# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **production-ready AI Agent SaaS platform** with Stripe payment integration for token-based billing. It's a modular, three-tier architecture designed for independent deployment and scaling.

### Three Core Components

1. **backend_agent_api/** - FastAPI service with Pydantic AI agent (RAG, web search, image analysis, code execution, Stripe payments)
2. **backend_rag_pipeline/** - Document processing pipeline (watches local files or Google Drive)
3. **frontend/** - React/TypeScript chat interface with real-time streaming and token purchasing

All components share a **Supabase database** for user profiles, conversations, documents (vector storage), and Stripe transaction tracking.

## Development Commands

### Backend Agent API
```bash
cd backend_agent_api
python -m venv venv
venv\Scripts\activate  # Windows | source venv/bin/activate (Mac/Linux)
pip install -r requirements.txt
uvicorn agent_api:app --reload --port 8001
```

Test endpoint: http://localhost:8001/health
API docs: http://localhost:8001/docs

### Backend RAG Pipeline
```bash
cd backend_rag_pipeline
python -m venv venv
venv\Scripts\activate  # Windows | source venv/bin/activate (Mac/Linux)
pip install -r requirements.txt

# Local files pipeline
python docker_entrypoint.py --pipeline local --mode continuous

# Google Drive pipeline
python docker_entrypoint.py --pipeline google_drive --mode continuous
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Dev server (port 8081)
npm run build        # Production build
npm run lint         # ESLint check
```

### Full Stack with Docker
```bash
# Start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

## Testing

### Backend Agent API
```bash
cd backend_agent_api
pytest                      # All tests
pytest tests/test_tools.py  # Specific test file
pytest -v                   # Verbose output
```

### Backend RAG Pipeline
```bash
cd backend_rag_pipeline
pytest                      # All tests
pytest Local_Files/tests/   # Local files tests only
pytest Google_Drive/tests/  # Google Drive tests only
```

### Frontend E2E Tests (Playwright)
```bash
cd frontend
npx playwright install --with-deps  # First time only
npm run test                         # Run all tests
npm run test:ui                      # Interactive UI mode
npm run test:headed                  # See browser in action
```

## Database Setup

Execute SQL scripts **in order** from `sql/` directory in Supabase SQL editor:

**Fresh install (recommended):**
- `0-all-tables.sql` - Creates all tables including Stripe billing (⚠️ drops existing agent tables)

**OR upgrade from previous module:**
1. `1-user_profiles_requests.sql` through `9-rag_pipeline_state.sql` (base tables)
2. `10-stripe-tokens.sql` through `15-enable-realtime.sql` (Stripe integration)

**Critical for Ollama users:** If using `nomic-embed-text`, change vector dimensions from **1536 to 768** in:
- `sql/0-all-tables.sql` (lines 133, 149)
- `sql/7-documents.sql`

## Architecture Patterns

### Modular Independence
Each component is **self-contained** with its own:
- Dependencies and virtual environment
- Environment configuration (`.env` file)
- Dockerfile and deployment capabilities

This allows deploying components to different services (e.g., agent on GCP Cloud Run, RAG on DigitalOcean, frontend on Render).

### Agent Implementation Structure
- **agent.py** - Main Pydantic AI agent with system prompt and tool registration
- **tools.py** - Tool implementations (RAG, web search, image analysis, code execution)
- **clients.py** - Client configurations for LLMs, databases, mem0 long-term memory
- **agent_api.py** - FastAPI wrapper with streaming support
- **stripe_utils.py** - Payment intent creation and webhook verification
- **token_utils.py** - Atomic token deduction operations

### RAG Pipeline Modes
- **continuous** - Runs indefinitely, watching for file changes
- **single** - Processes once and exits (for scheduled jobs)
- **Dual source** - Supports local files OR Google Drive (not both simultaneously)

### Frontend Architecture
- **React 18 + TypeScript + Vite** - Modern build tooling
- **Shadcn UI** - Component library built on Radix UI primitives
- **Server-Sent Events** - Real-time streaming for AI responses
- **Supabase Realtime** - Live token balance updates
- **Stripe Elements** - Secure payment form handling

## Critical Integration Points

1. **Agent ↔ Database (RAG)**: Agent queries vector embeddings via `retrieve_relevant_documents_tool` in tools.py:32
2. **RAG Pipeline ↔ Database**: Pipeline stores document chunks and embeddings in `documents` table
3. **Frontend ↔ Agent API**: POST to `/api/pydantic-agent` with streaming responses
4. **Frontend ↔ Database**: Direct Supabase client for conversation management
5. **Agent ↔ Stripe**: Webhook endpoint at `/api/webhook/stripe` handles `payment_intent.succeeded` events
6. **Frontend ↔ Stripe**: Stripe Elements integration in `frontend/src/components/tokens/CheckoutForm.tsx`

## Stripe Payment Integration

### Local Development Setup
1. Install Stripe CLI: https://docs.stripe.com/stripe-cli
2. Login: `stripe login`
3. Start backend on port 8001
4. Forward webhooks: `stripe listen --forward-to localhost:8001/api/webhook/stripe`
5. Copy webhook secret (`whsec_...`) to backend `.env`
6. Test with card: `4242 4242 4242 4242`

### Token Pricing Tiers
Defined in `backend_agent_api/stripe_utils.py`:
- tier_1: $5.00 = 100 tokens
- tier_2: $10.00 = 250 tokens
- tier_3: $20.00 = 600 tokens

### Token Deduction Flow
1. User sends message to agent
2. `token_utils.deduct_token()` called **before** agent execution
3. Uses Supabase RPC function `deduct_user_token()` for atomic operation
4. Frontend receives real-time balance update via Supabase Realtime

## Environment Variables

### Backend Agent API (.env)
```env
# LLM Configuration
LLM_PROVIDER=openai
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your_api_key
LLM_CHOICE=gpt-4o-mini
VISION_LLM_CHOICE=gpt-4o-mini

# Embedding (must match RAG pipeline)
EMBEDDING_PROVIDER=openai
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_API_KEY=your_api_key
EMBEDDING_MODEL_CHOICE=text-embedding-3-small

# Database
DATABASE_URL=postgresql://user:pass@host:port/db  # For mem0 long-term memory
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key  # NOT anon key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Web Search
BRAVE_API_KEY=your_brave_key
SEARXNG_BASE_URL=http://localhost:8080

# Optional: Agent observability
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key  # NOT service key
VITE_AGENT_ENDPOINT=http://localhost:8001/api/pydantic-agent
VITE_ENABLE_STREAMING=true
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional: LangFuse integration for admin dashboard
VITE_LANGFUSE_HOST_WITH_PROJECT=http://localhost:3000/project/your-project-id
```

## Code Style & Conventions

### Python (Backend)
- Follow **PEP8** with 100-character line length (enforced by Ruff)
- Use **type hints** for all function signatures
- Format with `ruff format` (configured in pyproject.toml)
- Use **Pydantic v2** for data validation
- Google-style docstrings for public functions
- File limit: **500 lines** (refactor if exceeding)
- Function limit: **50 lines**
- Class limit: **100 lines**

### TypeScript (Frontend)
- ESLint configured in `eslint.config.js`
- Prefer functional components with hooks
- Use TypeScript strict mode
- Component files in `src/components/` organized by feature
- Shared utilities in `src/lib/`

### Naming Conventions
- **Python**: `snake_case` for variables/functions, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants
- **TypeScript**: `camelCase` for variables/functions, `PascalCase` for components/types

## Common Development Patterns

### Adding a New Agent Tool
1. Define tool function in `backend_agent_api/tools.py`
2. Use `@agent.tool` decorator with Pydantic-typed parameters
3. Register in `agent.py` by importing
4. Test in isolation with `pytest tests/test_tools.py::test_your_tool`

### Adding a New Frontend Page
1. Create component in `frontend/src/pages/YourPage.tsx`
2. Add route in `frontend/src/App.tsx`
3. Update navigation in `frontend/src/components/sidebar/ChatSidebar.tsx`

### Modifying Database Schema
1. Write SQL migration script in `sql/` directory
2. Test locally in Supabase SQL editor
3. Update TypeScript types in `frontend/src/types/database.types.ts`
4. Run `npx supabase gen types typescript` if using Supabase CLI

## Deployment Patterns

### Development (Manual)
Run each component separately with live reload (see Development Commands above)

### Docker Compose (Single Machine)
```bash
python deploy.py --type cloud  # With Caddy reverse proxy
# OR
python deploy.py --type local --project localai  # Integrate with Local AI Package
```

### Microservices (Cloud)
Deploy components independently:
- **Render**: Backend as Docker service, frontend as static site
- **GCP**: Cloud Run for backend, Cloud Storage + CDN for frontend
- **DigitalOcean**: Docker Droplet for full stack

Default ports:
- Agent API: **8001**
- Frontend dev: **8081**
- Frontend prod: **8082**

## Troubleshooting

### Vector Dimension Mismatch
**Error:** `dimension of vector does not match index`
**Fix:** Ensure embedding model dimensions match database schema:
- OpenAI `text-embedding-3-small`: 1536 dimensions
- Ollama `nomic-embed-text`: 768 dimensions

### CORS Errors
**Error:** `blocked by CORS policy`
**Fix:** Check `VITE_AGENT_ENDPOINT` in frontend `.env` matches actual backend URL

### Stripe Webhook Verification Fails
**Error:** `signature verification failed`
**Fix:**
1. Ensure `STRIPE_WEBHOOK_SECRET` matches output from `stripe listen`
2. Verify raw request body is used for verification (not parsed JSON)

### Function Calling Not Supported
**Error:** `model does not support tool calling`
**Fix:** Use models with tool support:
- OpenAI: gpt-4o-mini, gpt-4o, gpt-4-turbo
- Ollama: qwen2.5:14b-instruct-8k (NOT llama or mistral base models)

### Database Connection Issues
**Fix:**
1. Check Supabase credentials in `.env`
2. Verify service role key (NOT anon key) for backend
3. Check Supabase dashboard → Logs → Postgres for connection errors

### Port Conflicts
**Fix:**
```bash
# Windows
netstat -ano | findstr :8001

# Linux/Mac
lsof -i :8001
```
Change port in docker-compose.yml or uvicorn command

## Important Notes

- **NEVER commit secrets** - Use `.env` files (already in .gitignore)
- **Validate all user input** with Pydantic models
- **Use parameterized queries** for database operations (Supabase handles this)
- **Test Stripe integration** thoroughly with test cards before going live
- **Monitor token consumption** - Track in `token_transactions` table
- **Keep CLAUDE.md updated** when adding new patterns or dependencies

## Key Files to Reference

- `PRPs/ai_docs/architecture.md` - Detailed architecture documentation
- `PRPs/ai_docs/archon-rules.md` - Project management rules (if using Archon MCP)
- `README.md` - Complete setup guide with deployment options
- `backend_agent_api/README.md` - Agent API specifics
- `backend_rag_pipeline/README.md` - RAG pipeline configuration
- `frontend/README.md` - Frontend development guide
