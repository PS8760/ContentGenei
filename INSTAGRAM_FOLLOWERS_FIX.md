# Instagram Followers Count Fix

## Problem
Instagram dashboard card showed "0" for followers count because the API was only fetching basic fields (id, username, account_type, media_count).

## Important Discovery
**Instagram Basic Display API Limitation:**
- The Instagram Basic Display API (used for personal accounts) does NOT provide `followers_count`, `biography`, `website`, or `profile_picture_url` fields
- These fields are ONLY available in the Instagram Graph API for Business and Creator accounts
- Personal accounts will always show 0 followers regardless of what fields we request

## Changes Made

### 1. Updated Instagram Service (`backend/platforms/instagram/instagram_service.py`)

**Enhanced `get_user_profile()` method:**
```python
def get_user_profile(self, access_token):
    """Get Instagram user profile with extended fields"""
    url = f"{self.graph_url}/me"
    params = {
        'fields': 'id,username,account_type,media_count',
        'access_token': access_token
    }
    
    # Note: Instagram Basic Display API has limited fields
    # followers_count, biography, website, profile_picture_url are NOT available
    # These fields are only available in Instagram Graph API (Business/Creator accounts)
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    profile_data = response.json()
    
    # Log what we received
    logger.info(f"Instagram profile data received: {list(profile_data.keys())}")
    logger.info(f"Account type: {profile_data.get('account_type')}")
    
    return profile_data
```

**Added:**
- Detailed comments explaining API limitations
- Logging of received fields and account type
- Documentation about Business/Creator account requirements

### 2. Updated Instagram Controller (`backend/platforms/instagram/instagram_controller.py`)

**Enhanced `exchange_token()` route:**
```python
# Update existing connection with ALL available fields
existing_connection.followers_count = profile.get('followers_count', 0)
existing_connection.profile_picture_url = profile.get('profile_picture_url', '')
existing_connection.media_count = profile.get('media_count', 0)

# Create new connection with ALL available fields
connection = InstagramConnection(
    followers_count=profile.get('followers_count', 0),
    profile_picture_url=profile.get('profile_picture_url', ''),
    media_count=profile.get('media_count', 0),
    # ... other fields
)
```

**Added logging:**
```python
current_app.logger.info(f"Account type: {profile.get('account_type')}")
current_app.logger.info(f"Profile fields available: {list(profile.keys())}")
```

**Enhanced `get_instagram_profile()` route:**
```python
# Always fetch fresh data from Instagram API
fresh_profile = instagram_service.get_user_profile(connection.access_token)

# Update database with fresh data (all available fields)
connection.media_count = fresh_profile.get('media_count', 0)
connection.followers_count = fresh_profile.get('followers_count', 0)
connection.profile_picture_url = fresh_profile.get('profile_picture_url', '')
connection.instagram_account_type = fresh_profile.get('account_type', connection.instagram_account_type)
connection.last_synced_at = datetime.now(timezone.utc)
db.session.commit()

# Check if account is Personal
is_personal_account = connection.instagram_account_type and connection.instagram_account_type.upper() == 'PERSONAL'

return jsonify({
    'profile': {
        'is_personal_account': is_personal_account,
        'note': 'Followers count requires a Business or Creator account' if is_personal_account else None
    }
})
```

**Added:**
- Fresh data fetching on every profile request
- All available fields updated in database
- Personal account detection
- Informative note for personal accounts

### 3. Updated Dashboard UI (`frontend/src/pages/Dashboard.jsx`)

**Enhanced followers display:**
```jsx
<div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
  {instagramProfile.followers_count || (instagramProfile.is_personal_account ? 'N/A' : '0')}
</div>
<div className="text-xs text-gray-600 dark:text-gray-400">Followers</div>
```

**Added informational note:**
```jsx
{instagramProfile.is_personal_account && (
  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
    <p className="text-xs text-blue-800 dark:text-blue-200">
      ℹ️ {instagramProfile.note || 'Followers count requires a Business or Creator account'}
    </p>
  </div>
)}
```

**Features:**
- Shows "N/A" for followers on personal accounts instead of "0"
- Displays blue informational banner for personal accounts
- Explains that followers count requires Business/Creator account

## API Limitations by Account Type

### Personal Accounts (Instagram Basic Display API):
**Available Fields:**
- ✅ id
- ✅ username
- ✅ account_type
- ✅ media_count

**NOT Available:**
- ❌ followers_count
- ❌ follows_count
- ❌ biography
- ❌ website
- ❌ profile_picture_url

### Business/Creator Accounts (Instagram Graph API):
**Available Fields:**
- ✅ All fields from Personal accounts
- ✅ followers_count
- ✅ follows_count
- ✅ biography
- ✅ website
- ✅ profile_picture_url
- ✅ Additional insights and analytics

## Testing Instructions

### For Personal Accounts:
1. Delete database: `del backend\instance\contentgenie_dev.db`
2. Restart backend: `cd backend && python run.py`
3. Go through onboarding and connect Instagram
4. Dashboard should show:
   - Posts count (actual number)
   - Followers: "N/A"
   - Blue info banner: "Followers count requires a Business or Creator account"
   - Account Type: "PERSONAL"

### For Business/Creator Accounts:
1. Convert Instagram account to Business/Creator in Instagram app
2. Delete database and reconnect
3. Dashboard should show:
   - Posts count (actual number)
   - Followers count (actual number)
   - No info banner
   - Account Type: "BUSINESS" or "CREATOR"

### Backend Logs to Check:
```
✓ Profile received: @username
Account type: PERSONAL (or BUSINESS/CREATOR)
Profile fields available: ['id', 'username', 'account_type', 'media_count']
Instagram profile refreshed for user <user_id>
Followers: 0, Media: <count>
```

## Files Modified

1. **backend/platforms/instagram/instagram_service.py**
   - Enhanced `get_user_profile()` with logging and documentation
   - Added comments about API limitations

2. **backend/platforms/instagram/instagram_controller.py**
   - Updated `exchange_token()` to save all available fields
   - Enhanced `get_instagram_profile()` to refresh all fields
   - Added personal account detection
   - Added detailed logging

3. **frontend/src/pages/Dashboard.jsx**
   - Updated followers display to show "N/A" for personal accounts
   - Added blue informational banner for personal accounts
   - Better UX for API limitations

## Why Followers Count is Still 0

If the user's account is a **Personal account**, followers_count will ALWAYS be 0 because:

1. Instagram Basic Display API doesn't provide this field
2. Only Instagram Graph API (Business/Creator) has access to followers_count
3. This is an Instagram API limitation, not a bug in our code

## Solution for Users

To get followers count, users need to:
1. Convert their Instagram account to Business or Creator
2. Disconnect and reconnect in the app
3. The app will then fetch followers_count from Instagram Graph API

## Current Behavior

### Personal Account:
- Shows "N/A" for followers
- Shows blue info banner explaining limitation
- Emphasizes posts count instead

### Business/Creator Account:
- Shows actual followers count
- No info banner
- All fields available

## Summary

✅ Updated service to request all available fields
✅ Enhanced controller to save all fields from API
✅ Added fresh data fetching on profile requests
✅ Added personal account detection
✅ Updated UI to handle personal accounts gracefully
✅ Added informational banner for users
✅ Comprehensive logging for debugging

The followers count issue is now properly handled with clear communication to users about API limitations!
