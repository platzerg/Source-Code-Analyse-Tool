-- ============================================================================
-- Migration 002: Project Features
-- Description: Creates tables for project features (Backlog, Board, Roadmap, Insights)
-- ============================================================================

-- Backlog Items (Project Backlog Tab)
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

-- Board Tasks (Kanban Board Tab)
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

-- Roadmap Milestones (Roadmap/Gantt Tab)
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

-- Project Insights/Stats (Insights Tab)
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

-- Verification
SELECT 'Migration 002 completed successfully' AS status;
