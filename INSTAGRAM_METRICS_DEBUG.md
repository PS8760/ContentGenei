# Instagram Metrics Debugging Guide

**Issue**: All engagement metrics (likes, comments, reach, impressions) showing as 0

**Date**: March 2, 2026

---

## Quick Diagnosis

### Step 1: Check Raw API Data

```bash
# Get your connection ID first
curl http://localhost:5001/api/instagram/connections \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Then debug the media data
curl http://localhost:5001/api/instagram/debug-media/YOUR_CONNECTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**What to look for**:
- `media_sample`: Should show `like_count` and `comments_count` fields
- `insights_sample`: Should show `reach`, `impressions`, `saved` data

### Step 2: Check Backend Logs

When you sync data, check the backend terminal for logs like:
```
INFO - Fetching media for user 123456789
INFO - Received 30 media items
INFO - Sample media: id=abc123, like_count=150, comments_count=12
INFO - Media abc123: likes=150, comments=12
INFO - Fetching insights for media abc123
INFO - Received 3 insights for media abc123
INFO -   impressions: 1250
INFO -   reach: 980
INFO -   saved: 15
```

---

## Common Issues & Solutions

### Issue 1: like_count and comments_count are 0

**Cause**: Instagram API not returning these fields

**Possible Reasons**:
1. **Personal Account**: Personal Instagram accounts have limited API access
2. **New Posts**: Very recent posts (< 24 hours) may not have metrics yet
3. **API Permissions**: Missing `instagram_business_basic` permission

**Solution**:

1. **Convert to Business Account**:
   ```
   Instagram App → Settings → Account → Switch to Professional Account
   → Choose "Business" → Connect to Facebook Page
   ```

2. **Check Account Type**:
   ```bash
   curl http://localhost:5001/api/instagram/profile/YOUR_CONNECTION_ID \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```
   
   Should show: `"account_type": "BUSINESS"` or `"CREATOR"`

3. **Verify Permissions**:
   - Go to Facebook Developers Console
   - Your App → Instagram → Permissions
   - Make sure `instagram_business_basic` is approved

### Issue 2: reach and impressions are 0

**Cause**: Insights API not returning data

**Possible Reasons**:
1. **Missing Permission**: Need `instagram_manage_insights` permission
2. **Media Type**: Some media types don't support insights (stories, etc.)
3. **Post Age**: Insights only available for posts < 2 years old
4. **Business Account Required**: Insights only work for Business/Creator accounts

**Solution**:

1. **Add Insights Permission**:
   - Go to Facebook Developers Console
   - Your App → Instagram Graph API → Permissions
   - Request `instagram_manage_insights` permission
   - Update scopes in `.env`:
     ```bash
     INSTAGRAM_SCOPES=instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages,instagram_manage_insights
     ```

2. **Reconnect Account**:
   - Disconnect Instagram in the app
   - Connect again with new permissions

3. **Check Backend Logs**:
   Look for warnings like:
   ```
   WARNING - Could not fetch insights for media abc123: 403
   WARNING - Insights require instagram_manage_insights permission
   ```

### Issue 3: All metrics are 0 in database

**Cause**: Data not being saved correctly

**Solution**:

1. **Check Database**:
   ```bash
   sqlite3 backend/instance/contentgenie_dev.db
   
   SELECT instagram_post_id, like_count, comments_count, reach, impressions 
   FROM instagram_posts 
   LIMIT 5;
   ```

2. **Re-sync Data**:
   - Delete existing posts:
     ```sql
     DELETE FROM instagram_posts WHERE connection_id = 'YOUR_CONNECTION_ID';
     ```
   - Sync again in the app

3. **Check for Errors**:
   - Look at backend logs during sync
   - Check for database errors

---

## Instagram API Requirements

### For Basic Metrics (likes, comments)

**Required**:
- ✅ Instagram Business or Creator Account
- ✅ `instagram_business_basic` permission
- ✅ Connected to Facebook Page

**API Call**:
```
GET https://graph.instagram.com/{user_id}/media
  ?fields=id,caption,media_type,timestamp,like_count,comments_count
  &access_token={token}
```

### For Insights (reach, impressions, saves)

**Required**:
- ✅ Instagram Business or Creator Account
- ✅ `instagram_manage_insights` permission
- ✅ Post must be < 2 years old
- ✅ Post must be published (not draft)

**API Call**:
```
GET https://graph.instagram.com/{media_id}/insights
  ?metric=impressions,reach,saved
  &access_token={token}
```

---

## Testing Steps

### 1. Test Media Endpoint

```bash
# Replace with your actual values
USER_ID="your_instagram_user_id"
TOKEN="your_access_token"

curl "https://graph.instagram.com/${USER_ID}/media?fields=id,caption,like_count,comments_count&access_token=${TOKEN}"
```

**Expected Response**:
```json
{
  "data": [
    {
      "id": "123456789",
      "caption": "My post caption",
      "like_count": 150,
      "comments_count": 12
    }
  ]
}
```

**If like_count is missing**:
- Account is not Business/Creator
- Or API permissions issue

### 2. Test Insights Endpoint

