#!/usr/bin/env python3
"""
Test script to verify notification system is working correctly.
This script tests the notification creation and retrieval flow.
"""

import sys
from services.mongodb_service import mongodb_service

def test_notification_system():
    """Test the notification system"""
    print("🧪 Testing Notification System\n")
    
    # Test user ID (use a test Firebase UID)
    test_user_id = "test_user_123"
    
    print("1️⃣ Creating test notification...")
    try:
        notification = mongodb_service.create_notification(
            user_id=test_user_id,
            notification_type='team_invite',
            title='Test Notification',
            message='This is a test notification',
            link='/team',
            metadata={'test': True}
        )
        print(f"   ✅ Notification created: {notification['_id']}")
    except Exception as e:
        print(f"   ❌ Error creating notification: {e}")
        return False
    
    print("\n2️⃣ Retrieving notifications...")
    try:
        notifications = mongodb_service.get_notifications(test_user_id)
        print(f"   ✅ Found {len(notifications)} notification(s)")
        if notifications:
            print(f"   📋 Latest: {notifications[0]['title']}")
    except Exception as e:
        print(f"   ❌ Error retrieving notifications: {e}")
        return False
    
    print("\n3️⃣ Getting unread count...")
    try:
        count = mongodb_service.get_unread_notification_count(test_user_id)
        print(f"   ✅ Unread count: {count}")
    except Exception as e:
        print(f"   ❌ Error getting unread count: {e}")
        return False
    
    print("\n4️⃣ Marking notification as read...")
    try:
        if notifications:
            mongodb_service.mark_notification_read(test_user_id, str(notifications[0]['_id']))
            print(f"   ✅ Notification marked as read")
            
            # Verify count decreased
            new_count = mongodb_service.get_unread_notification_count(test_user_id)
            print(f"   ✅ New unread count: {new_count}")
    except Exception as e:
        print(f"   ❌ Error marking as read: {e}")
        return False
    
    print("\n5️⃣ Cleaning up test data...")
    try:
        mongodb_service.clear_all_notifications(test_user_id)
        print(f"   ✅ Test notifications cleared")
    except Exception as e:
        print(f"   ❌ Error clearing notifications: {e}")
        return False
    
    print("\n✅ All notification tests passed!")
    return True

if __name__ == '__main__':
    try:
        success = test_notification_system()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        sys.exit(1)
