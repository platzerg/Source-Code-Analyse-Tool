-- =============================================================================
-- RAG PIPELINE SCHEMA CONSOLIDATION
-- Consolidates metadata, tabular data, vector storage, and pipeline state
-- =============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Document Metadata (Reference for all chunks and rows)
CREATE TABLE IF NOT EXISTS document_metadata (
    id TEXT PRIMARY KEY,
    title TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    schema TEXT
);

-- 3. Document Rows (For tabular data like CSV/Excel)
CREATE TABLE IF NOT EXISTS document_rows (
    id SERIAL PRIMARY KEY,
    dataset_id TEXT REFERENCES document_metadata(id) ON DELETE CASCADE,
    row_data JSONB
);

-- 4. Documents (Vector storage for RAG)
CREATE TABLE IF NOT EXISTS documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(1536) -- Default for OpenAI text-embedding-3-small
);

-- 5. RAG Pipeline State (Change detection and run tracking)
CREATE TABLE IF NOT EXISTS rag_pipeline_state (
    pipeline_id TEXT PRIMARY KEY,
    pipeline_type TEXT NOT NULL,
    last_check_time TIMESTAMP WITH TIME ZONE,
    known_files JSONB,
    last_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_metadata_file_id ON documents USING gin ((metadata->'file_id'));
CREATE INDEX IF NOT EXISTS idx_rag_pipeline_state_pipeline_type ON rag_pipeline_state(pipeline_type);
CREATE INDEX IF NOT EXISTS idx_rag_pipeline_state_last_run ON rag_pipeline_state(last_run);

-- 7. Search Function (match_documents)
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_count int default null,
  filter jsonb DEFAULT '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 8. Updated At Trigger for pipeline state
CREATE OR REPLACE FUNCTION update_rag_pipeline_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_rag_pipeline_state_updated_at') THEN
        CREATE TRIGGER update_rag_pipeline_state_updated_at
            BEFORE UPDATE ON rag_pipeline_state
            FOR EACH ROW
            EXECUTE FUNCTION update_rag_pipeline_state_updated_at();
    END IF;
END $$;
