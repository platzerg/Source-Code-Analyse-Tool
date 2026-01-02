-- ============================================================================
-- COMPLETE DATABASE SCHEMA
-- Run this entire file to create all tables at once
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- CORE TABLES (Migration 001)
-- ============================================================================

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

CREATE TABLE IF NOT EXISTS project_repositories (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, repository_id)
);

-- ============================================================================
-- PROJECT FEATURES (Migration 002)
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_backlog_items (
    id TEXT PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'Done', 'Blocked')),
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    assignee TEXT DEFAULT 'Unassigned',
    story_points INTEGER,
    sprint TEXT,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_board_tasks (
    id TEXT PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'Done')),
    assignee TEXT DEFAULT 'Unassigned',
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    due_date DATE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    description TEXT,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'delayed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_insights (
    id SERIAL PRIMARY KEY,
    project_id INTEGER UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    active_issues INTEGER DEFAULT 0,
    open_prs INTEGER DEFAULT 0,
    contributors INTEGER DEFAULT 0,
    total_commits INTEGER DEFAULT 0,
    code_coverage DECIMAL(5,2),
    technical_debt_hours DECIMAL(10,2),
    last_commit_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REPOSITORY FEATURES (Migration 003)
-- ============================================================================

CREATE TABLE IF NOT EXISTS repository_overview (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER UNIQUE NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    description TEXT,
    language_primary TEXT,
    total_files INTEGER DEFAULT 0,
    total_lines_of_code INTEGER DEFAULT 0,
    total_commits INTEGER DEFAULT 0,
    total_contributors INTEGER DEFAULT 0,
    total_branches INTEGER DEFAULT 0,
    total_tags INTEGER DEFAULT 0,
    license TEXT,
    last_commit_sha TEXT,
    last_commit_message TEXT,
    last_commit_author TEXT,
    last_commit_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repository_technologies (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT CHECK (category IN ('language', 'framework', 'library', 'tool', 'database', 'cloud', 'other')),
    version TEXT,
    file_count INTEGER DEFAULT 0,
    percentage DECIMAL(5,2),
    confidence DECIMAL(5,2),
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(repository_id, name)
);

CREATE TABLE IF NOT EXISTS repository_questions (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    context JSONB,
    asked_by TEXT,
    asked_at TIMESTAMPTZ DEFAULT NOW(),
    answered_at TIMESTAMPTZ,
    helpful_votes INTEGER DEFAULT 0,
    embedding vector(1536)
);

CREATE TABLE IF NOT EXISTS repository_code_flows (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    flow_type TEXT CHECK (flow_type IN ('api_endpoint', 'user_flow', 'data_flow', 'authentication', 'other')),
    entry_point TEXT,
    steps JSONB,
    diagram_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repository_team_members (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT,
    total_commits INTEGER DEFAULT 0,
    total_lines_added INTEGER DEFAULT 0,
    total_lines_removed INTEGER DEFAULT 0,
    first_commit_date TIMESTAMPTZ,
    last_commit_date TIMESTAMPTZ,
    expertise_areas TEXT[],
    activity_score DECIMAL(5,2),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repository_code_quality (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER UNIQUE NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    overall_score DECIMAL(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
    maintainability_index DECIMAL(5,2),
    cyclomatic_complexity DECIMAL(10,2),
    code_duplication_percentage DECIMAL(5,2),
    test_coverage_percentage DECIMAL(5,2),
    documentation_coverage_percentage DECIMAL(5,2),
    linting_issues INTEGER DEFAULT 0,
    code_smells INTEGER DEFAULT 0,
    technical_debt_minutes INTEGER DEFAULT 0,
    last_analyzed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repository_quality_issues (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    line_number INTEGER,
    issue_type TEXT CHECK (issue_type IN ('bug', 'vulnerability', 'code_smell', 'duplication', 'complexity', 'style')),
    severity TEXT CHECK (severity IN ('info', 'minor', 'major', 'critical', 'blocker')),
    message TEXT NOT NULL,
    rule TEXT,
    effort_minutes INTEGER,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repository_dependencies (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    version TEXT,
    version_latest TEXT,
    dependency_type TEXT CHECK (dependency_type IN ('production', 'development', 'peer', 'optional')),
    package_manager TEXT,
    is_outdated BOOLEAN DEFAULT FALSE,
    has_vulnerabilities BOOLEAN DEFAULT FALSE,
    license TEXT,
    file_path TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(repository_id, name, package_manager)
);

CREATE TABLE IF NOT EXISTS repository_vulnerabilities (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    cve_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    cvss_score DECIMAL(3,1),
    affected_component TEXT,
    affected_version TEXT,
    fixed_version TEXT,
    file_path TEXT,
    line_number INTEGER,
    remediation TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'fixed', 'false_positive')),
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    fixed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS repository_pull_requests (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    pr_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT NOT NULL,
    status TEXT CHECK (status IN ('open', 'closed', 'merged', 'draft')),
    base_branch TEXT,
    head_branch TEXT,
    files_changed INTEGER DEFAULT 0,
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    commits INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    merged_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    UNIQUE(repository_id, pr_number)
);

CREATE TABLE IF NOT EXISTS repository_features (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    entry_points TEXT[],
    related_files TEXT[],
    complexity_score DECIMAL(5,2),
    last_modified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repository_ai_suggestions (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    suggestion_type TEXT CHECK (suggestion_type IN ('refactoring', 'optimization', 'security', 'documentation', 'testing', 'architecture')),
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    line_start INTEGER,
    line_end INTEGER,
    code_before TEXT,
    code_after TEXT,
    confidence DECIMAL(5,2),
    impact TEXT CHECK (impact IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'implemented')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repository_code_embeddings (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_type TEXT CHECK (chunk_type IN ('function', 'class', 'module', 'comment', 'documentation')),
    line_start INTEGER,
    line_end INTEGER,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SETTINGS (Migration 004)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language TEXT DEFAULT 'en',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES (Migration 005)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner);
CREATE INDEX IF NOT EXISTS idx_repositories_status ON repositories(status);
CREATE INDEX IF NOT EXISTS idx_repositories_url ON repositories(url);
CREATE INDEX IF NOT EXISTS idx_project_repos_project_id ON project_repositories(project_id);
CREATE INDEX IF NOT EXISTS idx_project_repos_repository_id ON project_repositories(repository_id);
CREATE INDEX IF NOT EXISTS idx_backlog_project_id ON project_backlog_items(project_id);
CREATE INDEX IF NOT EXISTS idx_backlog_status ON project_backlog_items(status);
CREATE INDEX IF NOT EXISTS idx_board_project_id ON project_board_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_board_status ON project_board_tasks(status);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_tech_repository_id ON repository_technologies(repository_id);
CREATE INDEX IF NOT EXISTS idx_tech_category ON repository_technologies(category);
CREATE INDEX IF NOT EXISTS idx_questions_repository_id ON repository_questions(repository_id);
CREATE INDEX IF NOT EXISTS idx_flows_repository_id ON repository_code_flows(repository_id);
CREATE INDEX IF NOT EXISTS idx_team_repository_id ON repository_team_members(repository_id);
CREATE INDEX IF NOT EXISTS idx_deps_repository_id ON repository_dependencies(repository_id);
CREATE INDEX IF NOT EXISTS idx_deps_outdated ON repository_dependencies(is_outdated);
CREATE INDEX IF NOT EXISTS idx_deps_vulnerable ON repository_dependencies(has_vulnerabilities);
CREATE INDEX IF NOT EXISTS idx_vulns_repository_id ON repository_vulnerabilities(repository_id);
CREATE INDEX IF NOT EXISTS idx_vulns_severity ON repository_vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulns_status ON repository_vulnerabilities(status);
CREATE INDEX IF NOT EXISTS idx_prs_repository_id ON repository_pull_requests(repository_id);
CREATE INDEX IF NOT EXISTS idx_prs_status ON repository_pull_requests(status);
CREATE INDEX IF NOT EXISTS idx_features_repository_id ON repository_features(repository_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_repository_id ON repository_ai_suggestions(repository_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON repository_ai_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_embeddings_repository_id ON repository_code_embeddings(repository_id);

-- ============================================================================
-- TRIGGERS (Migration 006)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repositories_updated_at BEFORE UPDATE ON repositories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_backlog_updated_at BEFORE UPDATE ON project_backlog_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_board_updated_at BEFORE UPDATE ON project_board_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON project_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insights_updated_at BEFORE UPDATE ON project_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_overview_updated_at BEFORE UPDATE ON repository_overview
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_code_flows_updated_at BEFORE UPDATE ON repository_code_flows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_updated_at BEFORE UPDATE ON repository_team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quality_updated_at BEFORE UPDATE ON repository_code_quality
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prs_updated_at BEFORE UPDATE ON repository_pull_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_suggestions_updated_at BEFORE UPDATE ON repository_ai_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'All migrations completed successfully!' AS status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