```bash
MEDIA_ID="123456789"
TOKEN="your_access_token"

curl "https://graph.instagram.com/${MEDIA_ID}/insights?metric=impressions,reach,saved&access_token=${TOKEN}"
```

**Expected Response**:
```json
{
  "data": [
    {
      "name": "impressions",
      "period": "lifetime",
      "values": [{"value": 1250}]
    },
    {
      "name": "reach",
      "period": "lifetime",
      "values": [{"value": 980}]
    },
    {
      "name": "saved",
      "period": "lifetime",
      "values": [{"value": 15}]
    }
  ]
}
```

**If error 403**:
- Missing `instagram_manage_insights` permission

**If error 400**:
- Media type doesn't support insights
- Or post is too old

---

## Updated Sync Process

The sync now includes detailed logging:

1. **Fetch Media**:
   - Logs: "Fetching media for user {id}"
   - Logs: "Received {count} media items"
   - Logs sample: "Sample media: id=..., like_count=..., comments_count=..."

2. **For Each Post**:
   - Logs: "Media {id}: likes={count}, comments={count}"
   - Fetches insights
   - Logs: "Received {count} insights for media {id}"
   - Logs each insight value

3. **Save to Database**:
   - Logs: "Media {id} final: likes=..., comments=..., reach=..., impressions=..., saves=..."

4. **Summary**:
   - Logs: "Sync complete: {total} posts, {with_insights} with insights, {without_insights} without insights"

---

## Permissions Checklist

### Current Permissions (Basic)
- ✅ `instagram_business_basic` - Basic profile and media
- ✅ `instagram_business_manage_comments` - Comment management
- ✅ `instagram_business_manage_messages` - Message management

### Additional Permission Needed for Insights
- ⚠️ `instagram_manage_insights` - Reach, impressions, saves

### How to Add Insights Permission

1. **Facebook Developers Console**:
   - Go to https://developers.facebook.com/apps/
   - Select your app
   - Instagram Graph API → Permissions
   - Click "Add Permission"
   - Select `instagram_manage_insights`
   - Submit for review (if required)

2. **Update .env**:
   ```bash
   INSTAGRAM_SCOPES=instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages,instagram_manage_insights
   ```

3. **Reconnect Account**:
   - In the app, disconnect Instagram
   - Connect again
   - New permissions will be requested

---

## Debug Checklist

Before reporting an issue, check:

- [ ] Account is Business or Creator (not Personal)
- [ ] Account is connected to Facebook Page
- [ ] `instagram_business_basic` permission is approved
- [ ] Backend is running and logs are visible
- [ ] Ran debug endpoint: `/api/instagram/debug-media/{id}`
- [ ] Checked backend logs during sync
- [ ] Verified posts are not too old (< 2 years)
- [ ] Tried re-syncing data

---

## Expected Behavior

### After Sync

**With Basic Permission Only**:
- ✅ like_count: Shows actual likes
- ✅ comments_count: Shows actual comments
- ❌ reach: 0 (requires insights permission)
- ❌ impressions: 0 (requires insights permission)
- ❌ saves: 0 (requires insights permission)

**With Insights Permission**:
- ✅ like_count: Shows actual likes
- ✅ comments_count: Shows actual comments
- ✅ reach: Shows actual reach
- ✅ impressions: Shows actual impressions
- ✅ saves: Shows actual saves

---

## Quick Fixes

### Fix 1: Re-sync with Logging

```bash
# Restart backend to see logs
cd backend
python run.py

# In another terminal, trigger sync
curl -X POST http://localhost:5001/api/instagram/sync/YOUR_CONNECTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Watch backend logs for details
```

### Fix 2: Check Database

```bash
sqlite3 backend/instance/contentgenie_dev.db

# Check what's stored
SELECT 
  instagram_post_id,
  like_count,
  comments_count,
  reach,
  impressions,
  saves_count,
  engagement_rate
FROM instagram_posts
ORDER BY published_at DESC
LIMIT 10;

# If all zeros, delete and re-sync
DELETE FROM instagram_posts WHERE connection_id = 'YOUR_CONNECTION_ID';
```

### Fix 3: Test API Directly

Use the debug endpoint to see raw API response:

```bash
curl http://localhost:5001/api/instagram/debug-media/YOUR_CONNECTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq
```

Look at `media_sample` to see if Instagram is returning the data.

---

## Still Having Issues?

1. **Check Account Type**:
   - Must be Business or Creator
   - Personal accounts don't have full API access

2. **Check Permissions**:
   - `instagram_business_basic` is minimum
   - `instagram_manage_insights` needed for reach/impressions

3. **Check Backend Logs**:
   - Look for API errors
   - Check for permission warnings

4. **Test API Directly**:
   - Use curl to test Instagram API
   - Verify your access token works

5. **Contact Support**:
   - Provide debug endpoint output
   - Provide backend logs
   - Specify account type (Business/Creator/Personal)

---

## Summary

**Most Common Issue**: Personal Instagram account

**Solution**: Convert to Business/Creator account and connect to Facebook Page

**For Insights**: Add `instagram_manage_insights` permission and reconnect

**Debug Tool**: Use `/api/instagram/debug-media/{id}` endpoint to see raw data

---

**Updated**: March 2, 2026  
**Status**: Enhanced logging and debugging tools added ✅

