"""
Comprehensive API endpoint testing for Phase 1 migration.
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_all_endpoints():
    """Test all critical endpoints."""
    print("=" * 70)
    print("COMPREHENSIVE API TESTING - PHASE 1 MIGRATION")
    print("=" * 70)
    
    tests = [
        ("GET /projects", f"{BASE_URL}/projects"),
        ("GET /repositories", f"{BASE_URL}/repositories"),
        ("GET /projects/3", f"{BASE_URL}/projects/3"),
        ("GET /repositories/5", f"{BASE_URL}/repositories/5"),
    ]
    
    results = {"passed": 0, "failed": 0}
    
    for test_name, url in tests:
        print(f"\n{'─' * 70}")
        print(f"Testing: {test_name}")
        print(f"{'─' * 70}")
        
        try:
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ PASS - Status: {response.status_code}")
                
                if isinstance(data, list):
                    print(f"   Returned {len(data)} items")
                elif isinstance(data, dict):
                    print(f"   Returned object with keys: {list(data.keys())[:5]}")
                
                results["passed"] += 1
            else:
                print(f"❌ FAIL - Status: {response.status_code}")
                print(f"   Error: {response.text[:200]}")
                results["failed"] += 1
                
        except Exception as e:
            print(f"❌ FAIL - Exception: {str(e)[:200]}")
            results["failed"] += 1
    
    # Summary
    print(f"\n{'=' * 70}")
    print("TEST SUMMARY")
    print(f"{'=' * 70}")
    print(f"✅ Passed: {results['passed']}/{len(tests)}")
    print(f"❌ Failed: {results['failed']}/{len(tests)}")
    
    if results['failed'] == 0:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️  {results['failed']} test(s) failed")
    
    print(f"{'=' * 70}\n")
    
    return results['failed'] == 0

if __name__ == "__main__":
    success = test_all_endpoints()
    exit(0 if success else 1)
