"""
Debug API errors by testing all endpoints.
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_endpoint(name, url, method="GET", data=None):
    """Test a single endpoint."""
    print(f"\n{'─' * 60}")
    print(f"Testing: {name}")
    print(f"URL: {url}")
    print(f"{'─' * 60}")
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'N/A')}")
        
        # Try to parse as JSON
        try:
            json_data = response.json()
            print(f"✅ Valid JSON response")
            if isinstance(json_data, list):
                print(f"   Items: {len(json_data)}")
            elif isinstance(json_data, dict):
                print(f"   Keys: {list(json_data.keys())[:5]}")
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON!")
            print(f"   Error: {e}")
            print(f"   Response text (first 200 chars):")
            print(f"   {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def main():
    print("=" * 60)
    print("API ERROR DEBUGGING")
    print("=" * 60)
    
    # Test all endpoints
    endpoints = [
        ("Health Check", f"{BASE_URL}/health", "GET"),
        ("List Projects", f"{BASE_URL}/projects", "GET"),
        ("List Repositories", f"{BASE_URL}/repositories", "GET"),
        ("Get Project 3", f"{BASE_URL}/projects/3", "GET"),
        ("Get Repository 5", f"{BASE_URL}/repositories/5", "GET"),
        ("Get Project 3 Tasks", f"{BASE_URL}/projects/3/tasks", "GET"),
        ("Get Project 3 Milestones", f"{BASE_URL}/projects/3/milestones", "GET"),
    ]
    
    for endpoint in endpoints:
        test_endpoint(*endpoint)
    
    print(f"\n{'=' * 60}")
    print("DEBUGGING COMPLETE")
    print(f"{'=' * 60}\n")

if __name__ == "__main__":
    main()
