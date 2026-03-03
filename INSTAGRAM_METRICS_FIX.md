# Instagram Metrics Fix - Enhanced Logging & Debugging

**Date**: March 2, 2026  
**Issue**: Engagement metrics showing as 0  
**Status**: Enhanced logging and debugging tools added ✅

---

## Changes Made

### 1. Enhanced Sync Logging ✅

**File**: `backend/routes/instagram.py`

**Added**:
- Detailed logging at each step of sync process
- Log media data received from Instagram API
- Log insights data for each post
- Log final values being saved to database
- Count posts with/without insights
- Better error messages

**New Logs**:
```
INFO - Starting sync for connection {id}, user {user_id}
INFO - Fetching media for user {user_id}
INFO - Fetched {count} media items
INFO - Media {id}: likes={count}, comments={count}
INFO - Media {id} insights: [{data}]
INFO - Media {id} final: likes=..., comments=..., reach=..., impressions=..., saves=...
INFO - Sync complete: {total} posts, {with_insights} with insights, {without_insights} without insights
```

### 2. Enhanced Instagram Service Logging ✅

**File**: `backend/services/instagram_service.py`

**Added**:
- Log API URLs and parameters
- Log sample media data
- Log insights data with values
- Better error handling for insights API
- Detect permission issues (403 errors)
- Detect unsupported media types (400 errors)

**New Logs**:
```
INFO - Fetching media from: https://graph.instagram.com/...
INFO - Fields requested: id,caption,media_type,timestamp,like_count,comments_count
INFO - Received {count} media items
INFO - Sample media: id={id}, like_count={count}, comments_count={count}
INFO - Fetching insights for media {id}
INFO - Received {count} insights for media {id}
INFO -   impressions: {value}
INFO -   reach: {value}
INFO -   saved: {value}
WARNING - Could not fetch insights for media {id}: 403
WARNING - Insights require instagram_manage_insights permission
```

### 3. New Debug Endpoint ✅

**Endpoint**: `GET /api/instagram/debug-media/<connection_id>`

**Purpose**: See raw data from Instagram API

**Response**:
```json
{
  "success": true,
  "connection": {
    "id": "...",
    "username": "...",
    "account_type": "BUSINESS",
    "followers": 1234
  },
  "media_count": 5,
  "media_sample": [
    {
      "id": "123456789",
      "caption": "My post",
      "like_count": 150,
      "comments_count": 12,
      "media_type": "IMAGE",
      "timestamp": "2026-03-02T18:06:54+0000"
    }
  ],
  "insights_sample": {
    "data": [
      {"name": "impressions", "values": [{"value": 1250}]},
      {"name": "reach", "values": [{"value": 980}]},
      {"name": "saved", "values": [{"value": 15}]}
    ]
  },
  "note": "Check if like_count and comments_count are present in media_sample"
}
```

**Frontend Method**:
```javascript
const debug = await api.debugInstagramMedia(connectionId)
console.log('Media sample:', debug.media_sample)
console.log('Insights sample:', debug.insights_sample)
```

### 4. Enhanced Sync Response ✅

**New Response Fields**:
```json
{
  "success": true,
  "synced_posts": 30,
  "posts_with_insights": 25,
  "posts_without_insights": 5,
  "message": "Synced 30 posts successfully"
}
```

Shows how many posts have insights vs. don't have insights.

---

## How to Use

### Step 1: Restart Backend

```bash
cd backend
python run.py
```

You'll now see detailed logs in the terminal.

### Step 2: Test Debug Endpoint

```bash
# Get connection ID
curl http://localhost:5001/api/instagram/connections \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Debug media data
curl http://localhost:5001/api/instagram/debug-media/CONNECTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq
```

**What to check**:
- `media_sample`: Should have `like_count` and `comments_count`
- `insights_sample`: Should have `impressions`, `reach`, `saved`
- If missing, see troubleshooting below

### Step 3: Sync Data and Watch Logs

```bash
# In terminal 1: Backend running with logs visible
cd backend
python run.py

# In terminal 2: Trigger sync
curl -X POST http://localhost:5001/api/instagram/sync/CONNECTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Watch terminal 1 for detailed logs
```

