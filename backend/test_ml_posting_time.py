"""
Test the ML posting time feature specifically
"""
import sqlite3
from datetime import datetime

# Get connection ID
conn = sqlite3.connect('instance/contentgenie_dev.db')
cursor = conn.cursor()

# Get active Instagram connection
cursor.execute("SELECT id, instagram_username FROM instagram_connections WHERE is_active=1 LIMIT 1")
connection = cursor.fetchone()

if not connection:
    print("❌ No active Instagram connection found")
    exit(1)

connection_id, username = connection
print(f"✓ Found connection: {username} ({connection_id})")

# Get posts for this connection
cursor.execute("""
    SELECT COUNT(*), 
           MIN(published_at), 
           MAX(published_at)
    FROM instagram_posts 
    WHERE connection_id = ?
""", (connection_id,))

post_count, min_date, max_date = cursor.fetchone()
print(f"✓ Posts found: {post_count}")
print(f"  Date range: {min_date} to {max_date}")

if post_count < 5:
    print(f"\n❌ Need at least 5 posts for ML analysis (have {post_count})")
    print("   Run sync to fetch more posts")
    exit(1)

# Get sample posts with times
cursor.execute("""
    SELECT published_at, engagement_rate, like_count, comments_count
    FROM instagram_posts 
    WHERE connection_id = ?
    ORDER BY published_at DESC
    LIMIT 10
""", (connection_id,))

print(f"\n📊 Sample Posts:")
print("-" * 80)
for row in cursor.fetchall():
    pub_date, eng_rate, likes, comments = row
    if pub_date:
        dt = datetime.fromisoformat(pub_date.replace('Z', '+00:00'))
        hour = dt.hour
        day = dt.strftime('%A')
        print(f"  {day} {hour:02d}:00 - Engagement: {eng_rate}% (Likes: {likes}, Comments: {comments})")

conn.close()

print("\n" + "=" * 80)
print("TESTING ML POSTING TIME ANALYSIS")
print("=" * 80)

# Now test the ML service directly
from services.instagram_ml_service import InstagramMLService
from models import InstagramPost, db
from app import create_app

app = create_app()

with app.app_context():
    # Get posts
    posts = InstagramPost.query.filter_by(connection_id=connection_id).all()
    
    print(f"\n✓ Loaded {len(posts)} posts from database")
    
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
    
    # Test ML service
    ml_service = InstagramMLService()
    
    print("\n1. Testing Pattern Analysis (includes posting time)...")
    print("-" * 80)
    patterns = ml_service.analyze_patterns(posts_data)
    
    if patterns.get('success'):
        posting_time = patterns['patterns']['posting_time']
        print(f"✓ Pattern Analysis Success!")
        print(f"  Peak Time: {posting_time['peak_time']}")
        print(f"  Peak Day: {posting_time['peak_day']}")
        print(f"  Best Hours: {posting_time['best_hours']}")
        print(f"  Best Days: {posting_time['best_days']}")
        print(f"  Confidence: {posting_time['confidence']}")
    else:
        print(f"✗ Pattern Analysis Failed: {patterns.get('error')}")
    
    print("\n2. Testing Optimal Posting Time Recommendation...")
    print("-" * 80)
    target_date = datetime.now()
    result = ml_service.recommend_optimal_posting_time(posts_data, target_date)
    
    if result.get('success'):
        print(f"✓ Optimal Timing Success!")
        print(f"  Target Date: {result['target_date']}")
        print(f"  Day of Week: {result['day_of_week']}")
        print(f"  Best Time: {result['best_time']}")
        print(f"  Confidence: {result['confidence']}")
        print(f"\n  Top 3 Recommendations:")
        for i, rec in enumerate(result['recommendations'][:3], 1):
            print(f"    {i}. {rec['time']} - Expected: {rec['expected_engagement']}% ({rec['confidence']} confidence)")
            print(f"       Reason: {rec['reason']}")
    else:
        print(f"✗ Optimal Timing Failed: {result.get('error')}")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
print("\nIf you see ✓ marks above, the ML posting time feature is working!")
print("If you see ✗ marks, check the error messages.")
