"""
Add test engagement data to existing posts for ML testing
WARNING: This adds FAKE data for testing only!
"""
import sqlite3
import random
from datetime import datetime, timedelta

conn = sqlite3.connect('instance/contentgenie_dev.db')
cursor = conn.cursor()

# Get posts with 0 engagement
cursor.execute("""
    SELECT id, instagram_post_id, published_at
    FROM instagram_posts
    WHERE engagement_rate = 0 OR engagement_rate IS NULL
""")

posts = cursor.fetchall()

if not posts:
    print("No posts need test data")
    exit(0)

print(f"Found {len(posts)} posts with 0 engagement")
print("Adding test engagement data...")
print("-" * 80)

for post_id, insta_id, pub_date in posts:
    # Generate random but realistic engagement
    likes = random.randint(50, 500)
    comments = random.randint(5, 50)
    reach = random.randint(likes, likes * 3)
    impressions = random.randint(reach, reach * 2)
    saves = random.randint(5, 30)
    
    # Calculate engagement rate (assuming 1000 followers)
    engagement_rate = ((likes + comments) / 1000) * 100
    
    cursor.execute("""
        UPDATE instagram_posts
        SET like_count = ?,
            comments_count = ?,
            reach = ?,
            impressions = ?,
            saves_count = ?,
            engagement_rate = ?
        WHERE id = ?
    """, (likes, comments, reach, impressions, saves, engagement_rate, post_id))
    
    print(f"✓ Post {insta_id[:20]}... - Likes: {likes}, Comments: {comments}, Engagement: {engagement_rate:.2f}%")

conn.commit()
conn.close()

print("-" * 80)
print(f"✅ Added test engagement data to {len(posts)} posts!")
print("\nNow you can test the ML Insights features:")
print("1. Go to Instagram Analytics")
print("2. Click 'ML Insights' tab")
print("3. Click 'Analyze Patterns' - should show optimal posting times")
print("4. Select a date and click 'Get Best Times' - should show recommendations")
print("\n⚠️  Remember: This is FAKE data for testing only!")
