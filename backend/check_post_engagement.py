import sqlite3

conn = sqlite3.connect('instance/contentgenie_dev.db')
cursor = conn.cursor()

cursor.execute("""
    SELECT instagram_post_id, like_count, comments_count, engagement_rate, published_at 
    FROM instagram_posts 
    ORDER BY published_at DESC 
    LIMIT 10
""")

print("Recent Instagram Posts:")
print("=" * 100)
print(f"{'Post ID':<25} {'Likes':<8} {'Comments':<10} {'Engagement':<12} {'Published':<20}")
print("-" * 100)

for row in cursor.fetchall():
    post_id, likes, comments, eng_rate, pub_date = row
    print(f"{post_id[:24]:<25} {likes:<8} {comments:<10} {eng_rate:<12} {pub_date:<20}")

print("\n" + "=" * 100)
print("DIAGNOSIS:")
print("=" * 100)

cursor.execute("SELECT COUNT(*) FROM instagram_posts WHERE engagement_rate > 0")
posts_with_engagement = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM instagram_posts")
total_posts = cursor.fetchone()[0]

print(f"Total posts: {total_posts}")
print(f"Posts with engagement > 0: {posts_with_engagement}")
print(f"Posts with 0 engagement: {total_posts - posts_with_engagement}")

if posts_with_engagement < 5:
    print("\n❌ PROBLEM FOUND: Not enough posts with engagement data!")
    print("   The ML posting time feature needs at least 5 posts with likes/comments.")
    print("\n💡 SOLUTION:")
    print("   1. Go to Instagram Analytics page")
    print("   2. Click 'Sync Data' button")
    print("   3. Wait for sync to complete")
    print("   4. The sync should fetch engagement metrics (likes, comments)")
    print("   5. Then try the ML Insights tab again")
else:
    print(f"\n✓ Good! You have {posts_with_engagement} posts with engagement data.")
    print("   The ML posting time feature should work.")

conn.close()
