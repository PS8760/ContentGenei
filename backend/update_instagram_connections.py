"""Update existing Instagram connections with fresh data from API"""
import sqlite3
import requests
import json

# Get all active connections
conn = sqlite3.connect('instance/contentgenie_dev.db')
cursor = conn.cursor()
cursor.execute("SELECT id, access_token, instagram_username FROM instagram_connections WHERE is_active = 1")
rows = cursor.fetchall()

if not rows:
    print("❌ No active Instagram connections found")
    conn.close()
    exit(1)

print("=" * 60)
print(f"UPDATING {len(rows)} INSTAGRAM CONNECTION(S)")
print("=" * 60)

for connection_id, access_token, username in rows:
    print(f"\n📷 Updating @{username}...")
    print("-" * 60)
    
    # Fetch fresh data from Instagram API
    url = "https://graph.instagram.com/me"
    params = {
        'fields': 'id,username,account_type,media_count,followers_count,follows_count',
        'access_token': access_token
    }
    
    try:
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            print(f"❌ API Error: {response.text}")
            continue
        
        data = response.json()
        print(f"✅ Fetched fresh data from Instagram API")
        print(f"   Fields received: {list(data.keys())}")
        
        # Update database
        cursor.execute("""
            UPDATE instagram_connections 
            SET media_count = ?,
                followers_count = ?,
                follows_count = ?,
                instagram_account_type = ?,
                updated_at = datetime('now')
            WHERE id = ?
        """, (
            data.get('media_count', 0),
            data.get('followers_count', 0),
            data.get('follows_count', 0),
            data.get('account_type', 'PERSONAL'),
            connection_id
        ))
        
        conn.commit()
        
        print(f"✅ Database updated successfully")
        print(f"   Media Count: {data.get('media_count', 0)}")
        print(f"   Followers: {data.get('followers_count', 0)}")
        print(f"   Following: {data.get('follows_count', 0)}")
        print(f"   Account Type: {data.get('account_type', 'PERSONAL')}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        continue

conn.close()

print("\n" + "=" * 60)
print("✅ UPDATE COMPLETE")
print("=" * 60)
print("\nNext steps:")
print("1. Refresh the Dashboard page in your browser")
print("2. The Instagram card should now show the correct follower count")
print("3. If backend is running, it will use the updated code for future connections")
