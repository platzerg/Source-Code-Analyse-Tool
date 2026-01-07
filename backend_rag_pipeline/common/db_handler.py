from typing import List, Dict, Any, Optional
import os
import io
import json
import traceback
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import base64
import sys
import asyncio
import asyncpg
from pathlib import Path
from opentelemetry import trace

# Initialize tracer
tracer = trace.get_tracer("source_code_analysis_rag")

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

# Database configuration
DATABASE_PROVIDER = os.getenv("DATABASE_PROVIDER", "supabase").lower()

# Initialize Supabase client if needed
supabase: Optional[Client] = None
if DATABASE_PROVIDER == "supabase":
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    if supabase_url and supabase_key:
        supabase = create_client(supabase_url, supabase_key)

# PostgreSQL Pool (Lazy Init)
_pg_pool: Optional[asyncpg.Pool] = None

async def get_pg_pool() -> asyncpg.Pool:
    global _pg_pool
    if _pg_pool is None:
        pg_host = os.getenv("POSTGRES_HOST", "localhost")
        pg_port = os.getenv("POSTGRES_PORT", "5432")
        pg_db = os.getenv("POSTGRES_DB", "postgres")
        pg_user = os.getenv("POSTGRES_USER", "postgres")
        pg_pass = os.getenv("POSTGRES_PASSWORD", "postgres")
        
        conn_string = f"postgresql://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}"
        _pg_pool = await asyncpg.create_pool(conn_string, min_size=1, max_size=10)
    return _pg_pool

async def delete_document_by_file_id_async(file_id: str) -> None:
    """
    Delete all records related to a specific file ID (documents, document_rows, and document_metadata).
    """
    try:
        if DATABASE_PROVIDER == "postgres":
            pool = await get_pg_pool()
            async with pool.acquire() as conn:
                # Delete from documents (metadata is JSONB)
                await conn.execute("DELETE FROM documents WHERE metadata->>'file_id' = $1", file_id)
                # Delete from document_rows
                await conn.execute("DELETE FROM document_rows WHERE dataset_id = $1", file_id)
                # Delete from document_metadata
                await conn.execute("DELETE FROM document_metadata WHERE id = $1", file_id)
        else:
            if not supabase: return
            # Delete all documents with the specified file_id in metadata
            response = supabase.table("documents").delete().eq("metadata->>file_id", file_id).execute()
            
            # Delete all document_rows with the specified dataset_id
            try:
                supabase.table("document_rows").delete().eq("dataset_id", file_id).execute()
            except Exception as e:
                print(f"Error deleting document rows: {e}")
                
            # Delete the document_metadata record
            try:
                supabase.table("document_metadata").delete().eq("id", file_id).execute()
            except Exception as e:
                print(f"Error deleting document metadata: {e}")
                
    except Exception as e:
        print(f"Error deleting documents: {e}")

def delete_document_by_file_id(file_id: str) -> None:
    asyncio.run(delete_document_by_file_id_async(file_id))

async def insert_document_chunks_async(chunks: List[str], embeddings: List[List[float]], file_id: str, 
                        file_url: str, file_title: str, mime_type: str, file_contents: bytes | None = None) -> None:
    """
    Insert document chunks with their embeddings into the database.
    """
    try:
        if len(chunks) != len(embeddings):
            raise ValueError("Number of chunks and embeddings must match")
        
        data = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            file_bytes_str = base64.b64encode(file_contents).decode('utf-8') if file_contents else None
            metadata = {
                "file_id": file_id,
                "file_url": file_url,
                "file_title": file_title,
                "mime_type": mime_type,
                "chunk_index": i,
                **({"file_contents": file_bytes_str} if file_bytes_str else {})
            }
            data.append((chunk, json.dumps(metadata), embedding))

        if DATABASE_PROVIDER == "postgres":
            pool = await get_pg_pool()
            async with pool.acquire() as conn:
                await conn.executemany(
                    "INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3)",
                    data
                )
        else:
            if not supabase: return
            for chunk, meta_str, embed in data:
                supabase.table("documents").insert({
                    "content": chunk,
                    "metadata": json.loads(meta_str),
                    "embedding": embed
                }).execute()
    except Exception as e:
        print(f"Error inserting document chunks: {e}")

def insert_document_chunks(chunks: List[str], embeddings: List[List[float]], file_id: str, 
                        file_url: str, file_title: str, mime_type: str, file_contents: bytes | None = None) -> None:
    asyncio.run(insert_document_chunks_async(chunks, embeddings, file_id, file_url, file_title, mime_type, file_contents))

