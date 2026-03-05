"""
Migration script to add Instagram analytics tables
Creates instagram_posts and instagram_competitors tables
"""
from app import app, db
from platforms.instagram.instagram_model import InstagramConnection, InstagramPost, InstagramCompetitor

def migrate():
    with app.app_context():
        print("=" * 60)
        print("INSTAGRAM ANALYTICS MIGRATION")
        print("=" * 60)
        
        print("\n📊 Creating new tables...")
        print("  - instagram_posts")
        print("  - instagram_competitors")
        
        try:
            # Create all tables (will skip existing ones)
            db.create_all()
            
            print("\n✅ Migration completed successfully!")
            print("\nNew tables created:")
            print("  ✓ instagram_posts (23 fields)")
            print("  ✓ instagram_competitors (15 fields)")
            print("\nExisting tables preserved:")
            print("  ✓ instagram_connections")
            print("  ✓ oauth_states")
            
            print("\n" + "=" * 60)
            print("NEXT STEPS:")
            print("=" * 60)
            print("1. Restart the backend server")
            print("2. Go to Instagram Analytics page")
            print("3. Click 'Sync Data' to fetch posts")
            print("4. View analytics and insights")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {str(e)}")
            print("\nTroubleshooting:")
            print("1. Make sure backend server is NOT running")
            print("2. Check database file permissions")
            print("3. Verify models are imported correctly")
            raise

if __name__ == '__main__':
    migrate()
