# LinkoGenei - URL Extraction Fix Guide

## 🐛 Issue

The extension was saving the page URL instead of the specific post URL.

## ✅ Fix Applied

Updated the URL extraction logic in `extension/content.js` to:

1. Try multiple selectors to find the post link
2. Look for time elements (which usually link to the post)
3. Search through all links in the post element
4. Clean URLs by removing query parameters
5. Add detailed logging to help debug

## 🔍 Testing the Fix

### Step 1: Update the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Find "LinkoGenei - Save Social Posts"
3. Click the "Reload" button (circular arrow icon)

### Step 2: Test on Instagram

1. Open https://www.instagram.com
2. Open Chrome DevTools (F12 or Right-click → Inspect)
3. Go to the "Console" tab
4. Scroll through your feed
5. Look for logs like:
   ```
   LinkoGenei: Found 5 posts on instagram
   LinkoGenei: Post #1 URL: https://www.instagram.com/p/ABC123/
   LinkoGenei: Post #2 URL: https://www.instagram.com/p/DEF456/
   ```

6. Click "Save to Genei" on a post
7. Check the console for:
   ```
   LinkoGenei: Saving post... {url: "https://www.instagram.com/p/ABC123/", platform: "Instagram"}
   LinkoGenei: Sending request to backend... {postUrl: "https://www.instagram.com/p/ABC123/", ...}
   ```

### Step 3: Verify in Database

1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017/`
3. Open database: `linkogenei`
4. Open collection: `saved_posts`
5. Check the `url` field - it should be the specific post URL like:
   ```
   https://www.instagram.com/p/ABC123/
   ```
   NOT the page URL like:
   ```
   https://www.instagram.com/
   ```

### Step 4: Verify in Dashboard

1. Open http://localhost:5173/linkogenei
2. Check your saved posts
3. Click on a post - it should open the SPECIFIC post, not the homepage

## 🔧 Debug Version

If you're still having issues, use the debug version:

### Enable Debug Version

1. Edit `extension/manifest.json`
2. Find the `content_scripts` section
3. Change `"js": ["content.js"]` to `"js": ["content-debug-v2.js"]`
4. Reload the extension in Chrome
5. Open DevTools Console
6. You'll see detailed logs with 🔍 emoji showing exactly what's happening

### Debug Logs to Look For

```
🔍 LinkoGenei DEBUG: Content script loaded
🔍 Detecting platform from hostname: www.instagram.com
✅ Platform detected: Instagram
🔍 Found 5 posts on instagram
🔍 Processing post #1...
🔍 Instagram: Extracting URL from element: <article>
🔍 Instagram: First attempt (a[href*="/p/"]): <a href="/p/ABC123/">
🔍 Instagram: Raw href: /p/ABC123/
✅ Instagram: Final URL: https://www.instagram.com/p/ABC123/
✅ Post #1 URL extracted: https://www.instagram.com/p/ABC123/
🔍 Creating button for URL: https://www.instagram.com/p/ABC123/
✅ Post #1: Button injected
```

When you click "Save to Genei":

```
🔍 Button clicked! Saving URL: https://www.instagram.com/p/ABC123/
🔍 savePost called with: {url: "https://www.instagram.com/p/ABC123/", platform: "Instagram"}
🔍 Sending request to backend: {endpoint: "http://localhost:5001/api/linkogenei/save-post", data: {...}}
🔍 Response status: 201
✅ Response data: {success: true, post_id: "...", ...}
✅ Post saved successfully!
```

## 🎯 What Changed

### Before (Wrong)

```javascript
// LinkedIn was falling back to window.location.href
getUrl: (element) => {
  const link = element.querySelector('a[href*="/posts/"]');
  if (link) {
    return link.href;
  }
  return window.location.href;  // ❌ This was the problem!
}
```

### After (Correct)

```javascript
// Now tries multiple selectors and returns null if not found
getUrl: (element) => {
  let link = element.querySelector('a[href*="/posts/"]');
  
  if (!link) {
    const timeElement = element.querySelector('time');
    if (timeElement) {
      link = timeElement.closest('a');
    }
  }
  
  if (link) {
    const href = link.getAttribute('href');
    const cleanHref = href.split('?')[0];
    return cleanHref.startsWith('http') ? cleanHref : `https://www.linkedin.com${cleanHref}`;
  }
  
  return null;  // ✅ Returns null instead of page URL
}
```

## 📊 Expected Results

### Instagram Post URL Format
```
https://www.instagram.com/p/ABC123/
https://www.instagram.com/p/DEF456/
https://www.instagram.com/reel/GHI789/
```

### LinkedIn Post URL Format
```
https://www.linkedin.com/posts/username_activity-1234567890-abcd
https://www.linkedin.com/feed/update/urn:li:activity:1234567890
```

### Twitter/X Post URL Format
```
https://twitter.com/username/status/1234567890
https://x.com/username/status/1234567890
```

## ❌ Wrong URLs (What We're Fixing)

These should NOT be saved:
```
https://www.instagram.com/
https://www.linkedin.com/feed/
https://twitter.com/home
https://x.com/home
```

## ✅ Correct URLs (What We Want)

These SHOULD be saved:
```
https://www.instagram.com/p/ABC123/
https://www.linkedin.com/posts/user_activity-123-abc
https://twitter.com/user/status/123456
```

## 🧪 Test Cases

### Test 1: Instagram Post
1. Go to Instagram feed
2. Find a post
3. Click "Save to Genei"
4. Check console: Should show `https://www.instagram.com/p/[POST_ID]/`
5. Check MongoDB: `url` field should have the post URL

