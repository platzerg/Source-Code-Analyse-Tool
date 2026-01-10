"""
PostgreSQL RAG pipeline client mirroring db_handler.py functionality.
Provides async PostgreSQL operations for RAG document processing.
"""
from typing import List, Dict, Any, Optional
import os
import io
import json
import traceback
import asyncpg
from datetime import datetime
from dotenv import load_dotenv
import base64
import sys
from pathlib import Path
from opentelemetry import trace

# Initialize tracer
tracer = trace.get_tracer("source_code_analysis_rag_postgres")

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from text_processor import chunk_text, create_embeddings, is_tabular_file, extract_schema_from_csv, extract_rows_from_csv

# Check if we're in production
is_production = os.getenv("ENVIRONMENT") == "production"

if not is_production:
    # Development: prioritize .env file
    project_root = Path(__file__).resolve().parent.parent
    dotenv_path = project_root / '.env'
    load_dotenv(dotenv_path, override=True)
else:
    # Production: use cloud platform env vars only
    load_dotenv()

# PostgreSQL connection configuration
postgres_config = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": int(os.getenv("POSTGRES_PORT", "5432")),
    "user": os.getenv("POSTGRES_USER", "scat_user"),
    "password": os.getenv("POSTGRES_PASSWORD", "scat_password"),
    "database": os.getenv("POSTGRES_DB", "source_code_analysis")
}

# Global connection pool
_postgres_pool: Optional[asyncpg.Pool] = None


async def get_postgres_pool() -> asyncpg.Pool:
    """Get or create PostgreSQL connection pool."""
    global _postgres_pool
    if _postgres_pool is None:
        _postgres_pool = await asyncpg.create_pool(
            host=postgres_config["host"],
            port=postgres_config["port"],
            user=postgres_config["user"],
            password=postgres_config["password"],
            database=postgres_config["database"],
            min_size=1,
            max_size=10
        )
    return _postgres_pool


async def delete_document_by_file_id(file_id: str) -> None:
    """
    Delete all records related to a specific file ID (documents, document_rows, and document_metadata).
    """
    try:
        pool = await get_postgres_pool()
        async with pool.acquire() as conn:
            # Delete all documents with the specified file_id in metadata
            result = await conn.execute(
                "DELETE FROM documents WHERE metadata->>'file_id' = $1",
                file_id
            )
            print(f"Deleted document chunks for file ID: {file_id}")
            
            # Delete all document_rows with the specified dataset_id
            try:
                await conn.execute(
                    "DELETE FROM document_rows WHERE dataset_id = $1",
                    file_id
                )
                print(f"Deleted document rows for file ID: {file_id}")
            except Exception as e:
                print(f"Error deleting document_rows for {file_id}: {e}")
            
            # Delete document_metadata
            try:
                await conn.execute(
                    "DELETE FROM document_metadata WHERE id = $1",
                    file_id
                )
                print(f"Deleted document metadata for file ID: {file_id}")
            except Exception as e:
                print(f"Error deleting document_metadata for {file_id}: {e}")
                
    except Exception as e:
        print(f"Error in delete_document_by_file_id: {e}")
        traceback.print_exc()


