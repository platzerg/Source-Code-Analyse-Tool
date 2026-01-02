-- ============================================================================
-- Migration 001: Core Tables
-- Description: Creates the core projects and repositories tables
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Projects table (main entity)
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner TEXT NOT NULL,
    start_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'planning')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repositories table (main entity)
CREATE TABLE IF NOT EXISTS repositories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    username TEXT,
    main_branch TEXT DEFAULT 'main',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'cloning', 'cloned', 'analyzing', 'analyzed', 'error')),
    commit_analysis TEXT,
    repo_scan TEXT,
    commits_count INTEGER DEFAULT 0,
    vulnerabilities_count INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    last_analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project-Repository Relationship (Many-to-Many)
CREATE TABLE IF NOT EXISTS project_repositories (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, repository_id)
);

-- Verification
SELECT 'Migration 001 completed successfully' AS status;
