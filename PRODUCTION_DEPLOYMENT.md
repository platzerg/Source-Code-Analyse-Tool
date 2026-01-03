# Production Deployment Checklist

## Issue: No Data on Production (https://rca-cloud.platzer-agentic-ai.de/)

### Root Cause
Production is using a different Supabase database instance that is empty.

### Solution Steps

#### 1. Verify Production Environment Variables
On your production server, ensure the `.env` file has:

```bash
# Backend .env
SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_SERVICE_KEY=your-production-service-key
SUPABASE_ANON_KEY=your-production-anon-key

# Frontend .env
NEXT_PUBLIC_API_URL=https://rca-cloud.platzer-agentic-ai.de/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```

#### 2. Verify Supabase Tables Exist
Check that your production Supabase project has these tables:
- `projects`
- `repositories`
- `project_tasks`
- `project_milestones`
- `project_repositories` (junction table)
- `system_settings`

#### 3. Add Sample Data (Optional)
You can either:

**Option A: Use the Frontend to Add Data**
1. Navigate to Projects page
2. Click "Create Project"
3. Add a project
4. Add repositories to the project

**Option B: Import Data from Local**
Export from local Supabase and import to production:
```bash
# In Supabase dashboard:
# 1. Go to Table Editor
# 2. Select table
# 3. Export as CSV
# 4. Import CSV to production table
```

#### 4. Rebuild and Restart Docker Containers
On your production server:
```bash
cd /path/to/Source-Code-Analyse-Tool
docker compose down
docker compose up -d --build
```

#### 5. Verify Backend Health
```bash
curl https://rca-cloud.platzer-agentic-ai.de/api/v1/health
```

Should return:
```json
{"status": "ok", "service": "product-catalog-api"}
```

#### 6. Test API Endpoints
```bash
# Test projects endpoint
curl https://rca-cloud.platzer-agentic-ai.de/api/v1/projects

# Test repositories endpoint
curl https://rca-cloud.platzer-agentic-ai.de/api/v1/repositories

# Test overview endpoint
curl https://rca-cloud.platzer-agentic-ai.de/api/v1/overview
```

### Quick Fix: Add Test Data via API

You can use these curl commands to add test data:

```bash
# Create a test project
curl -X POST https://rca-cloud.platzer-agentic-ai.de/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "Sample project for testing",
    "owner": "Admin",
    "start_date": "2026-01-01",
    "status": "Active"
  }'

# Create a test repository
curl -X POST https://rca-cloud.platzer-agentic-ai.de/api/v1/repositories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-repo",
    "url": "https://github.com/example/test-repo",
    "main_branch": "main"
  }'
```

### Common Issues

**Issue 1: Backend can't connect to Supabase**
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Verify Supabase project is active
- Check network connectivity

**Issue 2: Frontend shows "Network Error"**
- Verify `NEXT_PUBLIC_API_URL` points to correct backend URL
- Check CORS settings in backend
- Verify backend is running and accessible

**Issue 3: Tables don't exist**
- Run the SQL schema from your local Supabase
- Or manually create tables in production Supabase dashboard

### Monitoring
After deployment, monitor:
- Docker container logs: `docker compose logs -f`
- Backend logs: `docker compose logs -f backend`
- Frontend logs: `docker compose logs -f frontend`
