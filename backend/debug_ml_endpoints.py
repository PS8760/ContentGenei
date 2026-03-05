"""
Debug script to test ML endpoints
"""
import sys
sys.path.insert(0, '.')

from app import create_app
from models import db
from platforms.instagram.instagram_model import InstagramPost, InstagramConnection
from flask_jwt_extended import create_access_token

app = create_app()

with app.app_context():
    # Check posts
    posts = InstagramPost.query.all()
    print(f"\n{'='*60}")
    print(f"TOTAL POSTS IN DATABASE: {len(posts)}")
    print(f"{'='*60}\n")
    
    if posts:
        for i, post in enumerate(posts[:5], 1):
            print(f"Post {i}:")
            print(f"  ID: {post.id}")
            print(f"  User ID: {post.user_id}")
            print(f"  Connection ID: {post.connection_id}")
            print(f"  Media Type: {post.media_type}")
            print(f"  Caption: {(post.caption or '')[:50]}...")
            print(f"  Engagement Rate: {post.engagement_rate}")
            print(f"  Published At: {post.published_at}")
            print(f"  Published At Type: {type(post.published_at)}")
            print()
        
        # Check connections
        connections = InstagramConnection.query.all()
        print(f"\n{'='*60}")
        print(f"TOTAL CONNECTIONS: {len(connections)}")
        print(f"{'='*60}\n")
        
        for conn in connections:
            print(f"Connection:")
            print(f"  ID: {conn.id}")
            print(f"  User ID: {conn.user_id}")
            print(f"  Instagram User ID: {conn.instagram_user_id}")
            print(f"  Username: {conn.instagram_username}")
            print(f"  Is Active: {conn.is_active}")
            print()
            
            # Count posts for this connection
            conn_posts = InstagramPost.query.filter_by(
                connection_id=conn.id,
                user_id=conn.user_id
            ).all()
            print(f"  Posts for this connection: {len(conn_posts)}")
            print()
        
        # Test pattern analysis
        print(f"\n{'='*60}")
        print("TESTING PATTERN ANALYSIS")
        print(f"{'='*60}\n")
        
        from services.instagram_ml_service import InstagramMLService
        ml_service = InstagramMLService()
        
        # Convert posts to dict
        posts_data = []
        for post in posts:
            posts_data.append({
                'media_type': post.media_type,
                'caption': post.caption or '',
                'engagement_rate': post.engagement_rate or 0,
                'published_at': post.published_at,
                'like_count': post.like_count or 0,
                'comments_count': post.comments_count or 0
            })
        
        print(f"Analyzing {len(posts_data)} posts...")
        
        try:
            result = ml_service.analyze_patterns(posts_data)
            if result['success']:
                print("✅ Pattern analysis SUCCESS!")
                print(f"Optimal caption length: {result['patterns']['caption_length']['optimal_length']}")
                print(f"Best posting time: {result['patterns']['posting_time']['peak_time']}")
                print(f"Best format: {result['patterns']['format']['best_format']}")
            else:
                print(f"❌ Pattern analysis FAILED: {result.get('error')}")
        except Exception as e:
            print(f"❌ Exception during pattern analysis: {str(e)}")
            import traceback
            traceback.print_exc()
    else:
        print("No posts found in database!")
        print("\nPlease:")
        print("1. Make sure you're logged in")
        print("2. Connect your Instagram account")
        print("3. Click 'Sync Data' button")
