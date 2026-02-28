"""
Migration script to add GeneiLink tables to the database
Run this script to create the new tables for GeneiLink feature
"""

from app import create_app
from models import db, PlatformConnection, AggregatedPost, PostCategory, PostCategoryAssignment, User
from datetime import datetime, timezone

def migrate_geneilink():
    """Create GeneiLink tables"""
    app = create_app()
    
    with app.app_context():
        print("Starting GeneiLink migration...")
        
        try:
            # Create all tables (will only create new ones)
            db.create_all()
            print("✓ Database tables created successfully")
            
            # Create default categories for existing users
            users = User.query.all()
            default_categories = [
                {'name': 'Favorites', 'description': 'Your favorite posts', 'color': '#F59E0B', 'is_default': True},
                {'name': 'High Engagement', 'description': 'Posts with high engagement', 'color': '#10B981', 'is_default': True},
                {'name': 'Inspiration', 'description': 'Inspiring content', 'color': '#8B5CF6', 'is_default': True}
            ]
            
            for user in users:
                # Check if user already has default categories
                existing = PostCategory.query.filter_by(user_id=user.id, is_default=True).first()
                if not existing:
                    for cat_data in default_categories:
                        category = PostCategory(
                            user_id=user.id,
                            name=cat_data['name'],
                            description=cat_data['description'],
                            color=cat_data['color'],
                            is_default=cat_data['is_default']
                        )
                        db.session.add(category)
                    print(f"✓ Created default categories for user: {user.email}")
            
            db.session.commit()
            print("✓ Default categories created for all users")
            
            print("\n=== Migration completed successfully! ===")
            print("\nNew tables created:")
            print("  - platform_connections")
            print("  - aggregated_posts")
            print("  - post_categories")
            print("  - post_category_assignments")
            print("\nYou can now use the GeneiLink feature!")
            
        except Exception as e:
            print(f"✗ Error during migration: {str(e)}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    migrate_geneilink()
