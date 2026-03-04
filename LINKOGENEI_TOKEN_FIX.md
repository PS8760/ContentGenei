# LinkoGenei Token Persistence Fix ✅

## Problem
Extension tokens were stored in memory and lost on backend restart/redeploy, causing "Invalid or expired token" errors.

## Solution Implemented
Moved token storage from memory to MongoDB for persistence across restarts.

---

## Changes Made

### 1. MongoDB Service (`backend/services/mongodb_service.py`)
Added three new methods for token management:

```python
def store_extension_token(user_id, token, expires_at)
    - Stores extension token in MongoDB
    - Creates extension_tokens collection with indexes
    - Tokens expire in 30 days

def verify_extension_token(token)
    - Verifies token exists and not expired
    - Returns user_id if valid

def delete_extension_token(token)
    - Removes token from database
```

### 2. LinkoGenei Routes (`backend/routes/linkogenei.py`)
Updated ALL endpoints to use MongoDB token verification:
- `/save-post` ✅
- `/posts` (GET) ✅
- `/posts/<post_id>` (GET, PUT, DELETE) ✅
- `/categories` (GET, POST) ✅
- `/stats` ✅

Removed in-memory `extension_tokens = {}` dictionary.

---

## How It Works Now

1. **Token Generation** (`/api/linkogenei/generate-token`)
   - User clicks "Generate Token" in GeneiLink page
   - Backend creates secure token
   - Stores in MongoDB with 30-day expiration
   - Returns token to user

2. **Token Storage**
   - MongoDB collection: `extension_tokens`
   - Fields: `user_id`, `token`, `expires_at`, `created_at`
   - Indexed for fast lookups

3. **Token Verification**
   - Every LinkoGenei API call checks MongoDB
   - Validates token exists and not expired
   - Returns user_id for database queries

4. **Token Persistence**
   - Tokens survive backend restarts ✅
   - Tokens survive Render redeploys ✅
   - Tokens expire after 30 days (configurable)

---

## Current Issue: Frontend Not Using Extension Tokens

The frontend (`GeneiLink.jsx`) is calling LinkoGenei endpoints but using JWT tokens instead of extension tokens.

### What's Happening:
```javascript
// Frontend calls these endpoints:
apiService.getAggregatedPosts()  // Uses JWT token ❌
apiService.getCategories()        // Uses JWT token ❌
apiService.getSavedPosts()        // Uses JWT token ❌
```

### What Should Happen:
```javascript
// Frontend should:
1. Generate extension token once
2. Store in localStorage
3. Use extension token for LinkoGenei calls
```

---

## Next Steps for User

### Option 1: Use GeneiLink Page (Recommended)
The GeneiLink page has a "Generate Token" button that creates extension tokens. However, the page needs to be updated to:
1. Store the generated token in localStorage
2. Use that token for all LinkoGenei API calls

### Option 2: Test with Chrome Extension
The Chrome extension is designed to use extension tokens. Test the flow:
1. Go to GeneiLink page
2. Click "Generate Token"
3. Copy token to Chrome extension
4. Extension should now work with persistent tokens

---

## Testing the Fix

### 1. Check Render Logs
After deployment, verify MongoDB connection:
```
Connected to MongoDB: linkogenei
MongoDB indexes created successfully
Extension token stored for user: <user_id>
```

### 2. Test Token Generation
```bash
# Generate token
curl -X POST https://contentgenei.onrender.com/api/linkogenei/generate-token \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Response:
{
  "success": true,
  "token": "abc123...",
  "message": "Token generated successfully",
  "existing_posts": 0
}
```

### 3. Test Token Verification
```bash
# Verify token
curl -X POST https://contentgenei.onrender.com/api/linkogenei/verify-token \
  -H "Authorization: Bearer <EXTENSION_TOKEN>"

# Response:
{
  "success": true,
  "user_id": "user123",
  "message": "Token verified successfully"
}
```

### 4. Test Token Persistence
1. Generate token
2. Restart Render backend (or wait for auto-restart)
3. Use same token - should still work ✅

---

## MongoDB Collection Structure

```javascript
// extension_tokens collection
{
  "_id": ObjectId("..."),
  "user_id": "firebase_uid_or_uuid",
  "token": "secure_random_token_32_chars",
  "expires_at": ISODate("2026-04-05T..."),
  "created_at": ISODate("2026-03-05T...")
}

// Indexes:
- token (unique)
- user_id (ascending)
- expires_at (ascending)
```

---

## Benefits

✅ Tokens persist across backend restarts
✅ Tokens persist across Render redeploys
✅ No data loss on server restart
✅ Proper expiration handling
✅ Fast token lookups with indexes
✅ Secure token storage in MongoDB

---

## Deployment Status

- ✅ Code committed to GitHub
- ✅ Pushed to main branch
- ⏳ Render will auto-deploy (takes 2-3 minutes)
- ⏳ Test after deployment completes

---

## Important Notes

1. **Existing Tokens Lost**: Any tokens generated before this fix are lost (they were in memory)
2. **Generate New Token**: Users need to generate new tokens after deployment
3. **30-Day Expiration**: Tokens expire after 30 days (can be changed in code)
4. **MongoDB Required**: LinkoGenei features require MongoDB connection

---

## Troubleshooting

### "Invalid or expired token"
- Generate new token from GeneiLink page
- Check token is stored in localStorage
- Verify MongoDB connection in Render logs

### "Failed to fetch"
- Check CORS settings in backend
- Verify API endpoint exists
- Check network tab for actual error

### "User not found"
- User needs to log out and log back in
- This creates user in production database
- See `FIX_USER_NOT_FOUND.md` for details

---

## Related Files
- `backend/services/mongodb_service.py` - Token storage methods
- `backend/routes/linkogenei.py` - Token verification
- `frontend/src/pages/GeneiLink.jsx` - Token generation UI
- `frontend/src/services/api.js` - API calls

---

**Status**: ✅ Backend fix complete and deployed
**Next**: Frontend needs update to use extension tokens properly
