"""
Test script to check what data is available from LinkedIn API
Run this after connecting a LinkedIn account to see what endpoints work
"""
import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_linkedin_endpoints(access_token, user_id):
    """Test various LinkedIn API endpoints to see what's accessible"""
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'X-Restli-Protocol-Version': '2.0.0'
    }
    
    print("=" * 80)
    print("TESTING LINKEDIN API ENDPOINTS")
    print("=" * 80)
    
    # Test 1: Basic userinfo (OpenID Connect)
    print("\n1. Testing /v2/userinfo (OpenID Connect)")
    try:
        response = requests.get('https://api.linkedin.com/v2/userinfo', headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Success! Data: {data}")
        else:
            print(f"   ✗ Failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
    
    # Test 2: Profile /me endpoint
    print("\n2. Testing /v2/me")
    try:
        response = requests.get('https://api.linkedin.com/v2/me', headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Success! Data: {data}")
        else:
            print(f"   ✗ Failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
    
    # Test 3: Profile with projection
    print("\n3. Testing /v2/me with projection (numConnections)")
    try:
        response = requests.get(
            'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,numConnections)',
            headers=headers
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Success! Data: {data}")
        else:
            print(f"   ✗ Failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
    
    # Test 4: Connections endpoint
    print("\n4. Testing /v2/connections")
    try:
        response = requests.get(
            'https://api.linkedin.com/v2/connections?q=viewer&count=0',
            headers=headers
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Success! Data: {data}")
        else:
            print(f"   ✗ Failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
    
    # Test 5: UGC Posts
    print(f"\n5. Testing /v2/ugcPosts (user_id: {user_id})")
    try:
        response = requests.get(
            f'https://api.linkedin.com/v2/ugcPosts?q=authors&authors=urn:li:person:{user_id}&count=10',
            headers=headers
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Success! Found {len(data.get('elements', []))} posts")
            if data.get('elements'):
                print(f"   Sample post: {data['elements'][0]}")
        else:
            print(f"   ✗ Failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
    
    # Test 6: Shares endpoint
    print(f"\n6. Testing /v2/shares (user_id: {user_id})")
    try:
        response = requests.get(
            f'https://api.linkedin.com/v2/shares?q=owners&owners=urn:li:person:{user_id}&count=10',
            headers=headers
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Success! Found {len(data.get('elements', []))} shares")
        else:
            print(f"   ✗ Failed: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python test_linkedin_api.py <access_token> <linkedin_user_id>")
        print("\nTo get these values:")
        print("1. Connect your LinkedIn account in the app")
        print("2. Check the database: SELECT access_token, linkedin_user_id FROM linkedin_connections;")
        sys.exit(1)
    
    access_token = sys.argv[1]
    user_id = sys.argv[2]
    
    test_linkedin_endpoints(access_token, user_id)
