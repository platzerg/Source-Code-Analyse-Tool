"""
Test script for settings save functionality.
Run this from the backend directory with: python test_settings.py
"""
import requests
import json

API_BASE_URL = "http://localhost:8000/api/v1"

def test_get_settings():
    """Test GET /settings endpoint"""
    print("\n=== Testing GET /settings ===")
    response = requests.get(f"{API_BASE_URL}/settings")
    print(f"Status Code: {response.status_code}")
    
    if response.ok:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        return True
    else:
        print(f"Error: {response.text}")
        return False

def test_save_settings():
    """Test POST /settings endpoint"""
    print("\n=== Testing POST /settings ===")
    
    test_settings = {
        "menu_visibility": {
            "project_tabs": {
                "repositories": True,
                "backlog": True,
                "board": False,  # Toggle one off for testing
                "roadmap": True,
                "insights": True
            },
            "repository_tabs": {
                "overview": True,
                "technologies": True,
                "complexity": False,  # Toggle one off for testing
                "timeline": True,
                "contributors": True,
                "change-history": True,
                "dead-code": True,
                "browse-files": True,
                "claude-md": True,
                "code-flows": True,
                "code-quality": True,
                "team-staffing": True,
                "feature-map": True,
                "dependencies": True,
                "security": True,
                "ai-features": True,
                "ask-questions": True,
                "prompt-generation": True,
                "pull-requests": True
            }
        }
    }
    
    print(f"Sending: {json.dumps(test_settings, indent=2)}")
    
    response = requests.post(
        f"{API_BASE_URL}/settings",
        json=test_settings,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.ok:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        return True
    else:
        print(f"Error: {response.text}")
        try:
            error_data = response.json()
            print(f"Error Details: {json.dumps(error_data, indent=2)}")
        except:
            pass
        return False

def test_verify_settings():
    """Verify settings were saved by retrieving them again"""
    print("\n=== Verifying Settings Were Saved ===")
    response = requests.get(f"{API_BASE_URL}/settings")
    
    if response.ok:
        data = response.json()
        print(f"Retrieved Settings: {json.dumps(data, indent=2)}")
        
        # Check if our test values are present
        if "menu_visibility" in data:
            project_tabs = data["menu_visibility"].get("project_tabs", {})
            repo_tabs = data["menu_visibility"].get("repository_tabs", {})
            
            # Verify our test changes
            board_off = project_tabs.get("board") == False
            complexity_off = repo_tabs.get("complexity") == False
            
            if board_off and complexity_off:
                print("✅ Settings verified! Test values found.")
                return True
            else:
                print("⚠️ Settings saved but test values not matching.")
                print(f"   Board: {project_tabs.get('board')} (expected False)")
                print(f"   Complexity: {repo_tabs.get('complexity')} (expected False)")
                return False
        else:
            print("⚠️ Settings structure unexpected")
            return False
    else:
        print(f"Error retrieving settings: {response.text}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("Settings Save Functionality Test")
    print("=" * 60)
    
    try:
        # Test 1: Get current settings
        test1 = test_get_settings()
        
        # Test 2: Save new settings
        test2 = test_save_settings()
        
        # Test 3: Verify settings were saved
        test3 = test_verify_settings()
        
        # Summary
        print("\n" + "=" * 60)
        print("Test Summary")
        print("=" * 60)
        print(f"GET /settings:    {'✅ PASS' if test1 else '❌ FAIL'}")
        print(f"POST /settings:   {'✅ PASS' if test2 else '❌ FAIL'}")
        print(f"Verify Save:      {'✅ PASS' if test3 else '❌ FAIL'}")
        print("=" * 60)
        
        if test1 and test2 and test3:
            print("\n🎉 All tests PASSED! Settings save functionality is working.")
            return 0
        else:
            print("\n❌ Some tests FAILED. Please check the errors above.")
            return 1
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to backend at", API_BASE_URL)
        print("Make sure the backend is running: python -m uvicorn app.main:app --reload")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())
