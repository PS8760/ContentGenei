"""
Test Pattern Recognition with current database data
"""
import sys
from app import create_app
from models import InstagramPost
from services.instagram_ml_service import InstagramMLService

app = create_app()

with app.app_context():
    # Get all posts
    posts = InstagramPost.query.order_by(InstagramPost.published_at.desc()).all()
    
    print(f"Found {len(posts)} posts in database\n")
    
    # Convert to dict format
    posts_data = []
    for p in posts:
        posts_data.append({
            'media_type': p.media_type,
            'caption': p.caption or '',
            'engagement_rate': p.engagement_rate or 0,
            'published_at': p.published_at,
            'like_count': p.like_count or 0,
            'comments_count': p.comments_count or 0
        })
        print(f"Post {p.instagram_post_id}: engagement={p.engagement_rate}%, caption_len={len(p.caption or '')}, published={p.published_at}")
    
    print(f"\n{'='*60}")
    print("Testing Pattern Recognition...")
    print('='*60)
    
    try:
        ml_service = InstagramMLService()
        result = ml_service.analyze_patterns(posts_data)
        
        if result.get('success'):
            print("\n✅ Pattern Recognition SUCCESS!\n")
            
            patterns = result.get('patterns', {})
            
            print("📝 Caption Length:")
            caption = patterns.get('caption_length', {})
            print(f"   Optimal: {caption.get('optimal_length')} characters")
            print(f"   Range: {caption.get('optimal_range')}")
            print(f"   Confidence: {caption.get('confidence')}")
            
            print("\n⏰ Posting Time:")
            time = patterns.get('posting_time', {})
            print(f"   Peak Time: {time.get('peak_time')}")
            print(f"   Peak Day: {time.get('peak_day')}")
            print(f"   Best Hours: {time.get('best_hours')}")
            print(f"   Confidence: {time.get('confidence')}")
            
            print("\n🎬 Format:")
            format_data = patterns.get('format', {})
            print(f"   Best Format: {format_data.get('best_format')}")
            print(f"   Avg Engagement: {format_data.get('avg_engagement')}%")
            print(f"   Confidence: {format_data.get('confidence')}")
            
        else:
            print(f"\n❌ Pattern Recognition FAILED")
            print(f"Error: {result.get('error')}")
            
    except Exception as e:
        print(f"\n❌ EXCEPTION OCCURRED")
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
