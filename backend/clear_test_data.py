"""
Clear test engagement data and reset posts to fetch fresh data from Instagram
"""
import sys
from app import create_app
from models import db, InstagramPost

app = create_app()

with app.app_context():
    # Get all posts
    posts = InstagramPost.query.all()
    
    print(f"Found {len(posts)} posts in database")
    print("\nClearing test engagement data...\n")
    
    for post in posts:
        print(f"Post {post.instagram_post_id}:")
        print(f"  Before: Likes={post.like_count}, Comments={post.comments_count}, Engagement={post.engagement_rate}%")
        
        # Reset to 0 so sync will fetch fresh data
        post.like_count = 0
        post.comments_count = 0
        post.engagement_rate = 0
        post.reach = 0
        post.impressions = 0
        post.saves_count = 0
        
        print(f"  After:  Likes=0, Comments=0, Engagement=0%")
        print()
    
    # Commit changes
    db.session.commit()
    
    print("✅ Test data cleared!")
    print("\n" + "="*60)
    print("NEXT STEPS:")
    print("="*60)
    print("1. Go to Instagram Analytics in the app")
    print("2. Click the 'Sync' button to fetch fresh data from Instagram")
    print("3. Wait for sync to complete")
    print("4. Refresh the page to see real Instagram data")
    print("="*60)
