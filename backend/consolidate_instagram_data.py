"""
Consolidate Instagram data for duplicate connections
This fixes the issue where multiple users have the same Instagram account connected
"""

from app import create_app
from models import db, User
from platforms.instagram.instagram_model import InstagramPost, InstagramConnection
from datetime import datetime, timezone

def consolidate_data():
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("Instagram Data Consolidation")
        print("=" * 60)
        
        # Find all connections for satiksha650
        connections = InstagramConnection.query.filter_by(
            instagram_username='satiksha650',
            is_active=True
        ).all()
        
        print(f"\nFound {len(connections)} connections for satiksha650")
        
        # Show all users
        print("\nUsers with this Instagram account:")
        for i, conn in enumerate(connections, 1):
            user = User.query.get(conn.user_id)
            posts_count = InstagramPost.query.filter_by(
                connection_id=conn.id,
                user_id=conn.user_id
            ).count()
            print(f"\n{i}. User: {user.email if user else 'Unknown'}")
            print(f"   User ID: {conn.user_id}")
            print(f"   Connection ID: {conn.id}")
            print(f"   Posts: {posts_count}")
            print(f"   Created: {conn.created_at}")
        
        # Ask which user to keep
        print("\n" + "=" * 60)
        print("Which user do you want to keep? (Enter number 1-4)")
        print("This will:")
        print("  1. Keep the selected user's connection")
        print("  2. Move all posts to this user")
        print("  3. Deactivate other connections")
        print("=" * 60)
        
        choice = input("\nEnter your choice (1-4) or 'cancel' to abort: ")
        
        if choice.lower() == 'cancel':
            print("Operation cancelled")
            return
        
        try:
            choice_idx = int(choice) - 1
            if choice_idx < 0 or choice_idx >= len(connections):
                print("Invalid choice")
                return
        except ValueError:
            print("Invalid input")
            return
        
        # Get the selected connection
        primary_conn = connections[choice_idx]
        primary_user_id = primary_conn.user_id
        
        print(f"\n✅ Selected user: {primary_user_id}")
        print(f"✅ Selected connection: {primary_conn.id}")
        
        # Move all posts to primary user
        print("\nMoving posts to primary user...")
        all_posts = InstagramPost.query.filter(
            InstagramPost.connection_id.in_([c.id for c in connections])
        ).all()
        
        moved_count = 0
        for post in all_posts:
            if post.user_id != primary_user_id or post.connection_id != primary_conn.id:
                post.user_id = primary_user_id
                post.connection_id = primary_conn.id
                moved_count += 1
        
        print(f"✅ Moved {moved_count} posts to primary user")
        
        # Deactivate other connections
        print("\nDeactivating duplicate connections...")
        deactivated_count = 0
        for conn in connections:
            if conn.id != primary_conn.id:
                conn.is_active = False
                deactivated_count += 1
        
        print(f"✅ Deactivated {deactivated_count} duplicate connections")
        
        # Commit changes
        db.session.commit()
        
        # Show final state
        print("\n" + "=" * 60)
        print("Final State:")
        print("=" * 60)
        user = User.query.get(primary_user_id)
        posts_count = InstagramPost.query.filter_by(
            connection_id=primary_conn.id,
            user_id=primary_user_id
        ).count()
        
        print(f"\nActive User: {user.email if user else 'Unknown'}")
        print(f"User ID: {primary_user_id}")
        print(f"Connection ID: {primary_conn.id}")
        print(f"Total Posts: {posts_count}")
        
        print("\n✅ Consolidation complete!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Login with the email shown above")
        print("2. Go to Instagram Analytics")
        print("3. Click 'Sync Data' to fetch latest posts")
        print("=" * 60)

if __name__ == '__main__':
    consolidate_data()
