"""
Test Supabase connection and database schema.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.supabase_client import get_supabase
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_connection():
    """Test Supabase connection."""
    print("=" * 60)
    print("Testing Supabase Connection")
    print("=" * 60)
    
    try:
        # Get Supabase client
        supabase = get_supabase()
        print("✅ Supabase client created successfully\n")
        
        # Test: List all tables
        print("📋 Checking database tables...")
        result = supabase.table("projects").select("count", count="exact").execute()
        print(f"✅ 'projects' table exists (count: {result.count})")
        
        result = supabase.table("repositories").select("count", count="exact").execute()
        print(f"✅ 'repositories' table exists (count: {result.count})")
        
        result = supabase.table("project_repositories").select("count", count="exact").execute()
        print(f"✅ 'project_repositories' table exists (count: {result.count})")
        
        result = supabase.table("project_board_tasks").select("count", count="exact").execute()
        print(f"✅ 'project_board_tasks' table exists (count: {result.count})")
        
        result = supabase.table("project_milestones").select("count", count="exact").execute()
        print(f"✅ 'project_milestones' table exists (count: {result.count})")
        
        print("\n" + "=" * 60)
        print("✅ All core tables verified!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nPlease check:")
        print("1. SUPABASE_URL is set in .env")
        print("2. SUPABASE_SERVICE_KEY is set in .env")
        print("3. SQL schema was executed in Supabase")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