### Test 2: LinkedIn Post
1. Go to LinkedIn feed
2. Find a post
3. Click "Save to Genei"
4. Check console: Should show `https://www.linkedin.com/posts/[POST_ID]`
5. Check MongoDB: `url` field should have the post URL

### Test 3: Twitter/X Post
1. Go to Twitter/X feed
2. Find a tweet
3. Click "Save to Genei"
4. Check console: Should show `https://twitter.com/[USER]/status/[TWEET_ID]`
5. Check MongoDB: `url` field should have the tweet URL

## 🔍 Troubleshooting

### Issue: Still seeing page URL in database

**Solution**:
1. Make sure you reloaded the extension after updating
2. Hard refresh the social media page (Ctrl+Shift+R or Cmd+Shift+R)
3. Check console logs to see what URL is being extracted
4. Use debug version to see detailed extraction process

### Issue: No URL being extracted (button not appearing)

**Solution**:
1. Check console for warnings: `Could not extract URL for post #X`
2. The post might not have a permalink (stories, ads, etc.)
3. Use debug version to see which selectors are being tried
4. Social media sites change their HTML structure - selectors may need updating

### Issue: Wrong URL format

**Solution**:
1. Check console logs to see the raw href being extracted
2. Verify the URL cleaning logic is working (removing query params)
3. Check if the URL needs the domain prepended

## 📝 Manual Verification

### Check What's Being Saved

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/linkogenei

# Query recent posts
db.saved_posts.find().sort({created_at: -1}).limit(5).pretty()

# Check URLs
db.saved_posts.find({}, {url: 1, platform: 1, _id: 0}).limit(10)
```

Expected output:
```json
{ "url": "https://www.instagram.com/p/ABC123/", "platform": "Instagram" }
{ "url": "https://www.linkedin.com/posts/user_123-abc", "platform": "LinkedIn" }
{ "url": "https://twitter.com/user/status/123456", "platform": "Twitter" }
```

## 🎉 Success Criteria

✅ Console shows specific post URLs (not page URLs)
✅ MongoDB contains specific post URLs
✅ Clicking saved post in dashboard opens the specific post
✅ No duplicate posts with same URL
✅ Notification shows the saved URL

## 📚 Files Modified

- `extension/content.js` - Updated URL extraction logic
- `extension/content-debug-v2.js` - Created debug version with detailed logging

## 🚀 Next Steps

1. Reload extension
2. Test on Instagram
3. Check console logs
4. Verify MongoDB has correct URLs
5. Test on LinkedIn and Twitter
6. Switch back to production version once verified

---

If you're still seeing page URLs instead of post URLs after following this guide, please:

1. Share the console logs (with 🔍 emoji)
2. Share a screenshot of the MongoDB document
3. Specify which platform (Instagram, LinkedIn, Twitter)
4. I'll help debug further!
