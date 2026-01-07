# Configuration Switches Guide

## Overview

The Source Code Analysis Tool now supports flexible configuration switches to toggle features and switch between different service providers.

## Configuration Options

### 1. Langfuse Observability Toggle

Control whether Langfuse tracing is enabled:

```bash
# Enable Langfuse (requires credentials)
ENABLE_LANGFUSE=true
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com

# Disable Langfuse (default)
ENABLE_LANGFUSE=false
```

### 2. Database Provider Selection

Switch between Supabase and local PostgreSQL:

```bash
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

## Usage Scenarios

### Scenario 1: Development with Local PostgreSQL (No Langfuse)

**Best for**: Local development, testing, no external dependencies

```bash
# backend/.env
ENABLE_LANGFUSE=false
DATABASE_PROVIDER=postgres
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=source_code_analysis
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

```bash
docker compose -f docker-compose.local.yml up -d
```

### Scenario 2: Production with Supabase + Langfuse

**Best for**: Production deployment with full observability

```bash
# backend/.env
ENABLE_LANGFUSE=true
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
DATABASE_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
```

```bash
docker compose up -d
```

### Scenario 3: Testing with Supabase (No Langfuse)

**Best for**: Testing against production-like database without observability overhead

```bash
# backend/.env
ENABLE_LANGFUSE=false
DATABASE_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
```

### Scenario 4: Full Local Stack with Observability

**Best for**: Complete local development with observability testing

```bash
# backend/.env
ENABLE_LANGFUSE=true
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
DATABASE_PROVIDER=postgres
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=source_code_analysis
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

## Environment Variables Reference

### Configuration Switches
| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `ENABLE_LANGFUSE` | `true`, `false` | `false` | Enable/disable Langfuse observability |
| `DATABASE_PROVIDER` | `supabase`, `postgres` | `supabase` | Database provider selection |

### Langfuse Configuration (when `ENABLE_LANGFUSE=true`)
| Variable | Required | Description |
|----------|----------|-------------|
| `LANGFUSE_PUBLIC_KEY` | Yes | Langfuse public key |
| `LANGFUSE_SECRET_KEY` | Yes | Langfuse secret key |
| `LANGFUSE_HOST` | No | Langfuse host URL (default: https://cloud.langfuse.com) |

### Supabase Configuration (when `DATABASE_PROVIDER=supabase`)
| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |

### PostgreSQL Configuration (when `DATABASE_PROVIDER=postgres`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTGRES_HOST` | No | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | No | `5432` | PostgreSQL port |
| `POSTGRES_DB` | No | `source_code_analysis` | Database name |
| `POSTGRES_USER` | No | `postgres` | Database user |
| `POSTGRES_PASSWORD` | No | `postgres` | Database password |

## Docker Compose Services

The PostgreSQL service is included in both `docker-compose.yml` and `docker-compose.local.yml`:

- **Image**: `pgvector/pgvector:pg16` (includes pgvector extension)
- **Port**: `5432`
- **Volume**: `postgres-data` for persistence
- **Initialization**: Automatically runs SQL scripts from `backend/sql/` directory

The database schema is automatically initialized on first startup using the `000_complete_schema.sql` file.

## Switching Between Configurations

1. **Update `.env` file** with desired configuration
2. **Restart services**:
   ```bash
   docker compose down
   docker compose up -d
   ```

3. **Verify configuration** in logs:
   ```bash
   docker compose logs backend | grep -E "(Config|Langfuse|Database)"
   ```

You should see output like:
```
[Config] Loaded configuration:
  - Database Provider: postgres
  - Langfuse Enabled: false
  - Langfuse Configured: false
[Database] Connected to PostgreSQL: postgres:5432
```

## Troubleshooting

### Langfuse Not Working
- Ensure `ENABLE_LANGFUSE=true`
- Verify credentials are correct
- Check logs for Langfuse initialization errors

### Database Connection Issues
- For PostgreSQL: Ensure `postgres` service is healthy
- For Supabase: Verify URL and service key
- Check `DATABASE_PROVIDER` matches your configuration

### Migration Issues
- PostgreSQL automatically runs migrations on first startup
- For Supabase: Run migrations manually via Supabase dashboard or CLI
