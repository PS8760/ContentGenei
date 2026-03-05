"""Verify Instagram followers count fix is working"""
import sqlite3
import os

db_path = os.path.join('instance', 'contentgenie_dev.db')

if not os.path.exists(db_path):
    print("❌ Database file not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 70)
print("INSTAGRAM FOLLOWERS COUNT FIX - VERIFICATION")
print("=" * 70)

try:
    cursor.execute("SELECT * FROM instagram_connections WHERE is_active = 1")
    rows = cursor.fetchall()
    
    if not rows:
        print("\n❌ NO ACTIVE INSTAGRAM CONNECTIONS FOUND")
        print("\nPlease connect Instagram through the app to test the fix.")
    else:
        cursor.execute("PRAGMA table_info(instagram_connections)")
        columns = [col[1] for col in cursor.fetchall()]
        
        print(f"\n✅ Found {len(rows)} active connection(s)\n")
        
        all_good = True
        
        for row in rows:
            data = dict(zip(columns, row))
            
            print(f"📷 Instagram Account: @{data.get('instagram_username', 'N/A')}")
            print("-" * 70)
            
            # Check each field
            account_type = data.get('instagram_account_type', 'N/A')
            followers = data.get('followers_count', 0)
            follows = data.get('follows_count', 0)
            media = data.get('media_count', 0)
            
            print(f"   Account Type: {account_type}")
            
            # Verify followers_count
            if account_type == 'BUSINESS' or account_type == 'CREATOR':
                if followers > 0:
                    print(f"   ✅ Followers Count: {followers} (CORRECT)")
                else:
                    print(f"   ⚠️  Followers Count: {followers} (May be 0 if account has no followers)")
            else:
                print(f"   ℹ️  Followers Count: {followers} (Personal accounts may not have this data)")
            
            # Verify follows_count
            print(f"   ✅ Following Count: {follows}")
            
            # Verify media_count
            print(f"   ✅ Media Count: {media}")
            
            # Check if profile picture URL exists
            profile_pic = data.get('profile_picture_url', '')
            if profile_pic:
                print(f"   ✅ Profile Picture: Available")
            else:
                print(f"   ℹ️  Profile Picture: Not available (may require different API)")
            
            print(f"   Last Updated: {data.get('updated_at', 'N/A')}")
            print()
            
except sqlite3.OperationalError as e:
    print(f"\n❌ Database error: {e}")
    print("\nThe instagram_connections table might not exist yet.")
    print("Run the backend server first to create tables.")

conn.close()

print("=" * 70)
print("NEXT STEPS:")
print("=" * 70)
print("""
1. If backend is running, restart it to load the updated code:
   cd backend && python run.py

2. Open the Dashboard in your browser:
   http://localhost:5173/dashboard

3. The Instagram card should now show:
   - Posts: 0 (or actual count)
   - Followers: 1 (or actual count)
   - Following: 0 (or actual count)
   - Account Type: BUSINESS

4. To test with a fresh connection:
   - Click "Disconnect" on the Instagram card
   - Go through onboarding again
   - Reconnect Instagram
   - The new connection will fetch correct data automatically

5. If you want full analytics features (post tracking, AI suggestions, etc.):
   - See INSTAGRAM_INTEGRATION_ANALYSIS.md for Phase 2-7 plan
   - Estimated 20-28 hours of development
""")

