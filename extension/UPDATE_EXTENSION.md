# 🔄 Update Your Chrome Extension

The extension has been updated to use your production backend on Render.

## What Changed

Updated these files to use production URLs:
- `content.js` - Now points to `https://contentgenei.onrender.com/api`
- `background.js` - Now points to `https://contentgenei.onrender.com/api`
- `popup.js` - Now points to production backend and Vercel frontend

## How to Update the Extension

### Option 1: Reload Extension (Quick - 30 seconds)

1. Open Chrome and go to: `chrome://extensions/`
2. Find "LinkoGenei" extension
3. Click the refresh/reload icon (🔄)
4. Done! The extension now uses production URLs

### Option 2: Reinstall Extension (If reload doesn't work - 1 minute)

1. Open Chrome and go to: `chrome://extensions/`
2. Find "LinkoGenei" extension
3. Click "Remove"
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked"
6. Select the `extension` folder from your project
7. Done!

## Test the Extension

1. Go to LinkedIn, Instagram, Twitter, or YouTube
2. Click the extension icon
3. Enter your token (get from: https://content-genei-dhphy2e82-ps8760s-projects.vercel.app/linkogenei)
4. Click "Activate"
5. You should see "Extension activated successfully!"
6. Try saving a post - it should work now!

## Important Notes

⚠️ **The extension will only work AFTER you add the environment variables to Render!**

The extension needs:
- Backend to be running on Render ✅ (already deployed)
- Databases to be connected ❌ (need to add env variables)
- MongoDB specifically for LinkoGenei ❌ (need to add MONGODB_URI)

So the order is:
1. ✅ Update extension files (just did this)
2. ⏳ Add environment variables to Render (do this next - see QUICK_FIX_GUIDE.md)
3. ⏳ Wait for Render to redeploy (3-5 minutes)
4. ✅ Reload extension in Chrome
5. ✅ Test - everything works!

## Troubleshooting

### "Failed to connect to server"
- Make sure you added all environment variables to Render
- Check Render deployment is complete (green checkmark)
- Wait 3-5 minutes after adding variables

### "Invalid token"
- Generate a new token from: https://content-genei-dhphy2e82-ps8760s-projects.vercel.app/linkogenei
- Make sure you're logged in to the web app first

### Extension not updating
- Try Option 2 (reinstall)
- Clear browser cache: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
- Restart Chrome

## Development vs Production

If you want to switch back to local development:

**For local development:**
```javascript
const API_URL = 'http://localhost:5001/api';
```

**For production (current):**
```javascript
const API_URL = 'https://contentgenei.onrender.com/api';
```

Just change the URL in:
- `extension/content.js`
- `extension/background.js`
- `extension/popup.js`

---

**Next Step:** Follow QUICK_FIX_GUIDE.md to add environment variables to Render!
