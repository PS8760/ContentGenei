#!/usr/bin/env python3
"""
Migration script to create LinkoGenei tables in SQLite
This replaces MongoDB with SQLite for better consistency and persistence
"""

from app import app
from models import db, ExtensionToken, SavedPost, SavedPostCategory

def migrate():
    with app.app_context():
        print("Creating LinkoGenei tables in SQLite...")
        print("=" * 60)
        
        # Create the tables
        db.create_all()
        
        print("✅ Migration complete! LinkoGenei tables created.")
        print("\nTables created:")
        print("  1. extension_tokens - Stores Chrome extension access tokens")
        print("  2. saved_posts - Stores posts saved from social media")
        print("  3. saved_post_categories - Stores categories for organizing posts")
        print("\nTable: extension_tokens")
        print("  - id (primary key)")
        print("  - user_id (foreign key to users)")
        print("  - token (unique)")
        print("  - expires_at")
        print("  - created_at")
        print("\nTable: saved_posts")
        print("  - id (primary key)")
        print("  - user_id (foreign key to users)")
        print("  - url (unique per user)")
        print("  - platform (linkedin, instagram, twitter, etc.)")
        print("  - title")
        print("  - image_url")
        print("  - category")
        print("  - notes")
        print("  - tags (JSON)")
        print("  - created_at")
        print("  - updated_at")
        print("\nTable: saved_post_categories")
        print("  - id (primary key)")
        print("  - user_id (foreign key to users)")
        print("  - name (unique per user)")
        print("  - color")
        print("  - post_count")
        print("  - created_at")
        print("\n" + "=" * 60)
        print("✅ LinkoGenei now uses SQLite instead of MongoDB")
        print("✅ Data will persist across server restarts")
        print("✅ No MongoDB installation required")

if __name__ == '__main__':
    migrate()