async def insert_or_update_document_metadata_async(file_id: str, file_title: str, file_url: str, schema: Optional[List[str]] = None) -> None:
    """
    Insert or update a record in the document_metadata table.
    """
    try:
        if DATABASE_PROVIDER == "postgres":
            pool = await get_pg_pool()
            schema_json = json.dumps(schema) if schema else None
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO document_metadata (id, title, url, schema)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (id) DO UPDATE 
                    SET title = EXCLUDED.title, url = EXCLUDED.url, schema = EXCLUDED.schema
                    """,
                    file_id, file_title, file_url, schema_json
                )
        else:
            if not supabase: return
            response = supabase.table("document_metadata").select("*").eq("id", file_id).execute()
            data = {
                "id": file_id,
                "title": file_title,
                "url": file_url
            }
            if schema:
                data["schema"] = json.dumps(schema)
            
            if response.data and len(response.data) > 0:
                supabase.table("document_metadata").update(data).eq("id", file_id).execute()
            else:
                supabase.table("document_metadata").insert(data).execute()
    except Exception as e:
        print(f"Error inserting/updating document metadata: {e}")

def insert_or_update_document_metadata(file_id: str, file_title: str, file_url: str, schema: Optional[List[str]] = None) -> None:
    asyncio.run(insert_or_update_document_metadata_async(file_id, file_title, file_url, schema))

async def insert_document_rows_async(file_id: str, rows: List[Dict[str, Any]]) -> None:
    """
    Insert rows from a tabular file into the document_rows table.
    """
    try:
        if DATABASE_PROVIDER == "postgres":
            pool = await get_pg_pool()
            async with pool.acquire() as conn:
                await conn.execute("DELETE FROM document_rows WHERE dataset_id = $1", file_id)
                data = [(file_id, json.dumps(row)) for row in rows]
                await conn.executemany(
                    "INSERT INTO document_rows (dataset_id, row_data) VALUES ($1, $2)",
                    data
                )
        else:
            if not supabase: return
            supabase.table("document_rows").delete().eq("dataset_id", file_id).execute()
            for row in rows:
                supabase.table("document_rows").insert({
                    "dataset_id": file_id,
                    "row_data": row
                }).execute()
    except Exception as e:
        print(f"Error inserting document rows: {e}")

def insert_document_rows(file_id: str, rows: List[Dict[str, Any]]) -> None:
    asyncio.run(insert_document_rows_async(file_id, rows))

async def process_file_for_rag_async(file_content: bytes, text: str, file_id: str, file_url: str, 
                        file_title: str, mime_type: str = None, config: Dict[str, Any] = None) -> None:
    """
    Process a file for the RAG pipeline.
    """
    with tracer.start_as_current_span("process_file_for_rag") as span:
        span.set_attribute("file.id", file_id)
        span.set_attribute("file.title", file_title)
        span.set_attribute("file.mime_type", mime_type or "unknown")
        
        try:
            await delete_document_by_file_id_async(file_id)
            is_tabular = False
            schema = None
            if mime_type:
                is_tabular = is_tabular_file(mime_type, config)
            if is_tabular:
                schema = extract_schema_from_csv(file_content)
            await insert_or_update_document_metadata_async(file_id, file_title, file_url, schema)
            if is_tabular:
                rows = extract_rows_from_csv(file_content)
                if rows:
                    await insert_document_rows_async(file_id, rows)

            text_processing = config.get('text_processing', {})
            chunk_size = text_processing.get('default_chunk_size', 400)
            chunk_overlap = text_processing.get('default_chunk_overlap', 0)

            chunks = chunk_text(text, chunk_size=chunk_size, overlap=chunk_overlap)
            if not chunks:
                print(f"No chunks were created for file '{file_title}' (Path: {file_id})")
                span.set_attribute("process.status", "no_chunks")
                return
            
            span.set_attribute("process.chunk_count", len(chunks))
            embeddings = create_embeddings(chunks)  

            if mime_type and mime_type.startswith("image"):
                await insert_document_chunks_async(chunks, embeddings, file_id, file_url, file_title, mime_type, file_content)
                return True
            
            await insert_document_chunks_async(chunks, embeddings, file_id, file_url, file_title, mime_type)
            span.set_attribute("process.status", "success")
            return True
        except Exception as e:
            span.record_exception(e)
            span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
            traceback.print_exc()
            print(f"Error processing file for RAG: {e}")
            return False

def process_file_for_rag(file_content: bytes, text: str, file_id: str, file_url: str, 
                        file_title: str, mime_type: str = None, config: Dict[str, Any] = None) -> None:
    return asyncio.run(process_file_for_rag_async(file_content, text, file_id, file_url, file_title, mime_type, config))