async def process_file_for_rag(file_path: str, content: str, file_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Process a file for RAG pipeline with PostgreSQL storage.
    """
    try:
        if file_id is None:
            file_id = base64.urlsafe_b64encode(file_path.encode()).decode().rstrip('=')
        
        # Delete existing records for this file
        await delete_document_by_file_id(file_id)
        
        pool = await get_postgres_pool()
        async with pool.acquire() as conn:
            # Insert document metadata
            await conn.execute(
                """
                INSERT INTO document_metadata (id, title, url, created_at)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    url = EXCLUDED.url,
                    created_at = EXCLUDED.created_at
                """,
                file_id, file_path, file_path, datetime.now()
            )
            
            # Check if file is tabular
            if is_tabular_file(file_path):
                return await _process_tabular_file(conn, file_id, file_path, content)
            else:
                return await _process_text_file(conn, file_id, file_path, content)
                
    except Exception as e:
        print(f"Error processing file {file_path}: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


async def _process_tabular_file(conn: asyncpg.Connection, file_id: str, file_path: str, content: str) -> Dict[str, Any]:
    """Process tabular file (CSV/Excel) for RAG."""
    try:
        # Extract schema and rows
        schema = extract_schema_from_csv(io.StringIO(content))
        rows = extract_rows_from_csv(io.StringIO(content))
        
        # Store schema in metadata
        await conn.execute(
            "UPDATE document_metadata SET schema = $1 WHERE id = $2",
            json.dumps(schema), file_id
        )
        
        # Store rows
        for i, row in enumerate(rows):
            await conn.execute(
                "INSERT INTO document_rows (dataset_id, row_data) VALUES ($1, $2)",
                file_id, json.dumps(row)
            )
        
        # Create text representation for vector embedding
        text_content = f"Dataset: {file_path}\nSchema: {json.dumps(schema)}\n"
        text_content += f"Sample data (first 5 rows):\n"
        for row in rows[:5]:
            text_content += f"{json.dumps(row)}\n"
        
        # Create embedding and store document
        embeddings = create_embeddings([text_content])
        if embeddings:
            await conn.execute(
                """
                INSERT INTO documents (content, metadata, embedding)
                VALUES ($1, $2, $3)
                """,
                text_content,
                json.dumps({"file_id": file_id, "type": "tabular", "file_path": file_path}),
                embeddings[0]
            )
        
        return {
            "status": "success",
            "file_id": file_id,
            "type": "tabular",
            "rows_processed": len(rows),
            "schema": schema
        }
        
    except Exception as e:
        print(f"Error processing tabular file {file_path}: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


async def _process_text_file(conn: asyncpg.Connection, file_id: str, file_path: str, content: str) -> Dict[str, Any]:
    """Process text file for RAG."""
    try:
        # Chunk the text
        chunks = chunk_text(content)
        
        # Create embeddings for all chunks
        embeddings = create_embeddings(chunks)
        
        if not embeddings or len(embeddings) != len(chunks):
            print(f"Warning: Embedding count mismatch for {file_path}")
            return {"status": "error", "message": "Embedding generation failed"}
        
        # Store document chunks
        chunks_stored = 0
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            await conn.execute(
                """
                INSERT INTO documents (content, metadata, embedding)
                VALUES ($1, $2, $3)
                """,
                chunk,
                json.dumps({
                    "file_id": file_id,
                    "type": "text",
                    "file_path": file_path,
                    "chunk_index": i,
                    "total_chunks": len(chunks)
                }),
                embedding
            )
            chunks_stored += 1
        
        return {
            "status": "success",
            "file_id": file_id,
            "type": "text",
            "chunks_processed": chunks_stored
        }
        
    except Exception as e:
        print(f"Error processing text file {file_path}: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


async def search_documents(query_embedding: List[float], match_count: int = 5, filter_metadata: Optional[Dict] = None) -> List[Dict[str, Any]]:
    """
    Search documents using vector similarity.
    """
    try:
        pool = await get_postgres_pool()
        async with pool.acquire() as conn:
            if filter_metadata:
                # Use the match_documents function with filter
                rows = await conn.fetch(
                    "SELECT * FROM match_documents($1::vector, $2, $3::jsonb)",
                    query_embedding, match_count, json.dumps(filter_metadata)
                )
            else:
                # Use the match_documents function without filter
                rows = await conn.fetch(
                    "SELECT * FROM match_documents($1::vector, $2)",
                    query_embedding, match_count
                )
            
            return [dict(row) for row in rows]
            
    except Exception as e:
        print(f"Error searching documents: {e}")
        traceback.print_exc()
        return []


async def get_document_by_file_id(file_id: str) -> Optional[Dict[str, Any]]:
    """
    Get document metadata by file ID.
    """
    try:
        pool = await get_postgres_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM document_metadata WHERE id = $1",
                file_id
            )
            return dict(row) if row else None
            
    except Exception as e:
        print(f"Error getting document by file_id {file_id}: {e}")
        return None


async def close_postgres_pool():
    """Close PostgreSQL connection pool."""
    global _postgres_pool
    if _postgres_pool:
        await _postgres_pool.close()
        _postgres_pool = None
