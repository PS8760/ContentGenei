# Extension Troubleshooting Guide

## Current Issue: "Cannot connect to server" Error

### What's Actually Working ✅

Based on backend logs, the extension IS connecting successfully:
- ✅ Token verification endpoint working (200 response)
- ✅ Stats endpoint working (200 response)  
- ✅ Backend running on AWS
- ✅ Extension using correct IP (3.235.236.139)

### The Real Issue

The error message "Cannot connect to server. Make sure backend is running on port 5001" is **misleading**. This is just a generic error message that appears when:
1. Network request fails
2. CORS issue occurs
3. Extension loses connection temporarily

## ✅ Quick Fix Steps

### Step 1: Reload the Extension
1. Open `chrome://extensions/`
2. Find "LinkoGenei"
3. Click the **reload icon** (circular arrow)
4. This ensures the extension uses the latest code

### Step 2: Clear Extension Storage
1. Go to `chrome://extensions/`
2. Click "Details" on LinkoGenei extension
3. Scroll down to "Site access"
4. Click "Clear storage and reset permissions"
5. Reload the extension

### Step 3: Re-activate Extension
1. Go to http://3.235.236.139/linkogenei
2. Generate a new access token
3. Copy the token
4. Click LinkoGenei extension icon
5. Paste token and click "Activate Extension"
6. Should show "Extension activated successfully!"

### Step 4: Test on Instagram
1. Go to https://instagram.com
2. Find any public post
3. Look for the "Save to Genei" button
4. Click it and select a category
5. Should save successfully

## 🔍 Debugging Steps

### Check 1: Verify Backend is Running
```bash
curl http://3.235.236.139/api/health
```
Should return:
```json
{
  "status": "healthy",
  "message": "ContentGenie API is running"
}
```

### Check 2: Check Extension Console
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "background page" or "service worker" on LinkoGenei
4. Check console for errors
5. Look for API_URL being used

### Check 3: Check Content Script Console
1. Go to Instagram.com
2. Open browser console (F12)
3. Look for "LinkoGenei:" messages
4. Should show: "LinkoGenei: Using backend: aws URL: http://3.235.236.139/api"

### Check 4: Test Token Manually
```bash
# Replace YOUR_TOKEN with your actual token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://3.235.236.139/api/linkogenei/verify-token \
  -X POST
```
Should return:
```json
{
  "success": true,
  "user_id": "..."
}
```

## 🐛 Common Issues & Solutions

### Issue 1: Extension shows old IP address
**Symptom**: Extension popup shows "52.71.190.153"  
**Solution**: 
1. Reload extension in Chrome
2. Clear extension storage
3. Reinstall extension if needed

### Issue 2: "Failed to fetch" error
**Symptom**: Network error when trying to save post  
**Possible Causes**:
- Browser blocking cross-origin requests
- Ad blocker interfering
- Network connectivity issue

**Solution**:
1. Disable ad blockers temporarily
2. Check browser console for CORS errors
3. Try in incognito mode
4. Check internet connection

### Issue 3: Token not working
**Symptom**: "Invalid token" error  
**Solution**:
1. Generate a new token from dashboard
2. Make sure you copied the entire token
3. No extra spaces before/after token
4. Token should start with random characters

### Issue 4: Button not appearing on posts
**Symptom**: No "Save to Genei" button visible  
**Solution**:
1. Make sure extension is activated
2. Refresh the Instagram page
3. Check if you're on a supported platform (Instagram, LinkedIn, Twitter)
4. Look in browser console for errors

### Issue 5: CORS errors in console
**Symptom**: "Access-Control-Allow-Origin" errors  
**Solution**: Backend already has CORS enabled. If you see this:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check if backend is running

## 📊 What the Backend Logs Show

Recent successful requests:
```
✅ POST /api/linkogenei/verify-token - 200 OK
✅ GET /api/linkogenei/stats - 200 OK  
✅ GET /api/linkogenei/posts - 200 OK
✅ GET /api/linkogenei/categories - 200 OK
```

This means:
- Backend is running correctly
- Extension CAN connect to backend
- Token verification is working
- All endpoints are functional

## 🎯 Most Likely Cause

The error you're seeing is probably one of these:
1. **Cached error message** - Reload extension to clear
2. **Temporary network glitch** - Try again
3. **Browser extension conflict** - Disable other extensions
4. **Ad blocker interference** - Whitelist the site

## ✅ Verification Checklist

Before reporting an issue, verify:
- [ ] Extension reloaded in Chrome
- [ ] Extension storage cleared
- [ ] New token generated and activated
- [ ] Backend health check passes
- [ ] Browser console checked for errors
- [ ] Tested in incognito mode
- [ ] Ad blockers disabled
- [ ] Internet connection stable

## 🔧 Advanced Debugging

### Enable Verbose Logging
1. Open extension's background page console
2. Run: `localStorage.setItem('debug', 'true')`
3. Reload extension
4. Try saving a post
5. Check console for detailed logs

### Check Network Requests
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "linkogenei"
4. Try saving a post
5. Check request/response details

### Test API Directly
```bash
# Test save-post endpoint
curl -X POST http://3.235.236.139/api/linkogenei/save-post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "url": "https://instagram.com/p/test",
    "platform": "Instagram",
    "category": "Test"
  }'
```

## 📞 Still Having Issues?

If none of the above works:

1. **Check backend logs**:
```bash
ssh -i ~/contentgenei-key.pem ubuntu@3.235.236.139
cd ~/ContentGenei/backend
tail -f backend.log
```

2. **Restart backend**:
```bash
ssh -i ~/contentgenei-key.pem ubuntu@3.235.236.139
cd ~/ContentGenei/backend
pkill -f "python.*app.py"
source venv/bin/activate
nohup python app.py > backend.log 2>&1 &
```

3. **Check Nginx**:
```bash
ssh -i ~/contentgenei-key.pem ubuntu@3.235.236.139
sudo systemctl status nginx
sudo nginx -t
```

## 💡 Pro Tips

1. **Always reload extension after updates**
2. **Generate new token if issues persist**
3. **Check browser console first**
4. **Test in incognito to rule out conflicts**
5. **Whitelist site in ad blockers**

---

**Remember**: The backend logs show everything is working. The issue is likely on the browser/extension side, not the server!
