-- ============================================================================
-- Migration 005: Indexes
-- Description: Creates performance indexes for all tables
-- ============================================================================

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner);

-- Repositories
CREATE INDEX IF NOT EXISTS idx_repositories_status ON repositories(status);
CREATE INDEX IF NOT EXISTS idx_repositories_url ON repositories(url);

-- Project-Repository relationship
CREATE INDEX IF NOT EXISTS idx_project_repos_project_id ON project_repositories(project_id);
CREATE INDEX IF NOT EXISTS idx_project_repos_repository_id ON project_repositories(repository_id);

-- Backlog
CREATE INDEX IF NOT EXISTS idx_backlog_project_id ON project_backlog_items(project_id);
CREATE INDEX IF NOT EXISTS idx_backlog_status ON project_backlog_items(status);

-- Board
CREATE INDEX IF NOT EXISTS idx_board_project_id ON project_board_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_board_status ON project_board_tasks(status);

-- Milestones
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON project_milestones(status);

-- Technologies
CREATE INDEX IF NOT EXISTS idx_tech_repository_id ON repository_technologies(repository_id);
CREATE INDEX IF NOT EXISTS idx_tech_category ON repository_technologies(category);

-- Questions
CREATE INDEX IF NOT EXISTS idx_questions_repository_id ON repository_questions(repository_id);

-- Code Flows
CREATE INDEX IF NOT EXISTS idx_flows_repository_id ON repository_code_flows(repository_id);

-- Team Members
CREATE INDEX IF NOT EXISTS idx_team_repository_id ON repository_team_members(repository_id);

-- Dependencies
CREATE INDEX IF NOT EXISTS idx_deps_repository_id ON repository_dependencies(repository_id);
CREATE INDEX IF NOT EXISTS idx_deps_outdated ON repository_dependencies(is_outdated);
CREATE INDEX IF NOT EXISTS idx_deps_vulnerable ON repository_dependencies(has_vulnerabilities);

-- Vulnerabilities
CREATE INDEX IF NOT EXISTS idx_vulns_repository_id ON repository_vulnerabilities(repository_id);
CREATE INDEX IF NOT EXISTS idx_vulns_severity ON repository_vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulns_status ON repository_vulnerabilities(status);

-- Pull Requests
CREATE INDEX IF NOT EXISTS idx_prs_repository_id ON repository_pull_requests(repository_id);
CREATE INDEX IF NOT EXISTS idx_prs_status ON repository_pull_requests(status);

-- Features
CREATE INDEX IF NOT EXISTS idx_features_repository_id ON repository_features(repository_id);

-- AI Suggestions
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_repository_id ON repository_ai_suggestions(repository_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON repository_ai_suggestions(status);

-- Code Embeddings
CREATE INDEX IF NOT EXISTS idx_embeddings_repository_id ON repository_code_embeddings(repository_id);

-- Verification
SELECT 'Migration 005 completed successfully' AS status;