**Look for**:
- "Sample media: id=..., like_count=..., comments_count=..."
- "Received X insights for media Y"
- "Sync complete: X posts, Y with insights, Z without insights"

---

## Troubleshooting

### Issue: like_count and comments_count are 0

**Check Debug Endpoint**:
```bash
curl http://localhost:5001/api/instagram/debug-media/CONNECTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**If media_sample shows 0 for like_count**:
- Instagram API is not returning the data
- **Cause**: Personal Instagram account (not Business/Creator)
- **Solution**: Convert to Business account

**If media_sample shows correct values but database has 0**:
- Data not being saved correctly
- **Solution**: Check backend logs for errors

### Issue: reach and impressions are 0

**Check Backend Logs**:
Look for:
```
WARNING - Could not fetch insights for media {id}: 403
WARNING - Insights require instagram_manage_insights permission
```

**Solution**:
1. Add `instagram_manage_insights` to scopes in `.env`
2. Reconnect Instagram account
3. Re-sync data

### Issue: All metrics are 0

**Possible Causes**:
1. Personal Instagram account (not Business/Creator)
2. Missing permissions
3. API error

**Debug Steps**:
1. Check account type: Should be "BUSINESS" or "CREATOR"
2. Check debug endpoint: See raw API data
3. Check backend logs: Look for errors
4. Test API directly: Use curl to test Instagram API

---

## Files Modified

1. ✅ `backend/routes/instagram.py`
   - Enhanced sync logging
   - Added debug endpoint
   - Better error handling

2. ✅ `backend/services/instagram_service.py`
   - Enhanced API call logging
   - Better error messages
   - Permission detection

3. ✅ `frontend/src/services/api.js`
   - Added `debugInstagramMedia()` method

4. ✅ `INSTAGRAM_METRICS_DEBUG.md`
   - Complete debugging guide

5. ✅ `INSTAGRAM_METRICS_FIX.md`
   - This file

---

## API Fields Being Requested

### Media Endpoint

```
GET https://graph.instagram.com/{user_id}/media
  ?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count
  &access_token={token}
```

**Fields**:
- ✅ `id` - Post ID
- ✅ `caption` - Post caption
- ✅ `media_type` - IMAGE, VIDEO, CAROUSEL_ALBUM
- ✅ `media_url` - Media URL
- ✅ `permalink` - Post URL
- ✅ `timestamp` - Published date
- ✅ `like_count` - Number of likes
- ✅ `comments_count` - Number of comments

### Insights Endpoint

```
GET https://graph.instagram.com/{media_id}/insights
  ?metric=impressions,reach,saved
  &access_token={token}
```

**Metrics**:
- ✅ `impressions` - Total impressions
- ✅ `reach` - Unique reach
- ✅ `saved` - Number of saves

---

## Expected Behavior

### With instagram_business_basic Only

After sync:
- ✅ `like_count`: Shows actual likes
- ✅ `comments_count`: Shows actual comments
- ❌ `reach`: 0 (requires insights permission)
- ❌ `impressions`: 0 (requires insights permission)
- ❌ `saves_count`: 0 (requires insights permission)

### With instagram_manage_insights Added

After sync:
- ✅ `like_count`: Shows actual likes
- ✅ `comments_count`: Shows actual comments
- ✅ `reach`: Shows actual reach
- ✅ `impressions`: Shows actual impressions
- ✅ `saves_count`: Shows actual saves

---

## Next Steps

1. **Test Debug Endpoint**:
   ```bash
   curl http://localhost:5001/api/instagram/debug-media/YOUR_CONNECTION_ID \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Check Account Type**:
   - Must be Business or Creator
   - Personal accounts don't have full metrics

3. **Add Insights Permission** (if needed):
   - Update scopes in `.env`
   - Reconnect account
   - Re-sync data

4. **Monitor Logs**:
   - Watch backend terminal during sync
   - Look for warnings or errors
   - Check sync summary

---

## Summary

✅ **Enhanced logging** - See exactly what Instagram API returns  
✅ **Debug endpoint** - Test API data without syncing  
✅ **Better error messages** - Know why insights fail  
✅ **Permission detection** - Identify missing permissions  
✅ **Sync summary** - See posts with/without insights  

**Ready to debug metrics!** 🔍

