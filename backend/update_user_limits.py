"""
Migration script to update existing users' monthly content limits
Run this script to increase limits for all existing users
"""

from app import create_app
from models import db, User

def update_user_limits():
    """Update all users' monthly content limits to new increased value"""
    app = create_app()
    
    with app.app_context():
        try:
            # Get all users
            users = User.query.all()
            
            updated_count = 0
            for user in users:
                # Update users who still have the old limit (50)
                if user.monthly_content_limit == 50:
                    user.monthly_content_limit = 500
                    updated_count += 1
                    print(f"Updated user {user.email}: limit 50 -> 500")
            
            # Commit all changes
            db.session.commit()
            
            print(f"\n✅ Successfully updated {updated_count} users")
            print(f"Total users in database: {len(users)}")
            
        except Exception as e:
            print(f"❌ Error updating user limits: {str(e)}")
            db.session.rollback()

if __name__ == '__main__':
    print("🚀 Starting user limit update...")
    print("Old limit: 50 content items per month")
    print("New limit: 500 content items per month")
    print("-" * 50)
    update_user_limits()
