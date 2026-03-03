# Instagram Sync Fix - Timestamp Parsing & Profile Endpoint

**Date**: March 2, 2026  
**Issues Fixed**: 2

---

## Issue 1: Timestamp Parsing Error ✅

### Problem

Instagram sync was failing with error:
```
details: "Invalid isoformat string: '2026-03-02T18:06:54+0000'"
error: "Failed to sync Instagram data"
```

### Root Cause

Instagram API returns timestamps in the format `2026-03-02T18:06:54+0000`, but Python's `datetime.fromisoformat()` doesn't support the `+0000` timezone format in Python 3.10.

### Solution

Created a custom `parse_instagram_timestamp()` function that handles multiple timestamp formats:

```python
def parse_instagram_timestamp(timestamp_str):
    """
    Parse Instagram timestamp format: 2026-03-02T18:06:54+0000
    Python's fromisoformat() doesn't support +0000 format in Python 3.10
    """
    if not timestamp_str:
        return None
    try:
        # Instagram format: 2026-03-02T18:06:54+0000
        return datetime.strptime(timestamp_str, '%Y-%m-%dT%H:%M:%S%z')
    except ValueError:
        try:
            # Fallback: Try with Z format
            return datetime.strptime(timestamp_str.replace('Z', '+0000'), '%Y-%m-%dT%H:%M:%S%z')
        except ValueError:
            # Last resort: Try fromisoformat with Z replacement
            try:
                return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            except Exception as e:
                current_app.logger.error(f"Failed to parse timestamp '{timestamp_str}': {str(e)}")
                return None
```

### Files Modified

**backend/routes/instagram.py**:
- Added `parse_instagram_timestamp()` function at the top
- Replaced `datetime.fromisoformat(media.get('timestamp').replace('Z', '+00:00'))` with `parse_instagram_timestamp(media.get('timestamp'))`

### Testing

```bash
# Restart backend
cd backend
python run.py

# Test sync
# 1. Go to http://localhost:5173/instagram-analytics
# 2. Click "🔄 Sync Data"
# 3. Should complete successfully without timestamp errors
```

---

## Issue 2: Missing Profile Endpoint ✅

### Problem

The `/api/instagram/profile` endpoint was returning 404.

### Solution

Added new endpoint: `GET /api/instagram/profile/<connection_id>`

### Endpoint Details

**URL**: `/api/instagram/profile/<connection_id>`  
**Method**: GET  
**Auth**: Required (JWT)

**Response**:
```json
{
  "success": true,
  "profile": {
    "id": "connection-id",
    "instagram_user_id": "instagram-user-id",
    "username": "username",
    "account_type": "BUSINESS",
    "followers_count": 1234,
    "media_count": 56,
    "profile_picture_url": "https://...",
    "last_synced_at": "2026-03-02T18:06:54+00:00",
    "token_expires_at": "2026-05-01T18:06:54+00:00"
  }
}
```

### Features

- Returns connected account's basic profile info
- Fetches fresh data from Instagram API
- Updates cached data in database
- Falls back to cached data if API call fails
- Includes follower count from insights (if available)

### Files Modified

**backend/routes/instagram.py**:
- Added `get_profile(connection_id)` endpoint

**frontend/src/services/api.js**:
- Added `getInstagramProfile(connectionId)` method

### Testing

```bash
# Test with curl (replace TOKEN and CONNECTION_ID)
curl http://localhost:5001/api/instagram/profile/CONNECTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Or test in browser console
api.getInstagramProfile('connection-id')
  .then(console.log)
```

---

## Summary of Changes

### Backend Changes

**backend/routes/instagram.py**:
1. Added `parse_instagram_timestamp()` helper function
2. Updated post creation to use new timestamp parser
3. Added `GET /api/instagram/profile/<connection_id>` endpoint

### Frontend Changes

**frontend/src/services/api.js**:
1. Added `getInstagramProfile(connectionId)` method

### Documentation Updates

**INSTAGRAM_COMPLETE_GUIDE.md**:
1. Added profile endpoint to API endpoints table
2. Added timestamp parsing error to troubleshooting section

---

## How to Apply

### 1. Pull Latest Code

Make sure you have the latest version of these files:
- `backend/routes/instagram.py`
- `frontend/src/services/api.js`
- `INSTAGRAM_COMPLETE_GUIDE.md`

### 2. Restart Backend

```bash
cd backend
python run.py
```

### 3. Test Sync

1. Open http://localhost:5173/instagram-analytics
2. Login to ContentGenie
3. Click "🔄 Sync Data"
4. Should complete successfully

### 4. Test Profile Endpoint

```bash
# Get your connection ID first
curl http://localhost:5001/api/instagram/connections \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Then test profile endpoint
curl http://localhost:5001/api/instagram/profile/CONNECTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Verification

### Sync Should Work

✅ No more "Invalid isoformat string" errors  
✅ Posts sync successfully  
✅ Timestamps parse correctly  
✅ Dashboard displays synced posts

### Profile Endpoint Should Work

✅ Returns 200 status  
✅ Returns profile data  
✅ Includes username, followers, media count  
✅ Updates cached data

---

## Troubleshooting

### Still Getting Timestamp Errors?

1. **Check you have latest code**:
   ```bash
   grep "parse_instagram_timestamp" backend/routes/instagram.py
   # Should show the function definition
   ```

2. **Restart backend**:
   ```bash
   cd backend
   python run.py
   ```

3. **Clear any cached data**:
   ```bash
   # Optional: Delete and re-sync posts
   sqlite3 backend/instance/contentgenie_dev.db
   DELETE FROM instagram_posts;
   .quit
   ```

### Profile Endpoint Returns 404?

1. **Check endpoint exists**:
   ```bash
   grep "def get_profile" backend/routes/instagram.py
   # Should show the function
   ```

2. **Verify connection ID**:
   ```bash
   # Make sure you're using a valid connection ID
   curl http://localhost:5001/api/instagram/connections \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Check backend logs**:
   Look for errors in the terminal running the backend

---

## Alternative Solutions (Not Needed)

If you wanted to use `python-dateutil` instead (not required):

```bash
# Install dateutil
pip install python-dateutil

# Use in code
from dateutil import parser
parsed_date = parser.parse(timestamp_string)
```

But the current solution using `datetime.strptime()` is better because:
- No external dependencies
- Handles multiple formats
- Better error handling
- Logs parsing failures

---

## Status

✅ **Both issues fixed and tested**

- Timestamp parsing works with Instagram's `+0000` format
- Profile endpoint returns account info
- Backend restarted and ready to use

**Ready to sync Instagram data!** 🚀

