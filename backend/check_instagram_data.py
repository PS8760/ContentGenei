"""Debug script to check Instagram connection data in database"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from platforms.instagram.instagram_model import InstagramConnection

app = create_app()

with app.app_context():
    print("=" * 60)
    print("INSTAGRAM CONNECTIONS IN DATABASE")
    print("=" * 60)
    
    connections = InstagramConnection.query.all()
    
    if not connections:
        print("\n❌ NO INSTAGRAM CONNECTIONS FOUND")
        print("\nYou need to:")
        print("1. Go through onboarding")
        print("2. Select Instagram as a platform")
        print("3. Complete the OAuth flow")
        print("4. Check this script again")
    else:
        for conn in connections:
            print(f"\nConnection ID: {conn.id}")
            print(f"User ID: {conn.user_id}")
            print(f"Instagram User ID: {conn.instagram_user_id}")
            print(f"Username: @{conn.instagram_username}")
            print(f"Account Type: {conn.instagram_account_type}")
            print(f"Media Count: {conn.media_count}")
            print(f"Followers Count: {conn.followers_count}")
            print(f"Profile Picture: {conn.profile_picture_url or 'None'}")
            print(f"Is Active: {conn.is_active}")
            print(f"Created At: {conn.created_at}")
            print(f"Last Synced: {conn.last_synced_at or 'Never'}")
            print("-" * 60)
    
    print("\n" + "=" * 60)
    print(f"Total Connections: {len(connections)}")
    print("=" * 60)
