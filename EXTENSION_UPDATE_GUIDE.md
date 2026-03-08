# Chrome Extension Update Guide - AWS Backend

## ✅ Extension Updated for AWS

**Backend URL:** `http://52.71.190.153/api`  
**Dashboard URL:** `http://52.71.190.153/linkogenei`

### Files Updated:
- `extension/popup.js` - Backend API URL and dashboard links
- `extension/content.js` - Backend API URL for saving posts

---

## 🔄 How to Update Extension in Chrome

### Step 1: Open Chrome Extensions

1. Open Chrome browser
2. Go to: `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)

### Step 2: Remove Old Extension (Optional)

If you have the old version installed:
1. Find "LinkoGenei" extension
2. Click "Remove"
3. Confirm removal

### Step 3: Load Updated Extension

1. Click "Load unpacked" button
2. Navigate to: `ContentGenei/extension/` folder
3. Select the folder and click "Open"
4. Extension will be installed

### Step 4: Verify Installation

You should see:
- Extension icon in Chrome toolbar
- Name: "LinkoGenei"
- Version: 1.0
- Status: Enabled

---

## 🔑 Activate Extension

### Step 1: Generate Token

1. Open: `http://52.71.190.153/linkogenei`
2. Login to your account
3. Click "Generate Access Token"
4. Copy the token that appears

### Step 2: Activate Extension

1. Click the LinkoGenei extension icon in Chrome
2. Paste the token in the input field
3. Click "Activate Extension"
4. Status should change to "✅ Extension Active"

---

## 🧪 Test Extension

### Test 1: Save from Instagram

1. Go to Instagram: `https://www.instagram.com/`
2. Find any post
3. Look for "Save to Genei" button
4. Click it
5. Should see success message

### Test 2: View Saved Posts

1. Click extension icon
2. Click "Open Dashboard"
3. Should open: `http://52.71.190.153/linkogenei`
4. Should see your saved posts

### Test 3: Check Stats

Extension popup should show:
- Saved Posts: X
- Categories: Y

---

## 🔧 Extension Configuration

### Current Settings:

**Backend API:**
```javascript
const API_URL = 'http://52.71.190.153/api';
```

**Dashboard URL:**
```javascript
url: 'http://52.71.190.153/linkogenei'
```

**Supported Platforms:**
- ✅ Instagram
- ✅ LinkedIn
- ✅ Twitter/X
- ✅ Facebook
- ✅ YouTube

---

## 🐛 Troubleshooting

### Issue: Extension not appearing

**Solution:**
1. Go to `chrome://extensions/`
2. Check if "LinkoGenei" is listed
3. Make sure it's enabled
4. Try reloading the extension

### Issue: "Invalid or expired token"

**Solution:**
1. Go to `http://52.71.190.153/linkogenei`
2. Generate a new token
3. Re-activate extension with new token

### Issue: "Save to Genei" button not showing

**Solution:**
1. Refresh the social media page
2. Check extension is activated (click icon)
3. Check browser console for errors (F12)

### Issue: CORS errors

**Check backend CORS settings:**
```bash
# SSH to AWS
ssh -i your-key.pem ec2-user@52.71.190.153

# Check .env file
cat /path/to/backend/.env | grep CORS
```

Should include:
```
CORS_ORIGINS=http://52.71.190.153,https://52.71.190.153
```

### Issue: Posts not saving

**Check backend logs:**
```bash
pm2 logs contentgenei-backend | grep "save-post"
```

Should see:
```
POST /api/linkogenei/save-post - Request received
✅ Post saved successfully
```

---

## 📊 Extension Features

### Popup Features:
- ✅ Token activation
- ✅ View saved posts count
- ✅ View categories count
- ✅ Open dashboard button
- ✅ Deactivate extension

### Content Script Features:
- ✅ Inject "Save to Genei" buttons
- ✅ Detect platform (Instagram, LinkedIn, etc.)
- ✅ Extract post data (URL, title, image)
- ✅ Save to backend
- ✅ Show success/error messages

---

## 🔐 Security Notes

### Token Storage:
- Tokens stored in Chrome's local storage
- Tokens are user-specific
- Tokens expire after 30 days
- Can be revoked anytime from dashboard

### Permissions:
Extension requires:
- `storage` - Store activation token
- `activeTab` - Access current tab
- Host permissions for social media sites

---

## 📝 Extension Manifest

```json
{
  "manifest_version": 3,
  "name": "LinkoGenei",
  "version": "1.0",
  "description": "Save posts from social media to your ContentGenei dashboard",
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "https://www.instagram.com/*",
    "https://www.linkedin.com/*",
    "https://twitter.com/*",
    "https://www.facebook.com/*",
    "https://www.youtube.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": [
        "https://www.instagram.com/*",
        "https://www.linkedin.com/*",
        "https://twitter.com/*",
        "https://www.facebook.com/*",
        "https://www.youtube.com/*"
      ],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

---

## 🎯 Quick Start Checklist

- [ ] Extension loaded in Chrome
- [ ] Extension enabled
- [ ] Token generated from dashboard
- [ ] Extension activated with token
- [ ] Status shows "✅ Extension Active"
- [ ] "Save to Genei" button appears on social media
- [ ] Test save a post
- [ ] Post appears in dashboard
- [ ] Stats update in extension popup

---

## 📞 Need Help?

**Check extension console:**
1. Go to `chrome://extensions/`
2. Find LinkoGenei
3. Click "Inspect views: service worker"
4. Check console for errors

**Check content script console:**
1. Go to any social media site
2. Press F12 (open DevTools)
3. Check console for "LinkoGenei" messages

**Test API connection:**
```javascript
// Run in browser console
fetch('http://52.71.190.153/api/health')
  .then(r => r.json())
  .then(console.log);
```

---

## 🚀 Extension Ready!

Your LinkoGenei extension is now configured for AWS backend at `http://52.71.190.153/`

**Next Steps:**
1. Load extension in Chrome
2. Generate token from dashboard
3. Activate extension
4. Start saving posts!

🎉 Happy saving!
