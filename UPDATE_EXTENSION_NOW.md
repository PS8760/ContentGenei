# Update Chrome Extension - Add AWS URL

## What Changed

Added your AWS server URL to the extension permissions:
- `http://3.235.236.139/*` ✅

Updated version from 1.0.0 → 1.0.1

---

## How to Update the Extension

### Step 1: Reload Extension in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Make sure "Developer mode" is ON (toggle in top-right)
3. Find "LinkoGenei - Save Social Posts"
4. Click the **🔄 Reload** button

### Step 2: Verify Permissions

1. Click "Details" on the extension
2. Scroll down to "Site access"
3. You should now see:
   - ✅ `http://3.235.236.139/*` (NEW!)
   - ✅ `http://localhost:5001/*`
   - ✅ `http://127.0.0.1:5001/*`
   - ✅ `http://52.71.190.153/*` (old IP)
   - ✅ `https://contentgenei.onrender.com/*`
   - ✅ `https://www.instagram.com/*`
   - ✅ `https://www.linkedin.com/*`
   - ✅ `https://twitter.com/*`
   - ✅ `https://x.com/*`
   - ✅ `https://www.youtube.com/*`
   - ✅ `https://www.facebook.com/*`

### Step 3: Test the Extension

1. Go to http://3.235.236.139/linkogenei
2. Generate a new token
3. Copy the token
4. Click the extension icon in Chrome
5. Paste the token
6. Click "Activate Extension"
7. Go to any LinkedIn/Instagram post
8. Click "Save to Genei" button
9. Post should be saved successfully! ✅

---

## If Extension Still Doesn't Work

### Option 1: Remove and Reload Extension

1. Go to `chrome://extensions/`
2. Click "Remove" on LinkoGenei extension
3. Click "Load unpacked"
4. Select the `ContentGenei/extension` folder
5. Extension will be reinstalled with new permissions

### Option 2: Check Backend Server

Make sure backend is running:

```bash
# SSH to AWS
ssh ubuntu@3.235.236.139

# Check if backend is running
ps aux | grep python | grep app.py

# If not running, start it
cd /home/ubuntu/ContentGenei/backend
source venv/bin/activate
nohup python3 app.py > backend.log 2>&1 &

# Check logs
tail -f backend.log
```

### Option 3: Check Backend URL in Extension

1. Click extension icon
2. Check "Backend Server" dropdown
3. Make sure "AWS (3.235.236.139)" is selected
4. If not, select it and try again

---

## Why This Was Needed

The Chrome extension needs explicit permission to communicate with your backend server. Without `http://3.235.236.139/*` in the `host_permissions`, the extension couldn't make API calls to save posts.

Now that it's added, the extension can:
- ✅ Connect to your AWS backend
- ✅ Save posts to MongoDB
- ✅ Fetch saved posts
- ✅ Manage categories

---

## Quick Checklist

- [ ] Reload extension in Chrome (`chrome://extensions/` → 🔄 Reload)
- [ ] Verify `http://3.235.236.139/*` appears in Site access
- [ ] Generate new token from LinkoGenei page
- [ ] Paste token in extension
- [ ] Test saving a post
- [ ] Verify post appears in LinkoGenei page

---

**That's it!** The extension should now work with your AWS backend. 🎉
