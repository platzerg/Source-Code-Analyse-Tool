"""
Fix UTF-8 encoding in Supabase database.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.supabase_client import get_supabase
from dotenv import load_dotenv

load_dotenv()

def fix_encoding():
    """Fix UTF-8 encoding issues in database."""
    print("=" * 60)
    print("Fixing UTF-8 Encoding Issues")
    print("=" * 60)
    
    supabase = get_supabase()
    
    # Fix project owners
    projects_to_fix = [
        {"id": 3, "owner": "Platzer Günter"},
        {"id": 6, "owner": "Platzer Günter"},
        {"id": 7, "owner": "Platzer Günter"}
    ]
    
    for project in projects_to_fix:
        try:
            result = supabase.table("projects")\
                .update({"owner": project["owner"]})\
                .eq("id", project["id"])\
                .execute()
            print(f"✅ Fixed project {project['id']}: {project['owner']}")
        except Exception as e:
            print(f"❌ Error fixing project {project['id']}: {e}")
    
    print("\n" + "=" * 60)
    print("✅ Encoding fix complete!")
    print("=" * 60)

if __name__ == "__main__":
    fix_encoding()
