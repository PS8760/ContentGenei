# 🔄 Extension Update Required

## Issue Fixed
The Chrome extension was pointing to the old AWS IP address. This has been fixed.

## What Changed
- ✅ Updated AWS IP from `52.71.190.153` to `3.235.236.139`
- ✅ Fixed Apify actor ID format for Instagram scraping
- ✅ Both `popup.js` and `content.js` updated

## How to Update the Extension

### Option 1: Reload Extension (Quick)
1. Open Chrome and go to `chrome://extensions/`
2. Find "LinkoGenei" extension
3. Click the **reload icon** (circular arrow) on the extension card
4. Done! The extension will use the new IP address

### Option 2: Reinstall Extension (If reload doesn't work)
1. Go to `chrome://extensions/`
2. Remove the old LinkoGenei extension
3. Click "Load unpacked"
4. Select the `ContentGenei/extension` folder
5. Extension installed with new IP!

## Verify It's Working

### Test 1: Check Extension Popup
1. Click the LinkoGenei extension icon
2. Backend Server should show: **AWS (3.235.236.139)**
3. If it still shows old IP, reload the extension

### Test 2: Activate Extension
1. Go to http://3.235.236.139/linkogenei
2. Click "Generate Access Token"
3. Copy the token
4. Click LinkoGenei extension icon
5. Paste token and click "Activate Extension"
6. Should show "Extension activated successfully!"

### Test 3: Save a Post
1. Go to Instagram.com
2. Find any post
3. Click the LinkoGenei button that appears
4. Select category and save
5. Check http://3.235.236.139/linkogenei to see saved post

## Social Analytics Fix

The Apify integration has also been fixed:
- ✅ Changed actor ID from `apify/instagram-profile-scraper` to `apify~instagram-profile-scraper`
- ✅ This fixes the 404 error when connecting Instagram accounts

### Test Social Analytics
1. Go to http://3.235.236.139
2. Navigate to Social Analytics
3. Click Instagram platform
4. Enter: `https://instagram.com/instagram`
5. Click "Connect & Analyze"
6. Wait 30-60 seconds
7. Should see real Instagram data!

## Files Updated

### Extension Files
- `extension/popup.js` - Updated AWS IP
- `extension/content.js` - Updated AWS IP

### Backend Files
- `backend/services/apify_service.py` - Fixed actor ID format

## Current Status

✅ Backend deployed and running  
✅ Extension files updated in repository  
⚠️ Extension needs to be reloaded in Chrome  
✅ Social Analytics Apify integration fixed  

## Next Steps

1. **Reload the extension** in Chrome (see instructions above)
2. **Test LinkoGenei** functionality
3. **Test Social Analytics** with Instagram
4. Enjoy the working features!

## Troubleshooting

### Extension still shows old IP
**Solution**: 
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Reload" on LinkoGenei extension
4. If still not working, remove and reinstall

### "Failed to connect to server" error
**Solution**:
1. Make sure you reloaded the extension
2. Check that backend is running: http://3.235.236.139/api/health
3. Try clearing extension storage:
   - Go to `chrome://extensions/`
   - Click "Details" on LinkoGenei
   - Scroll down and click "Clear storage"
   - Reload extension

### Social Analytics 404 error
**Solution**: Backend has been updated with the fix. Just refresh the page.

## Support

If issues persist:
1. Check backend health: http://3.235.236.139/api/health
2. Check browser console for errors (F12)
3. Verify extension is using correct IP in popup

---

**All fixes deployed!** Just reload your Chrome extension to use the new IP address.
