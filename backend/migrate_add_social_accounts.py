#!/usr/bin/env python3
"""
Migration script to add social_accounts table
Run this to create the social_accounts table in the database
"""

from app import app
from models import db, SocialAccount

def migrate():
    with app.app_context():
        print("Creating social_accounts table...")
        
        # Create the table
        db.create_all()
        
        print("✅ Migration complete! social_accounts table created.")
        print("\nTable structure:")
        print("- id (primary key)")
        print("- user_id (foreign key to users)")
        print("- platform (instagram, linkedin, twitter, youtube)")
        print("- username")
        print("- profile_url")
        print("- full_name")
        print("- bio")
        print("- profile_pic")
        print("- is_verified")
        print("- is_private")
        print("- metrics (JSON)")
        print("- extra_data (JSON)")
        print("- last_updated")
        print("- connected_at")

if __name__ == '__main__':
    migrate()
