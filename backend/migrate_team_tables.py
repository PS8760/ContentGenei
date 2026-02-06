#!/usr/bin/env python3
"""
Migration script to add team collaboration tables to the database.
Run this script to create the new tables without affecting existing data.
"""

from app import create_app
from models import db, TeamMember, TeamProject, CollaborationRequest

def migrate_team_tables():
    """Create team collaboration tables"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Starting migration for team collaboration tables...")
            
            # Create tables
            print("📊 Creating team_members table...")
            TeamMember.__table__.create(db.engine, checkfirst=True)
            
            print("📊 Creating team_projects table...")
            TeamProject.__table__.create(db.engine, checkfirst=True)
            
            print("📊 Creating collaboration_requests table...")
            CollaborationRequest.__table__.create(db.engine, checkfirst=True)
            
            print("✅ Migration completed successfully!")
            print("\nNew tables created:")
            print("  - team_members")
            print("  - team_projects")
            print("  - collaboration_requests")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            raise

if __name__ == '__main__':
    migrate_team_tables()
