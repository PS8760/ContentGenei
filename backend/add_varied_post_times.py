"""
Add varied posting times and engagement to posts for ML testing
This makes the ML insights more realistic
"""
import sqlite3
import random
from datetime import datetime, timedelta

conn = sqlite3.connect('instance/contentgenie_dev.db')
cursor = conn.cursor()

# Get all posts
cursor.execute("""
    SELECT id, instagram_post_id, published_at
    FROM instagram_posts
    ORDER BY published_at DESC
""")

posts = cursor.fetchall()

if len(posts) < 5:
    print(f"Need at least 5 posts (have {len(posts)})")
    exit(1)

print(f"Updating {len(posts)} posts with varied times and engagement...")
print("=" * 100)

# Define varied posting times and engagement patterns
# Morning posts (6-10 AM) - moderate engagement
# Afternoon posts (12-3 PM) - lower engagement  
# Evening posts (6-9 PM) - highest engagement
# Night posts (10 PM-12 AM) - moderate engagement

time_patterns = [
    {'hour': 8, 'day_offset': -6, 'likes_range': (80, 150), 'comments_range': (8, 15)},   # Monday morning
    {'hour': 14, 'day_offset': -5, 'likes_range': (50, 90), 'comments_range': (5, 10)},   # Tuesday afternoon
    {'hour': 19, 'day_offset': -4, 'likes_range': (200, 350), 'comments_range': (20, 35)}, # Wednesday evening (best)
    {'hour': 22, 'day_offset': -3, 'likes_range': (100, 180), 'comments_range': (10, 20)}, # Thursday night
    {'hour': 12, 'day_offset': -2, 'likes_range': (60, 100), 'comments_range': (6, 12)},   # Friday noon
    {'hour': 18, 'day_offset': -1, 'likes_range': (180, 300), 'comments_range': (18, 30)}, # Saturday evening
    {'hour': 9, 'day_offset': 0, 'likes_range': (90, 160), 'comments_range': (9, 16)},     # Sunday morning
]

base_date = datetime.now()

for i, (post_id, insta_id, pub_date) in enumerate(posts):
    if i >= len(time_patterns):
        pattern = random.choice(time_patterns)
    else:
        pattern = time_patterns[i]
    
    # Calculate new publish date
    new_date = base_date + timedelta(days=pattern['day_offset'])
    new_date = new_date.replace(hour=pattern['hour'], minute=random.randint(0, 59), second=0)
    
    # Generate engagement based on time pattern
    likes = random.randint(*pattern['likes_range'])
    comments = random.randint(*pattern['comments_range'])
    reach = random.randint(likes * 2, likes * 4)
    impressions = random.randint(reach, reach * 2)
    saves = random.randint(likes // 10, likes // 5)
    
    # Calculate engagement rate (assuming 1000 followers)
    engagement_rate = ((likes + comments) / 1000) * 100
    
    # Update post
    cursor.execute("""
        UPDATE instagram_posts
        SET published_at = ?,
            like_count = ?,
            comments_count = ?,
            reach = ?,
            impressions = ?,
            saves_count = ?,
            engagement_rate = ?
        WHERE id = ?
    """, (new_date.isoformat(), likes, comments, reach, impressions, saves, engagement_rate, post_id))
    
    day_name = new_date.strftime('%A')
    print(f"✓ {day_name} {pattern['hour']:02d}:00 - Likes: {likes:3d}, Comments: {comments:2d}, Engagement: {engagement_rate:5.2f}%")

conn.commit()
conn.close()

print("=" * 100)
print("✅ Posts updated with varied times and engagement!")
print("\nPattern created:")
print("  📈 Best time: Wednesday/Saturday evenings (6-7 PM) - High engagement")
print("  📊 Good time: Monday/Sunday mornings (8-9 AM) - Moderate engagement")
print("  📉 Lower time: Tuesday/Friday afternoons (12-2 PM) - Lower engagement")
print("\nNow test ML Insights:")
print("  1. Go to Instagram Analytics")
print("  2. Click 'ML Insights' tab")
print("  3. Click 'Analyze Patterns' - should show Wednesday 19:00 as peak time")
print("  4. Select a date and click 'Get Best Times' - should recommend evening times")
