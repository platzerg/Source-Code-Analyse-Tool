# Production Troubleshooting Guide

## Issue: Backend Not Responding
**Error:** `curl https://rca-backend-cloud.platzer-agentic-ai.de/api/v1` fails with "connection unexpectedly closed"

## Diagnostic Steps (Run on Production Server)

### 1. Check Docker Containers
```bash
# Check if backend is running
docker ps | grep backend

# Check all containers
docker compose ps
```

### 2. Check Backend Logs
```bash
# View backend logs
docker compose logs backend

# Follow logs in real-time
docker compose logs -f backend
```

### 3. Test Backend Locally
```bash
# Test if backend responds on localhost
curl http://127.0.0.1:8359/api/v1/health

# Should return: {"status":"ok","service":"product-catalog-api"}
```

### 4. Check Caddy Status
```bash
# Check if Caddy is running
systemctl status caddy

# Reload Caddy config
caddy reload --config /path/to/caddy.json

# Check Caddy logs
journalctl -u caddy -f
```

### 5. Verify Port Binding
```bash
# Check if port 8359 is listening
netstat -tlnp | grep 8359

# Or with ss
ss -tlnp | grep 8359
```

## Common Issues & Solutions

### Issue 1: Backend Container Not Running
**Solution:**
```bash
cd /path/to/Source-Code-Analyse-Tool
docker compose up -d backend
docker compose logs -f backend
```

### Issue 2: Backend Listening on Wrong Interface
**Check:** Backend should listen on `0.0.0.0:8000` inside container
**Fix:** Already correct in Dockerfile (CMD uses `--host 0.0.0.0`)

### Issue 3: Port Mapping Issue
**Check:** `docker-compose.yml` should have:
```yaml
backend:
  ports:
    - "8359:8000"  # External:Internal
```

### Issue 4: Caddy Can't Reach Backend
**Check:** Caddy config should have:
```yaml
- match:
    - tls:
        sni: ["rca-backend-cloud.platzer-agentic-ai.de"]
  handle:
    - handler: tls
      connection_policies:
        - alpn: ["http/1.1","acme-tls/1"]
    - handler: proxy
      upstreams:
        - dial: ["127.0.0.1:8359"]
```

## Environment Configuration

### Backend `.env`
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key
```

### Frontend `.env`
```bash
NEXT_PUBLIC_API_URL=https://rca-backend-cloud.platzer-agentic-ai.de/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Rebuild Steps

### Full Rebuild
```bash
cd /path/to/Source-Code-Analyse-Tool

# Stop all containers
docker compose down

# Rebuild and start
docker compose up -d --build

# Check logs
docker compose logs -f
```

### Backend Only
```bash
docker compose down backend
docker compose up -d --build backend
docker compose logs -f backend
```

### Frontend Only
```bash
docker compose down frontend
docker compose up -d --build frontend
docker compose logs -f frontend
```

## Verification

### 1. Test Backend Health
```bash
curl https://rca-backend-cloud.platzer-agentic-ai.de/api/v1/health
# Expected: {"status":"ok","service":"product-catalog-api"}
```

### 2. Test Backend Projects Endpoint
```bash
curl https://rca-backend-cloud.platzer-agentic-ai.de/api/v1/projects
# Expected: JSON array of projects
```

### 3. Test Frontend
```bash
curl https://rca-cloud.platzer-agentic-ai.de
# Expected: HTML content
```

### 4. Browser Test
1. Open https://rca-cloud.platzer-agentic-ai.de
2. Open DevTools (F12) → Network tab
3. Check API calls go to `https://rca-backend-cloud.platzer-agentic-ai.de/api/v1`
4. Verify 200 OK responses

## Quick Fix Checklist

- [ ] Backend container is running
- [ ] Backend responds on `http://127.0.0.1:8359/api/v1/health`
- [ ] Caddy is running and configured correctly
- [ ] Frontend `.env` has correct `NEXT_PUBLIC_API_URL`
- [ ] Backend `.env` has correct Supabase credentials
- [ ] Frontend rebuilt after `.env` changes
- [ ] No CORS errors in browser console
