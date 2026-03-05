"""
Test script to diagnose sync endpoint issues
"""
import sys
import traceback

print("=" * 60)
print("Testing Instagram Sync Endpoint")
print("=" * 60)

try:
    print("\n1. Testing imports...")
    from app import create_app
    from models import db
    from platforms.instagram.instagram_model import InstagramPost, InstagramConnection
    print("   ✅ Imports successful")
    
    print("\n2. Creating app context...")
    app = create_app()
    print("   ✅ App created")
    
    with app.app_context():
        print("\n3. Testing database connection...")
        connection_count = InstagramConnection.query.count()
        post_count = InstagramPost.query.count()
        print(f"   ✅ Database connected")
        print(f"   - Connections: {connection_count}")
        print(f"   - Posts: {post_count}")
        
        print("\n4. Testing Instagram service...")
        from platforms.instagram.instagram_service import InstagramService
        instagram_service = InstagramService()
        print("   ✅ Instagram service initialized")
        
        print("\n5. Checking active connections...")
        active_connections = InstagramConnection.query.filter_by(is_active=True).all()
        print(f"   Found {len(active_connections)} active connections")
        
        for conn in active_connections:
            print(f"\n   Connection: {conn.instagram_username}")
            print(f"   - User ID: {conn.user_id}")
            print(f"   - Connection ID: {conn.id}")
            print(f"   - Account Type: {conn.instagram_account_type}")
            print(f"   - Token expires: {conn.token_expires_at}")
            
            # Check posts for this connection
            posts = InstagramPost.query.filter_by(
                connection_id=conn.id,
                user_id=conn.user_id
            ).count()
            print(f"   - Posts: {posts}")
        
        print("\n" + "=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
        
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    print("\nFull traceback:")
    traceback.print_exc()
    sys.exit(1)
