"""Test Instagram API directly to see what fields are returned"""
import sqlite3
import requests
import json

# Get the access token from database
conn = sqlite3.connect('instance/contentgenie_dev.db')
cursor = conn.cursor()
cursor.execute("SELECT access_token, instagram_username FROM instagram_connections WHERE is_active = 1 LIMIT 1")
row = cursor.fetchone()
conn.close()

if not row:
    print("❌ No active Instagram connection found in database")
    exit(1)

access_token, username = row

print("=" * 60)
print(f"TESTING INSTAGRAM API FOR @{username}")
print("=" * 60)

# Test 1: Basic fields (what we're currently requesting)
print("\n1. Testing with basic fields (id,username,account_type,media_count):")
print("-" * 60)

url = "https://graph.instagram.com/me"
params = {
    'fields': 'id,username,account_type,media_count',
    'access_token': access_token
}

try:
    response = requests.get(url, params=params)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success! Received fields: {list(data.keys())}")
        print(f"\nData:")
        print(json.dumps(data, indent=2))
    else:
        print(f"❌ Error: {response.text}")
except Exception as e:
    print(f"❌ Exception: {e}")

# Test 2: Try requesting ALL possible fields
print("\n\n2. Testing with ALL possible fields:")
print("-" * 60)

all_fields = 'id,username,account_type,media_count,followers_count,follows_count,biography,website,profile_picture_url'
params['fields'] = all_fields

try:
    response = requests.get(url, params=params)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success! Received fields: {list(data.keys())}")
        print(f"\nData:")
        print(json.dumps(data, indent=2))
    else:
        print(f"❌ Error: {response.text}")
        error_data = response.json()
        if 'error' in error_data:
            print(f"\nError details:")
            print(f"  Type: {error_data['error'].get('type')}")
            print(f"  Code: {error_data['error'].get('code')}")
            print(f"  Message: {error_data['error'].get('message')}")
except Exception as e:
    print(f"❌ Exception: {e}")

# Test 3: Check token info
print("\n\n3. Checking access token info:")
print("-" * 60)

debug_url = "https://graph.instagram.com/access_token"
debug_params = {
    'access_token': access_token
}

try:
    response = requests.get(debug_url, params=debug_params)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Token info:")
        print(json.dumps(data, indent=2))
    else:
        print(f"Token info not available")
except Exception as e:
    print(f"Could not get token info: {e}")

print("\n" + "=" * 60)
print("ANALYSIS:")
print("=" * 60)
print("""
If you see:
- Only 'id', 'username', 'account_type', 'media_count' → Instagram Basic Display API
- Additional fields like 'followers_count' → Instagram Graph API (Business)

Instagram Basic Display API (Personal accounts):
  ✅ id, username, account_type, media_count
  ❌ followers_count, biography, website, profile_picture_url

Instagram Graph API (Business/Creator accounts):
  ✅ All fields including followers_count

The account type in database shows 'BUSINESS' but if we're not getting
followers_count, it means:
1. The app is using Instagram Basic Display API (not Graph API)
2. Need to switch to Instagram Graph API for Business accounts
3. Or the account needs proper Business account setup in Instagram
""")
