import os
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path

def clear_all_chunks():
    """
    Utility script to clear all RAG-related data from Supabase.
    """
    # Load environment variables
    env_path = Path(__file__).resolve().parent / '.env'
    load_dotenv(env_path)
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        return

    supabase: Client = create_client(url, key)
    
    print("🧹 Starting cleanup of RAG tables...")
    
    try:
        # 1. Delete all from documents
        print("- Clearing 'documents' table...")
        # A more generic way to match all rows
        res = supabase.table("documents").delete().neq("content", "___non_existent_content___").execute()
        print(f"  Done. Deleted records count: {len(res.data) if res.data else 0}")

        # 2. Delete all from document_rows
        print("- Clearing 'document_rows' table...")
        res = supabase.table("document_rows").delete().neq("dataset_id", "___non_existent_id___").execute()
        print(f"  Done.")

        # 3. Delete all from document_metadata
        print("- Clearing 'document_metadata' table...")
        res = supabase.table("document_metadata").delete().neq("id", "___non_existent_id___").execute()
        print(f"  Done.")

        # 4. Clear pipeline state
        print("- Clearing 'pipeline_state' table...")
        res = supabase.table("pipeline_state").delete().neq("pipeline_id", "___non_existent_id___").execute()
        print(f"  Done.")

        print("\n✅ All RAG data has been cleared from Supabase.")
        
    except Exception as e:
        print(f"\n❌ Error during cleanup: {e}")

if __name__ == "__main__":
    clear_all_chunks()
