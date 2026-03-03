"""
Migration script to add Instagram Analytics tables to the database
Run this script to create the necessary tables for Instagram Analytics feature
"""

from app import create_app
from models import db
from models_instagram import InstagramConnection, InstagramPost, InstagramCompetitor

def migrate_instagram_tables():
    """Create Instagram Analytics tables"""
    app = create_app()
    
    with app.app_context():
        try:
            print("Creating Instagram Analytics tables...")
            
            # Create tables
            db.create_all()
            
            print("✅ Instagram Analytics tables created successfully!")
            print("\nCreated tables:")
            print("  - instagram_connections")
            print("  - instagram_posts")
            print("  - instagram_competitors")
            
            print("\n📝 Next steps:")
            print("  1. Add Instagram API credentials to your .env file:")
            print("     INSTAGRAM_APP_ID=your-app-id")
            print("     INSTAGRAM_APP_SECRET=your-app-secret")
            print("  2. Restart your backend server")
            print("  3. Navigate to /instagram-analytics in the frontend")
            print("  4. Connect your Instagram account")
            
        except Exception as e:
            print(f"❌ Error creating tables: {str(e)}")
            raise

if __name__ == '__main__':
    migrate_instagram_tables()
