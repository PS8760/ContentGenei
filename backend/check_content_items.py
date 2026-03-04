#!/usr/bin/env python3
"""
Diagnostic script to check content items in the database
"""

import sys
from app import create_app
from models import db, ContentItem, User

def check_content_items():
    """Check all content items in database"""
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("CONTENT ITEMS DIAGNOSTIC")
        print("=" * 60)
        
        # Get all users
        users = User.query.all()
        print(f"\n📊 Total Users: {len(users)}")
        
        for user in users:
            print(f"\n👤 User: {user.email} (ID: {user.id}, Firebase UID: {user.firebase_uid})")
            
            # Get content for this user by ID
            content_by_id = ContentItem.query.filter_by(user_id=user.id).all()
            print(f"   📝 Content Items (by user.id): {len(content_by_id)}")
            
            # Get content for this user by firebase_uid
            content_by_firebase = ContentItem.query.filter_by(user_id=user.firebase_uid).all()
            print(f"   📝 Content Items (by firebase_uid): {len(content_by_firebase)}")
            
            content_items = content_by_id if len(content_by_id) > 0 else content_by_firebase
            
            if content_items:
                print(f"\n   Content Details:")
                for idx, item in enumerate(content_items, 1):
                    print(f"   {idx}. ID: {item.id}")
                    print(f"      Title: {item.title[:50]}...")
                    print(f"      Type: {item.content_type}")
                    print(f"      Status: {item.status}")
                    print(f"      Word Count: {item.word_count}")
                    print(f"      Created: {item.created_at}")
                    print()
        
        # Overall stats
        total_content = ContentItem.query.count()
        print("=" * 60)
        print(f"📊 TOTAL CONTENT ITEMS IN DATABASE: {total_content}")
        print("=" * 60)
        
        # Content by type
        print("\n📈 Content by Type:")
        types = db.session.query(
            ContentItem.content_type,
            db.func.count(ContentItem.id).label('count')
        ).group_by(ContentItem.content_type).all()
        
        for content_type, count in types:
            print(f"   {content_type}: {count}")
        
        # Content by status
        print("\n📊 Content by Status:")
        statuses = db.session.query(
            ContentItem.status,
            db.func.count(ContentItem.id).label('count')
        ).group_by(ContentItem.status).all()
        
        for status, count in statuses:
            print(f"   {status}: {count}")
        
        print("\n" + "=" * 60)
        
        # Check if there are any issues
        if total_content == 0:
            print("⚠️  WARNING: No content items found in database!")
            print("   This could mean:")
            print("   1. No content has been generated yet")
            print("   2. Content generation is not saving to database")
            print("   3. Database connection issue")
        elif total_content < 12:
            print(f"⚠️  WARNING: Only {total_content} items found (expected 12)")
            print("   Some content may not have been saved properly")
        else:
            print(f"✅ Found {total_content} content items")
        
        print("=" * 60)

if __name__ == '__main__':
    try:
        check_content_items()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
