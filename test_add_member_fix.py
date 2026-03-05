"""
Test script to verify add member functionality
Run this after starting the backend server
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:5000/api"
TEST_EMAIL = "test@example.com"

def test_add_member():
    print("=" * 60)
    print("TESTING ADD MEMBER TO PROJECT")
    print("=" * 60)
    
    # Step 1: Check if backend is running
    print("\n1. Checking if backend is running...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("   ✅ Backend is running")
        else:
            print(f"   ❌ Backend returned status {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Backend is not running: {e}")
        print("   Please start backend with: cd backend && python run.py")
        return
    
    # Step 2: Test OPTIONS request (CORS preflight)
    print("\n2. Testing OPTIONS request (CORS preflight)...")
    try:
        response = requests.options(
            f"{BASE_URL}/team/projects/test-id/members",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST"
            }
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ OPTIONS request successful")
        else:
            print(f"   ❌ OPTIONS request failed")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Step 3: Instructions for testing with real token
    print("\n3. To test with real token:")
    print("   a. Login to your app at http://localhost:5173")
    print("   b. Open browser console (F12)")
    print("   c. Run: localStorage.getItem('token')")
    print("   d. Copy the token")
    print("   e. Run this command:")
    print()
    print("   curl -X POST http://localhost:5000/api/team/projects/YOUR_PROJECT_ID/members \\")
    print("     -H 'Content-Type: application/json' \\")
    print("     -H 'Authorization: Bearer YOUR_TOKEN' \\")
    print(f"     -d '{{\"email\": \"{TEST_EMAIL}\"}}'")
    print()
    
    print("\n4. Check browser console for errors:")
    print("   - Open http://localhost:5173")
    print("   - Press F12 to open Developer Tools")
    print("   - Go to Console tab")
    print("   - Try to add a member")
    print("   - Look for any error messages")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_add_member()
