# RAG Pipeline (Git Repositories & Local Files)

This RAG (Retrieval Augmented Generation) pipeline processes source code from Git repositories and local files. It automatically clones repositories, parses code files (Python, JS, TS, etc.), generates embeddings, and stores this information in a Supabase database with PGVector support.

The pipeline is designed to enable AI-driven insights, semantic search, and contextual chat within the **Source-Code-Analyse-Tool**.

## Features

- **Automated Git Integration:**
    - Monitors the `repositories` table for new entries.
    - Automatically clones remote repositories.
- **Google Drive Integration:**
    - Monitors specified Google Drive folders or entire drives for changes.
    - Synchronizes documents directly to the vector database.
- **Specialized Code Parsing:**
    - Language-aware parsing for `.py`, `.js`, `.ts`, `.tsx`, `.jsx`, `.go`, `.java`, `.cpp`, etc.
    - Extracts functional chunks and technical metadata.
- **Versatile Document Processing:**
    - Supports PDFs, CSVs, and markdown files in addition to source code.
- **Vector Storage:**
    - Generates embeddings using OpenAI models (or compatible providers).
    - Stores chunks and vectors in Supabase `documents` table for semantic retrieval.
- **Database State Management:**
    - Tracks analysis runs in the `rag_pipeline_state` table.
- **Continuous Monitoring:**
    - Runs as a background worker polling for new work.

## Requirements

- **Docker** (recommended) or Python 3.11+
- **Supabase** project with `pgvector` enabled.
- **OpenAI API Key** (for embeddings).
- **Git** installed (inside the container or local environment).

## Installation

### Docker Setup (Recommended)

1. **Configure Environment:**
   Ensure the `backend_rag_pipeline/.env` file is set up:
   ```env
   ENVIRONMENT=production
   RAG_PIPELINE_TYPE=git  # Options: git, local, google_drive
   RUN_MODE=continuous
   RAG_PIPELINE_ID=source-code-pipeline
   
   # Database
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   
   # AI
   EMBEDDING_API_KEY=sk-...
   EMBEDDING_MODEL_CHOICE=text-embedding-3-small

   # Google Drive (Required for pipeline=google_drive)
   GOOGLE_DRIVE_CREDENTIALS_JSON={"type": "service_account", ...}
   RAG_WATCH_FOLDER_ID=your-folder-id
   ```

2. **Run via Docker Compose:**
   From the project root:
   ```bash
   docker compose up -d rag-pipeline
   ```

### Manual Installation (Development)

1. **Navigate & Setup:**
   ```bash
   cd backend_rag_pipeline
   python -m venv .venv
   source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

2. **Run Individually:**
   ```bash
   # Git Monitor Mode
   python docker_entrypoint.py --pipeline git --mode continuous
   
   # Local File Monitor Mode
   python docker_entrypoint.py --pipeline local --mode continuous --directory ./data

   # Google Drive Mode
   python docker_entrypoint.py --pipeline google_drive --mode continuous
   ```

## Usage & Operations

### Monitoring Progress
You can view the internal logs of the RAG worker to see cloning and embedding progress:
```bash
docker compose logs -f rag-pipeline
```

### Triggering Analysis
The pipeline is **reactive**. To trigger an analysis:
1. Add a repository via the Frontend or Backend API.
2. The API inserts a record into the `repositories` table with `status='pending'`.
3. The RAG worker picks up the entry, clones it into `/app/repos/`, and starts vectorizing.

### Maintenance & Cleanup

#### Clear Database (Full Reset)
If you want to remove all vectorized data and start fresh, use the included cleanup script:

- **Via Docker:**
  ```bash
  docker compose exec rag-pipeline python clear_db.py
  ```
- **Manual/Local:**
  ```bash
  python clear_db.py
  ```

**Warning:** This will delete all records from the `documents`, `document_metadata`, and `document_rows` tables. Use with caution.

## Database Schema

The pipeline interacts with the following core tables:
- **`repositories`**: Reads entries to clone and updates status to `cloned`/`error`.
- **`documents`**: Stores text chunks, embeddings (`vector(1536)`), and metadata.
- **`rag_pipeline_state`**: Stores synchronization timestamps and processed file hashes.

## Project Structure

- **`common/`**: Shared logic for DB handling, text processing, and git operations.
- **`Local_Files/`**: Logic for monitoring local directories.
- **`repos/`**: Internal directory where Git repositories are cloned.
- **`docker_entrypoint.py`**: Unified entrypoint for orchestrated runs.
