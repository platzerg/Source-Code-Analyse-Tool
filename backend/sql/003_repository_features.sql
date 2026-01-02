-- ============================================================================
-- Migration 003: Repository Features
-- Description: Creates tables for repository analysis features
-- ============================================================================

-- Repository Overview (Overview Tab)
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

-- Technologies Detected (Technologies Tab)
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

-- Q&A Conversations (Ask Questions Tab)
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

-- Code Flows/Architecture (Code Flows Tab)
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

-- Team Staffing Analysis (Team Staffing Tab)
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

-- Code Quality Metrics (Code Quality Tab)
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

-- Code Quality Issues (Detailed)
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

-- Dependencies (Dependencies Tab)
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

-- Security Vulnerabilities (Security Tab)
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

-- Pull Requests (Pull Request Tab)
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

-- Feature Map (Feature Map Tab)
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

-- AI Features/Suggestions (AI Features Tab)
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

-- Code Embeddings (for semantic search)
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

-- Verification
SELECT 'Migration 003 completed successfully' AS status;
