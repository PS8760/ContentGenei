#!/usr/bin/env python3
"""
Migration: Add generated_content table for analytics tracking
"""

from app import create_app
from models import db

def migrate():
    app = create_app()
    
    with app.app_context():
        print("Creating generated_content table...")
        
        # Create the new table
        db.create_all()
        
        print("✅ Migration complete!")
        print("New table 'generated_content' created for tracking ALL AI-generated content")

if __name__ == '__main__':
    migrate()
