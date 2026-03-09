# Deploy Final Fixes - Step by Step Guide

## What These Fixes Address

1. ✅ **LinkoGenei Extension Error** - "Cannot connect to server on port 5001"
2. ✅ **Social Analytics UX** - Added "View Analytics" button to make it obvious
3. ⚠️ **Profile Picture Upload** - Not implemented (use Firebase photo for now)

---

## Quick Deploy (Recommended)

### Step 1: Deploy All Fixes to AWS

```bash
cd ContentGenei
./deploy-all-fixes.sh
```

This will:
- Create social_accounts table
- Create LinkoGenei tables (extension_tokens, saved_posts, saved_post_categories)
- Switch LinkoGenei from MongoDB to SQLite
- Add "View Analytics" button to social account cards
- Restart backend and rebuild frontend

### Step 2: Test Everything

#### Test Social Analytics:
1. Go to http://3.235.236.139/social-analytics
2. Connect an Instagram account
3. Click "📊 View Analytics" button on the account card
4. Verify analytics are displayed
5. Refresh page - account should still be there
6. Click X button to delete account

#### Test LinkoGenei Extension:
1. Go to http://3.235.236.139/linkogenei
2. Click "Generate Token"
3. Copy token to Chrome extension
4. Go to any LinkedIn/Instagram post
5. Click "Save to Genei" button
6. Verify post appears in LinkoGenei page
7. Refresh page - post should still be there

---

## Alternative: Install MongoDB (If You Prefer)

If you want to use MongoDB instead of SQLite for LinkoGenei:

### Step 1: SSH to AWS
```bash
ssh ubuntu@3.235.236.139
```

### Step 2: Install MongoDB
```bash
cd /home/ubuntu/ContentGenei
chmod +x install-mongodb-aws.sh
./install-mongodb-aws.sh
```

### Step 3: Update Environment Variables
```bash
cd backend
echo "MONGODB_URI=mongodb://localhost:27017/" >> .env
echo "MONGODB_DB_NAME=linkogenei" >> .env
```

### Step 4: Restart Backend
```bash
sudo systemctl restart contentgenei-backend
sudo systemctl status contentgenei-backend
```

### Step 5: Test Extension
- Generate new token in LinkoGenei page
- Use token in Chrome extension
- Save a post
- Verify it persists

---

## What Changed

### Backend Changes

#### New Models (SQLite):
1. `SocialAccount` - Stores connected social media accounts
2. `ExtensionToken` - Stores Chrome extension access tokens
3. `SavedPost` - Stores posts saved from social media
4. `SavedPostCategory` - Stores categories for organizing posts

#### New Service:
- `linkogenei_service.py` - SQLite-based service (replaces MongoDB)

#### Updated Routes:
- `routes/analytics.py` - Now uses SocialAccount model
- `routes/linkogenei.py` - Now uses linkogenei_service (SQLite)

### Frontend Changes

#### SocialAnalytics.jsx:
- Added "📊 View Analytics" button on each account card
- Made it obvious which account is currently being viewed
- Improved visual feedback

---

## Troubleshooting

### LinkoGenei Extension Still Shows Error

**Check 1: Verify backend is running**
```bash
ssh ubuntu@3.235.236.139
sudo systemctl status contentgenei-backend
```

**Check 2: Verify migrations ran**
```bash
cd /home/ubuntu/ContentGenei/backend
source venv/bin/activate
python3 -c "from app import app; from models import db, SavedPost; app.app_context().push(); print(f'SavedPost table exists: {SavedPost.query.count() >= 0}')"
```

**Check 3: Check backend logs**
```bash
sudo journalctl -u contentgenei-backend -f
```

**Check 4: Generate new token**
- Go to LinkoGenei page
- Click "Generate Token"
- Copy NEW token to extension
- Try saving a post again

### Social Account Not Persisting

**Check 1: Verify migration ran**
```bash
cd /home/ubuntu/ContentGenei/backend
source venv/bin/activate
python3 -c "from app import app; from models import db, SocialAccount; app.app_context().push(); print(f'SocialAccount table exists: {SocialAccount.query.count() >= 0}')"
```

**Check 2: Check browser console**
- Open browser DevTools (F12)
- Go to Console tab
- Look for errors when connecting account

**Check 3: Check backend logs**
```bash
sudo journalctl -u contentgenei-backend -f
```

### Profile Picture Not Showing

**Temporary Solution**: The profile picture from Google Sign-In is available in Firebase. To display it:

1. In Profile page, use `currentUser.photoURL`
2. This will show the Google profile picture
3. For custom upload, we need to implement file upload (not done yet)

---

## Next Steps (Future Enhancements)

### 1. Profile Picture Upload
- Add file upload component in Profile page
- Create `/api/profile/upload-photo` endpoint
- Store images in Firebase Storage or local uploads folder
- Update user model with photo_url field

### 2. More Social Platforms
- Add LinkedIn integration
- Add Twitter/X integration
- Add YouTube integration

### 3. Enhanced Analytics
- Historical data tracking
- Follower growth charts
- Engagement trends
- Best posting times

---

## Summary

### What Works Now:
✅ Social accounts persist in database
✅ Delete functionality for social accounts
✅ Enhanced Instagram analytics
✅ LinkoGenei extension saves posts to SQLite
✅ Posts persist across server restarts
✅ Clear "View Analytics" button
✅ Refresh functionality updates data

### What Needs Work:
⚠️ Profile picture upload (use Firebase photo for now)
⚠️ Other social platforms (LinkedIn, Twitter, YouTube)
⚠️ Historical analytics data

### Deploy Command:
```bash
cd ContentGenei
./deploy-all-fixes.sh
```

**Estimated Deploy Time**: 5-10 minutes

---

**Ready to deploy!** 🚀
