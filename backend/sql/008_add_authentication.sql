-- ============================================================================
-- Phase 2A: Authentication Schema Updates
-- Description: Add user ownership and Row-Level Security
-- ============================================================================

-- Step 1: Add user_id columns
ALTER TABLE projects 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE repositories 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_repositories_user_id ON repositories(user_id);

-- Step 3: Enable Row-Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies for Projects

-- Users can view their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create projects (user_id must match authenticated user)
CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Step 5: Create RLS Policies for Repositories

-- Users can view their own repositories
CREATE POLICY "Users can view own repositories"
  ON repositories FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create repositories
CREATE POLICY "Users can create own repositories"
  ON repositories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own repositories
CREATE POLICY "Users can update own repositories"
  ON repositories FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own repositories
CREATE POLICY "Users can delete own repositories"
  ON repositories FOR DELETE
  USING (auth.uid() = user_id);

-- Verification
SELECT 'Authentication schema updates completed successfully' AS status;
