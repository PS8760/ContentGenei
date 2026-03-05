# 📸 Instagram API Setup Guide

## ⚠️ Important: Instagram API Types

Instagram has **two different APIs** with different scopes and requirements:

### 1. Instagram Basic Display API (Recommended for Testing)
**Use this for:** Personal Instagram accounts, testing, simple profile access

**Scopes:**
- `user_profile` - Access to profile info (username, account type, media count)
- `user_media` - Access to user's media (photos, videos)

**Setup:**
1. Go to https://developers.facebook.com/
2. Create an app
3. Add "Instagram Basic Display" product
4. Configure OAuth redirect URI
5. Add test users (your Instagram account)

**Pros:**
- ✅ Easy to set up
- ✅ Works with personal accounts
- ✅ Good for testing

**Cons:**
- ❌ Limited to test users only
- ❌ Cannot post content
- ❌ Cannot access insights/analytics

---

### 2. Instagram Graph API (For Business/Creator Accounts)
**Use this for:** Business accounts, posting content, analytics

**Scopes:**
- `instagram_basic` - Basic profile access
- `instagram_content_publish` - Post photos/videos
- `instagram_manage_comments` - Manage comments
- `instagram_manage_insights` - Access analytics

**Requirements:**
- ✅ Instagram Business or Creator account
- ✅ Connected to Facebook Page
- ✅ App review for advanced permissions

**Pros:**
- ✅ Full API access
- ✅ Can post content
- ✅ Access to analytics
- ✅ Works for all users (after app review)

**Cons:**
- ❌ Requires business account
- ❌ Must connect to Facebook Page
- ❌ Requires app review for production

---

## 🔧 Current Implementation

**We're using:** Instagram Basic Display API

**Why?** Easier to test, works with personal accounts, no app review needed for testing.

**Scopes configured:**
```bash
INSTAGRAM_SCOPES=user_profile,user_media
```

---

## 🚀 Setup Instructions

### Step 1: Create Instagram App

1. Go to https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Choose "Consumer" app type
4. Fill in app details

### Step 2: Add Instagram Basic Display

1. In your app dashboard, click "Add Product"
2. Find "Instagram Basic Display"
3. Click "Set Up"

### Step 3: Configure OAuth Settings

1. Scroll to "Instagram Basic Display" settings
2. Click "Create New App"
3. Fill in:
   - **Display Name:** Your App Name
   - **Valid OAuth Redirect URIs:** 
     ```
     http://localhost:5001/api/platforms/instagram/callback
     ```
   - **Deauthorize Callback URL:** (optional)
   - **Data Deletion Request URL:** (optional)

4. Save changes
5. Copy your:
   - **Instagram App ID**
   - **Instagram App Secret**

### Step 4: Add Test Users

1. Go to "Roles" → "Instagram Testers"
2. Click "Add Instagram Testers"
3. Enter your Instagram username
4. Go to your Instagram app (on phone or web)
5. Settings → Apps and Websites → Tester Invites
6. Accept the invite

### Step 5: Configure Backend

Edit `backend/.env`:
```bash
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:5001/api/platforms/instagram/callback
INSTAGRAM_SCOPES=user_profile,user_media
INSTAGRAM_FRONTEND_URL=http://localhost:5173
```

### Step 6: Restart Backend

```bash
cd backend
# Stop current server (Ctrl+C)
python run.py
```

---

## 🧪 Testing

1. Complete onboarding
2. Select Instagram platform
3. Click "Finish"
4. You'll be redirected to Instagram authorization
5. Log in with your test user account
6. Authorize the app
7. You'll be redirected back with success message

---

## ❌ Common Errors

### Error: "Invalid Scopes"
**Problem:** Using wrong scopes for the API type

**Solution:** 
- For Basic Display API: Use `user_profile,user_media`
- For Graph API: Use `instagram_basic,instagram_content_publish`

### Error: "Redirect URI Mismatch"
**Problem:** Redirect URI doesn't match exactly

**Solution:**
- Check `backend/.env` INSTAGRAM_REDIRECT_URI
- Must match exactly in Facebook Developer Console
- Include protocol (http://)
- Include port (5001)
- No trailing slash

### Error: "User not authorized as a tester"
**Problem:** Instagram account not added as tester

**Solution:**
1. Add account as tester in Facebook Developer Console
2. Accept invite in Instagram app
3. Try OAuth again

### Error: "App not in development mode"
**Problem:** App is in live mode but not approved

**Solution:**
- Keep app in "Development" mode for testing
- Only switch to "Live" after app review

---

## 🔄 Switching to Graph API (Future)

If you want to use Instagram Graph API later:

1. **Change API endpoints** in `instagram_service.py`:
   ```python
   self.oauth_url = 'https://www.facebook.com/v20.0/dialog/oauth'
   self.token_url = 'https://graph.facebook.com/v20.0/oauth/access_token'
   ```

2. **Change scopes** in `.env`:
   ```bash
   INSTAGRAM_SCOPES=instagram_basic,instagram_content_publish
   ```

3. **Update redirect URI** to use Facebook OAuth:
   ```bash
   INSTAGRAM_REDIRECT_URI=http://localhost:5001/api/platforms/instagram/callback
   ```

4. **Convert to Business Account:**
   - Connect Instagram to Facebook Page
   - Switch to Business or Creator account

5. **Submit for App Review:**
   - Required for production use
   - Explain use case
   - Provide demo video

---

## 📊 API Comparison

| Feature | Basic Display API | Graph API |
|---------|------------------|-----------|
| Profile Access | ✅ | ✅ |
| Media Access | ✅ | ✅ |
| Post Content | ❌ | ✅ |
| Analytics | ❌ | ✅ |
| Comments | ❌ | ✅ |
| Stories | ❌ | ✅ |
| Account Type | Personal | Business/Creator |
| App Review | Not needed | Required |
| Test Users | Required | Not required |

---

## 🎯 Recommendation

**For Testing:** Use Instagram Basic Display API (current implementation)

**For Production:** Switch to Instagram Graph API after:
1. Converting to business account
2. Completing app review
3. Testing thoroughly

---

## 📚 Resources

- Instagram Basic Display API: https://developers.facebook.com/docs/instagram-basic-display-api
- Instagram Graph API: https://developers.facebook.com/docs/instagram-api
- App Review: https://developers.facebook.com/docs/app-review
- Valid Permissions: https://developers.facebook.com/docs/permissions/reference

---

## ✅ Current Status

**API Type:** Instagram Basic Display API  
**Scopes:** `user_profile,user_media`  
**OAuth URL:** `https://api.instagram.com/oauth/authorize`  
**Status:** ✅ Fixed - Ready for testing with test users

---

**Next:** Add your Instagram account as a test user and try the OAuth flow!
