"""
Test API endpoints with Supabase database.
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_projects():
    """Test projects endpoint."""
    print("\n" + "=" * 60)
    print("Testing /api/v1/projects")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/projects")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            projects = response.json()
            print(f"✅ Found {len(projects)} projects")
            if projects:
                print(f"\nFirst project:")
                print(json.dumps(projects[0], indent=2))
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

def test_repositories():
    """Test repositories endpoint."""
    print("\n" + "=" * 60)
    print("Testing /api/v1/repositories")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/repositories")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            repos = response.json()
            print(f"✅ Found {len(repos)} repositories")
            if repos:
                print(f"\nFirst repository:")
                print(json.dumps(repos[0], indent=2))
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_projects()
    test_repositories()
