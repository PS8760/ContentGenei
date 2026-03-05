"""
Fix Instagram data associations after login/logout issues
This script ensures all posts are properly associated with users
"""

from app import create_app
from models import db
from platforms.instagram.instagram_model import InstagramPost, InstagramConnection
from datetime import datetime, timezone

def fix_instagram_data():
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("Instagram Data Fix Script")
        print("=" * 60)
        
        # Get all connections
        connections = InstagramConnection.query.filter_by(is_active=True).all()
        print(f"\nFound {len(connections)} active Instagram connections")
        
        for conn in connections:
            print(f"\n--- Connection: {conn.instagram_username} (User ID: {conn.user_id}) ---")
            
            # Find posts for this connection
            posts = InstagramPost.query.filter_by(connection_id=conn.id).all()
            print(f"Found {len(posts)} posts for this connection")
            
            # Check for posts with wrong user_id
            fixed_count = 0
            for post in posts:
                if post.user_id != conn.user_id:
                    print(f"  Fixing post {post.instagram_post_id}: user_id {post.user_id} -> {conn.user_id}")
                    post.user_id = conn.user_id
                    fixed_count += 1
            
            if fixed_count > 0:
                print(f"  Fixed {fixed_count} posts")
                db.session.commit()
            else:
                print(f"  All posts have correct user_id")
        
        # Check for orphaned posts (posts without valid connection)
        print("\n--- Checking for orphaned posts ---")
        all_posts = InstagramPost.query.all()
        valid_connection_ids = [c.id for c in connections]
        
        orphaned_count = 0
        for post in all_posts:
            if post.connection_id not in valid_connection_ids:
                print(f"  Found orphaned post: {post.instagram_post_id} (connection_id: {post.connection_id})")
                orphaned_count += 1
        
        if orphaned_count > 0:
            print(f"\nFound {orphaned_count} orphaned posts")
            response = input("Do you want to delete orphaned posts? (yes/no): ")
            if response.lower() == 'yes':
                for post in all_posts:
                    if post.connection_id not in valid_connection_ids:
                        db.session.delete(post)
                db.session.commit()
                print(f"Deleted {orphaned_count} orphaned posts")
        else:
            print("No orphaned posts found")
        
        # Summary
        print("\n" + "=" * 60)
        print("Summary:")
        print("=" * 60)
        
        for conn in connections:
            posts_count = InstagramPost.query.filter_by(
                connection_id=conn.id,
                user_id=conn.user_id
            ).count()
            print(f"  {conn.instagram_username}: {posts_count} posts")
        
        print("\n✅ Data fix complete!")
        print("=" * 60)

if __name__ == '__main__':
    fix_instagram_data()
