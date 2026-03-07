"""
Test the ML endpoint directly to see the exact error
"""
import sys
sys.path.insert(0, '.')

from app import create_app
from models import db, InstagramPost, InstagramConnection
from services.instagram_ml_service import InstagramMLService

app = create_app()

with app.app_context():
    print("=" * 80)
    print("TESTING ML SERVICE DIRECTLY")
    print("=" * 80)
    
    # Get connection
    connection = InstagramConnection.query.filter_by(is_active=True).first()
    if not connection:
        print("❌ No active Instagram connection found")
        sys.exit(1)
    
    print(f"✓ Found connection: {connection.instagram_username}")
    print(f"  Connection ID: {connection.id}")
    print(f"  User ID: {connection.user_id}")
    
    # Get posts
    posts = InstagramPost.query.filter_by(
        connection_id=connection.id,
        user_id=connection.user_id
    ).all()
    
    print(f"\n✓ Found {len(posts)} posts")
    
    if len(posts) < 5:
        print(f"❌ Need at least 5 posts (have {len(posts)})")
        sys.exit(1)
    
    # Show sample post data
    print("\nSample post data:")
    sample = posts[0]
    print(f"  Media Type: {sample.media_type}")
    print(f"  Caption: {sample.caption[:50] if sample.caption else 'None'}...")
    print(f"  Engagement Rate: {sample.engagement_rate}")
    print(f"  Published At: {sample.published_at}")
    print(f"  Published At Type: {type(sample.published_at)}")
    
    # Convert to dict format
    print("\n" + "=" * 80)
    print("CONVERTING POSTS TO DICT FORMAT")
    print("=" * 80)
    
    posts_data = []
    for p in posts:
        post_dict = {
            'media_type': p.media_type,
            'caption': p.caption or '',
            'engagement_rate': p.engagement_rate or 0,
            'published_at': p.published_at,
            'like_count': p.like_count or 0,
            'comments_count': p.comments_count or 0
        }
        posts_data.append(post_dict)
        print(f"✓ Post {p.instagram_post_id[:20]}... - Engagement: {p.engagement_rate}%, Time: {p.published_at}")
    
    # Test ML service
    print("\n" + "=" * 80)
    print("TESTING ML SERVICE")
    print("=" * 80)
    
    try:
        ml_service = InstagramMLService()
        print("✓ ML Service initialized")
        
        print("\nCalling analyze_patterns()...")
        result = ml_service.analyze_patterns(posts_data)
        
        print("\n✅ SUCCESS!")
        print("=" * 80)
        print("Result:")
        print(f"  Success: {result.get('success')}")
        
        if result.get('success'):
            patterns = result.get('patterns', {})
            posting_time = patterns.get('posting_time', {})
            
            print(f"\nPosting Time Analysis:")
            print(f"  Peak Time: {posting_time.get('peak_time')}")
            print(f"  Peak Day: {posting_time.get('peak_day')}")
            print(f"  Best Hours: {posting_time.get('best_hours')}")
            print(f"  Confidence: {posting_time.get('confidence')}")
            
            caption_length = patterns.get('caption_length', {})
            print(f"\nCaption Length Analysis:")
            print(f"  Optimal Length: {caption_length.get('optimal_length')}")
            print(f"  Confidence: {caption_length.get('confidence')}")
            
            format_analysis = patterns.get('format', {})
            print(f"\nFormat Analysis:")
            print(f"  Best Format: {format_analysis.get('best_format')}")
            print(f"  Avg Engagement: {format_analysis.get('avg_engagement')}")
        else:
            print(f"  Error: {result.get('error')}")
        
    except Exception as e:
        print("\n❌ ERROR!")
        print("=" * 80)
        print(f"Error: {str(e)}")
        print("\nFull traceback:")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE - ML SERVICE IS WORKING!")
    print("=" * 80)
