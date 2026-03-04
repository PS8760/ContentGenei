#!/usr/bin/env python3
"""
Fix user_id mismatch in content items
This script checks if content items are using the wrong user_id and fixes them
"""

import sys
from app import create_app
from models import db, ContentItem, User

def fix_user_id_mismatch():
    """Fix user_id mismatch in content items"""
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("FIX USER_ID MISMATCH")
        print("=" * 60)
        
        # Get all users
        users = User.query.all()
        print(f"\n📊 Total Users: {len(users)}")
        
        # Get all content items
        all_content = ContentItem.query.all()
        print(f"📊 Total Content Items: {len(all_content)}")
        
        if len(all_content) == 0:
            print("\n⚠️  No content items found!")
            return
        
        print("\n" + "=" * 60)
        print("CHECKING USER_ID MISMATCHES")
        print("=" * 60)
        
        # Check what user_ids are in content
        unique_user_ids = set(item.user_id for item in all_content)
        print(f"\nUnique user_ids in content: {unique_user_ids}")
        
        # Check what user IDs exist
        user_ids = set(user.id for user in users)
        firebase_uids = set(user.firebase_uid for user in users)
        
        print(f"User IDs (user.id): {user_ids}")
        print(f"Firebase UIDs (user.firebase_uid): {firebase_uids}")
        
        # Find mismatches
        mismatches = []
        for item in all_content:
            if item.user_id not in user_ids and item.user_id not in firebase_uids:
                mismatches.append(item)
                print(f"\n⚠️  Content ID {item.id} has invalid user_id: {item.user_id}")
        
        if len(mismatches) > 0:
            print(f"\n❌ Found {len(mismatches)} items with invalid user_id")
            print("\nThese items cannot be matched to any user!")
            return
        
        # Check if content is using firebase_uid instead of user.id
        print("\n" + "=" * 60)
        print("CHECKING IF CONTENT USES FIREBASE_UID")
        print("=" * 60)
        
        fixes_needed = []
        for item in all_content:
            # Check if user_id is actually a firebase_uid
            if item.user_id in firebase_uids and item.user_id not in user_ids:
                # Find the user with this firebase_uid
                user = User.query.filter_by(firebase_uid=item.user_id).first()
                if user:
                    fixes_needed.append({
                        'item': item,
                        'current_user_id': item.user_id,
                        'correct_user_id': user.id,
                        'user_email': user.email
                    })
        
        if len(fixes_needed) == 0:
            print("\n✅ No fixes needed! All content items have correct user_id")
            
            # Show current mapping
            print("\n" + "=" * 60)
            print("CURRENT CONTENT DISTRIBUTION")
            print("=" * 60)
            for user in users:
                count = ContentItem.query.filter_by(user_id=user.id).count()
                print(f"\n👤 {user.email}")
                print(f"   User ID: {user.id}")
                print(f"   Firebase UID: {user.firebase_uid}")
                print(f"   Content Items: {count}")
            
            return
        
        print(f"\n⚠️  Found {len(fixes_needed)} items that need fixing")
        print("\nItems are using firebase_uid instead of user.id")
        
        # Show what will be fixed
        print("\n" + "=" * 60)
        print("FIXES TO BE APPLIED")
        print("=" * 60)
        
        for fix in fixes_needed:
            print(f"\nContent ID: {fix['item'].id}")
            print(f"  Title: {fix['item'].title[:50]}...")
            print(f"  Current user_id: {fix['current_user_id']} (firebase_uid)")
            print(f"  Correct user_id: {fix['correct_user_id']} (user.id)")
            print(f"  User: {fix['user_email']}")
        
        # Ask for confirmation
        print("\n" + "=" * 60)
        response = input(f"\nFix {len(fixes_needed)} items? (yes/no): ").strip().lower()
        
        if response != 'yes':
            print("\n❌ Cancelled. No changes made.")
            return
        
        # Apply fixes
        print("\n" + "=" * 60)
        print("APPLYING FIXES")
        print("=" * 60)
        
        fixed_count = 0
        for fix in fixes_needed:
            try:
                fix['item'].user_id = fix['correct_user_id']
                fixed_count += 1
                print(f"✅ Fixed content ID {fix['item'].id}")
            except Exception as e:
                print(f"❌ Error fixing content ID {fix['item'].id}: {e}")
        
        # Commit changes
        try:
            db.session.commit()
            print(f"\n✅ Successfully fixed {fixed_count} items!")
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error committing changes: {e}")
            return
        
        # Verify fixes
        print("\n" + "=" * 60)
        print("VERIFICATION")
        print("=" * 60)
        
        for user in users:
            count = ContentItem.query.filter_by(user_id=user.id).count()
            print(f"\n👤 {user.email}")
            print(f"   Content Items: {count}")
        
        print("\n" + "=" * 60)
        print("✅ FIX COMPLETE!")
        print("=" * 60)

if __name__ == '__main__':
    try:
        fix_user_id_mismatch()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
