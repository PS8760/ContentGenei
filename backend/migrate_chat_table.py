#!/usr/bin/env python3
"""
Migration script to add team chat table to the database.
Run this script to create the chat table.
"""

from app import create_app
from models import db, TeamChat

def migrate_chat_table():
    """Create team chat table"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Starting migration for team chat table...")
            
            # Create table
            print("📊 Creating team_chats table...")
            TeamChat.__table__.create(db.engine, checkfirst=True)
            
            print("✅ Migration completed successfully!")
            print("\nNew table created:")
            print("  - team_chats")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            raise

if __name__ == '__main__':
    migrate_chat_table()
