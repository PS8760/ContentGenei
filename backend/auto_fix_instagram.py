"""
Automatically fix Instagram data by consolidating to the most recent connection
"""

from app import create_app
from models import db, User
from platforms.instagram.instagram_model import InstagramPost, InstagramConnection

def auto_fix():
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("Auto-Fix Instagram Data")
        print("=" * 60)
        
        # Find all connections for satiksha650
        connections = InstagramConnection.query.filter_by(
            instagram_username='satiksha650',
            is_active=True
        ).order_by(InstagramConnection.created_at.desc()).all()
        
        if not connections:
            print("No connections found")
            return
        
        # Use the most recent connection
        primary_conn = connections[0]
        primary_user_id = primary_conn.user_id
        
        user = User.query.get(primary_user_id)
        
        print(f"\n✅ Using most recent connection:")
        print(f"   User: {user.email if user else 'Unknown'}")
        print(f"   User ID: {primary_user_id}")
        print(f"   Connection ID: {primary_conn.id}")
        print(f"   Created: {primary_conn.created_at}")
        
        # Move all posts to primary user
        print("\n📦 Moving all posts to primary user...")
        all_posts = InstagramPost.query.filter(
            InstagramPost.connection_id.in_([c.id for c in connections])
        ).all()
        
        moved_count = 0
        for post in all_posts:
            if post.user_id != primary_user_id or post.connection_id != primary_conn.id:
                old_user = post.user_id
                old_conn = post.connection_id
                post.user_id = primary_user_id
                post.connection_id = primary_conn.id
                moved_count += 1
                print(f"   Moved post {post.instagram_post_id}: user {old_user[:8]}... -> {primary_user_id[:8]}...")
        
        print(f"\n✅ Moved {moved_count} posts")
        
        # Deactivate other connections
        print("\n🔒 Deactivating duplicate connections...")
        deactivated_count = 0
        for conn in connections[1:]:  # Skip first (primary)
            conn.is_active = False
            deactivated_count += 1
            print(f"   Deactivated connection for user {conn.user_id[:8]}...")
        
        print(f"\n✅ Deactivated {deactivated_count} duplicate connections")
        
        # Commit changes
        db.session.commit()
        
        # Show final state
        posts_count = InstagramPost.query.filter_by(
            connection_id=primary_conn.id,
            user_id=primary_user_id
        ).count()
        
        print("\n" + "=" * 60)
        print("✅ Fix Complete!")
        print("=" * 60)
        print(f"\nActive Connection:")
        print(f"  Email: {user.email if user else 'Unknown'}")
        print(f"  Instagram: @{primary_conn.instagram_username}")
        print(f"  Total Posts: {posts_count}")
        print("\n" + "=" * 60)
        print("Next Steps:")
        print(f"1. Login with: {user.email if user else 'Unknown'}")
        print("2. Go to Instagram Analytics")
        print("3. Click 'Sync Data' to fetch latest posts")
        print("4. All your posts should now appear!")
        print("=" * 60)

if __name__ == '__main__':
    auto_fix()
