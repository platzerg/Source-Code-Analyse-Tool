# Database Migrations

This directory contains SQL migration scripts for the Supabase database.

## Migration Order

Run these scripts in numerical order in your Supabase SQL Editor:

1. `001_core_tables.sql` - Core projects and repositories tables
2. `002_project_features.sql` - Project-related feature tables (backlog, board, roadmap, insights)
3. `003_repository_features.sql` - Repository analysis tables (overview, technologies, quality, etc.)
4. `004_settings.sql` - Settings and configuration tables
5. `005_indexes.sql` - Performance indexes
6. `006_triggers.sql` - Automatic timestamp triggers

## How to Run

### Option 1: All at Once
Copy and paste the entire content of `000_complete_schema.sql` into Supabase SQL Editor and run.

### Option 2: Step by Step
Run each numbered script in order for better control and debugging.

## Rollback

If you need to rollback, run:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

**WARNING**: This will delete ALL data!

## Verification

After running all migrations, verify with:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

You should see 22 tables.
