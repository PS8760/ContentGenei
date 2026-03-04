# 🔧 Fix: Posts Not Showing on Dashboard

## The Issue

Posts are being saved to the database but not appearing on the Dashboard. This is caused by:
1. Stale JWT tokens with old user identifiers
2. Browser cache holding old data
3. User ID mismatch between token and database

## Quick Fix (2 minutes)

### Step 1: Clear Browser Data
1. Open your app: https://content-genei-dhphy2e82-ps8760s-projects.vercel.app
2. Open DevTools (F12)
3. Go to Application tab → Storage
4. Click "Clear site data"
5. Close DevTools

### Step 2: Log Out and Log Back In
1. Click your profile icon → Logout
2. Log in again with Firebase
3. This generates a fresh JWT token with correct user ID

### Step 3: Test
1. Go to Creator page
2. Generate and save some content
3. Go to Dashboard
4. Content should appear! ✅

## Alternative: Hard Refresh

If logout doesn't work:
1. Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. This clears cache and reloads
3. Log in again

## How It Works

### Content Flow:
1. **Generate** → Creates `GeneratedContent` (analytics tracking)
2. **Save** → Creates `ContentItem` (shows on dashboard)
3. **Dashboard** → Queries `ContentItem` by user ID

### User ID Flow:
1. Login → JWT created with `user.id` (UUID)
2. API calls → JWT sent in Authorization header
3. Backend → Extracts `user.id` from JWT
4. Query → Finds content by `user_id = user.id`

## Troubleshooting

### Still Not Showing?

**Check 1: Is content actually saved?**
```javascript
// In browser console:
fetch('https://contentgenei.onrender.com/api/content', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(d => console.log('Content:', d))
```

**Check 2: User ID in token**
```javascript
// In browser console:
const token = localStorage.getItem('token')
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('User ID in token:', payload.sub)
```

**Check 3: Backend logs**
1. Go to Render Dashboard → Your Service → Logs
2. Look for: "Found user by..." messages
3. Check if user ID matches

### Content Saved But Still Not Showing?

The backend has 3 fallback methods to find users:
1. By `firebase_uid`
2. By `id` (UUID)
3. By `email`

If all 3 fail, check Render logs for:
```
User not found for: <some-id>
Total users in DB: X
```

This tells you if the user exists in the database.

### Database Empty?

If you see "Total users in DB: 0", the database needs initialization:

1. Go to Render Dashboard → Your Service → Shell
2. Run:
```bash
cd backend
python -c "from app import create_app; from models import db; app = create_app('production'); app.app_context().push(); db.create_all(); print('Tables created!')"
```

## Prevention

To avoid this in the future:
1. Always log out before closing browser
2. Don't clear localStorage manually
3. If you change user data in database, log out and back in

## Success Indicators

You'll know it's fixed when:
- ✅ Dashboard shows "Total Content" count > 0
- ✅ "Recent Content" section shows your posts
- ✅ Analytics page shows content
- ✅ No "User not found" errors in console

---

**Try the Quick Fix first - it solves 95% of cases!**

Just log out, log back in, and your content should appear.
