
import json
import os
from datetime import datetime

PROJECTS_FILE = "projects.json"

def get_date_from_quarter(quarter_str):
    # Default year 2025 if not specified
    year = 2025
    q = quarter_str.upper()
    
    if " " in q:
        # Try to parse "2024 Q1" etc
        parts = q.split(" ")
        try:
            val1 = int(parts[0])
            if val1 > 1000:
                year = val1
                q = parts[1]
        except:
            pass

    if "Q1" in q:
        return f"{year}-03-31"
    elif "Q2" in q:
        return f"{year}-06-30"
    elif "Q3" in q:
        return f"{year}-09-30"
    elif "Q4" in q:
        return f"{year}-12-31"
    
    # Fallback
    return f"{year}-12-31"

def migrate():
    if not os.path.exists(PROJECTS_FILE):
        print(f"File {PROJECTS_FILE} not found.")
        return

    try:
        with open(PROJECTS_FILE, 'r', encoding='utf-8') as f:
            projects = json.load(f)
        
        updated_count = 0
        
        for project in projects:
            if 'milestones' in project:
                for milestone in project['milestones']:
                    if 'date' not in milestone:
                        # Needs migration
                        quarter = milestone.get('quarter', 'Q4')
                        milestone['date'] = get_date_from_quarter(quarter)
                        # Remove quarter if you want to clean up, or keep it. 
                        # API model expects date.
                        # It's cleaner to keep it for now or remove it?
                        # Let's keep it mostly but the strict API might ignore it.
                        updated_count += 1
                        
        if updated_count > 0:
            with open(PROJECTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(projects, f, indent=4)
            print(f"Successfully migrated {updated_count} milestones to date format.")
        else:
            print("No milestones needed migration.")
            
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
