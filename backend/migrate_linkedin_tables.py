"""
Migration script to create LinkedIn tables
Run this to add LinkedIn integration tables to the database
"""
from app import create_app
from models import db
from platforms.linkedin.linkedin_model import LinkedInConnection, LinkedInPost

def migrate_linkedin_tables():
    """Create LinkedIn tables in the database"""
    app = create_app()
    
    with app.app_context():
        print("Creating LinkedIn tables...")
        
        # Create tables
        db.create_all()
        
        print("✓ LinkedIn tables created successfully!")
        print("  - linkedin_connections")
        print("  - linkedin_posts")
        
        # Verify tables exist
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        
        if 'linkedin_connections' in tables:
            print("\n✓ linkedin_connections table verified")
            columns = [col['name'] for col in inspector.get_columns('linkedin_connections')]
            print(f"  Columns: {', '.join(columns)}")
        
        if 'linkedin_posts' in tables:
            print("\n✓ linkedin_posts table verified")
            columns = [col['name'] for col in inspector.get_columns('linkedin_posts')]
            print(f"  Columns: {', '.join(columns)}")
        
        print("\n✅ Migration complete!")

if __name__ == '__main__':
    migrate_linkedin_tables()
