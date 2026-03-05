"""Simple database check without imports"""
import sqlite3
import os

db_path = os.path.join('instance', 'contentgenie_dev.db')

if not os.path.exists(db_path):
    print("❌ Database file not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 60)
print("CHECKING INSTAGRAM CONNECTIONS")
print("=" * 60)

try:
    cursor.execute("SELECT * FROM instagram_connections")
    rows = cursor.fetchall()
    
    if not rows:
        print("\n❌ NO INSTAGRAM CONNECTIONS FOUND")
        print("\nYou need to reconnect Instagram through the app!")
    else:
        cursor.execute("PRAGMA table_info(instagram_connections)")
        columns = [col[1] for col in cursor.fetchall()]
        
        print(f"\nFound {len(rows)} connection(s):\n")
        
        for row in rows:
            data = dict(zip(columns, row))
            print(f"Username: @{data.get('instagram_username', 'N/A')}")
            print(f"Account Type: {data.get('instagram_account_type', 'N/A')}")
            print(f"Media Count: {data.get('media_count', 0)}")
            print(f"Followers Count: {data.get('followers_count', 0)}")
            print(f"Profile Picture: {data.get('profile_picture_url', 'None')}")
            print(f"Is Active: {data.get('is_active', False)}")
            print(f"Created: {data.get('created_at', 'N/A')}")
            print("-" * 60)
            
except sqlite3.OperationalError as e:
    print(f"\n❌ Database error: {e}")
    print("\nThe instagram_connections table might not exist yet.")
    print("Run the backend server first to create tables.")

conn.close()

print("\n" + "=" * 60)
