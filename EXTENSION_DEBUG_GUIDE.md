# LinkoGenei Extension - Debug Guide

## Current Status
✅ Backend is running on AWS
✅ API is accessible: `http://3.235.236.139/api/linkogenei/test`
✅ CORS headers are configured
✅ Nginx is proxying correctly
❌ Extension shows "Cannot connect to server"

---

## Step-by-Step Debugging

### Step 1: Test API from Browser

Open Chrome Console (F12) and run:

```javascript
fetch('http://3.235.236.139/api/linkogenei/test')
  .then(r => r.json())
  .then(d => console.log('✅ API Works:', d))
  .catch(e => console.error('❌ API Failed:', e))
```

**Expected Result**: `✅ API Works: {message: "LinkoGenei API is working!", success: true}`

**If it fails**: There's a network/firewall issue blocking your browser from reaching AWS.

---

### Step 2: Reload Extension

1. Go to `chrome://extensions/`
2. Find "LinkoGenei - Save Social Posts"
3. Click the **🔄 Reload** button
4. Version should show **1.0.2**

---

### Step 3: Check Extension Settings

1. Click the LinkoGenei extension icon
2. Check the "Backend Server" dropdown
3. Make sure **"AWS (3.235.236.139)"** is selected
4. If not, select it and click "Save Settings"

---

### Step 4: Generate and Set Token

1. Go to http://3.235.236.139/linkogenei
2. Click "Generate Token"
3. Copy the token
4. Click the extension icon
5. Paste the token in the input field
6. Click "Activate Extension"
7. You should see "✅ Extension Activated!"

---

### Step 5: Test Saving a Post

1. Go to any LinkedIn or Instagram post
2. Open browser console (F12)
3. Look for LinkoGenei logs
4. Click "Save to Genei" button
5. Watch the console for detailed logs

**Console logs to look for:**
```
LinkoGenei: Using backend: aws URL: http://3.235.236.139/api
LinkoGenei: Extension activated
LinkoGenei: Sending request to backend...
LinkoGenei: Response status: 201
LinkoGenei: Response data: {success: true, ...}
```

---

## Common Issues & Solutions

### Issue 1: "Cannot connect to server"

**Possible Causes:**
1. Extension not reloaded after manifest update
2. Wrong backend selected (should be AWS)
3. Token not set or expired
4. Browser blocking HTTP requests (mixed content)

**Solutions:**
1. Reload extension at `chrome://extensions/`
2. Select AWS backend in extension settings
3. Generate new token and activate extension
4. Check browser console for CORS/network errors

---

### Issue 2: "Invalid token"

**Solution:**
1. Go to http://3.235.236.139/linkogenei
2. Generate a NEW token
3. Copy and paste it in the extension
4. Click "Activate Extension"

---

### Issue 3: Extension icon shows but button doesn't appear

**Possible Causes:**
1. Extension not activated
2. Token not set
3. Content script not injected

**Solutions:**
1. Click extension icon and activate it
2. Refresh the page after activating
3. Check console for errors

---

### Issue 4: Button appears but save fails

**Check Console Logs:**

Look for these specific errors:

**Error: "Failed to fetch"**
- Network issue or CORS problem
- Check if API is accessible from browser (Step 1)

**Error: "HTTP 401"**
- Invalid or expired token
- Generate new token

**Error: "HTTP 500"**
- Backend error
- Check backend logs: `tail -f /home/ubuntu/ContentGenei/backend/backend.log`

---

## Advanced Debugging

### Check Extension Storage

Open console in extension popup and run:

```javascript
chrome.storage.local.get(null, (data) => {
  console.log('Extension storage:', data);
});
```

Should show:
```javascript
{
  isActive: true,
  authToken: "your-token-here",
  selectedBackend: "aws"
}
```

---

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Click "Save to Genei" button
4. Look for request to `http://3.235.236.139/api/linkogenei/save-post`
5. Check:
   - Status code (should be 201)
   - Request headers (should have Authorization: Bearer ...)
   - Response body

---

### Check Backend Logs

On AWS server:

```bash
# Real-time logs
tail -f /home/ubuntu/ContentGenei/backend/backend.log

# Last 50 lines
tail -50 /home/ubuntu/ContentGenei/backend/backend.log

# Search for errors
grep -i error /home/ubuntu/ContentGenei/backend/backend.log
```

---

## Quick Fix Checklist

- [ ] Backend is running: `ps aux | grep python | grep app.py`
- [ ] API is accessible: `curl http://3.235.236.139/api/linkogenei/test`
- [ ] Extension reloaded at `chrome://extensions/`
- [ ] Extension version is 1.0.2
- [ ] AWS backend selected in extension
- [ ] Token generated and activated
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows request being sent

---

## Still Not Working?

### Test with curl

```bash
# Generate token first from the website, then:
curl -X POST http://3.235.236.139/api/linkogenei/save-post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "url": "https://www.linkedin.com/posts/test",
    "platform": "LinkedIn",
    "title": "Test Post"
  }'
```

If this works but extension doesn't, the issue is in the extension code.

If this fails, the issue is in the backend.

---

## Contact Information

If none of these steps work, provide:
1. Browser console logs (full output)
2. Network tab screenshot showing the failed request
3. Backend logs: `tail -50 /home/ubuntu/ContentGenei/backend/backend.log`
4. Extension storage data (from Advanced Debugging section)

---

**Version**: 1.0.2
**Last Updated**: March 9, 2026
