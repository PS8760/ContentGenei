# AWS Deployment Guide - LinkoGenei & Analytics Update

## ✅ GitHub Update Complete

**Commit:** `5067d32`  
**Files Updated:**
- `backend/routes/linkogenei.py` - Enhanced logging
- `backend/services/mongodb_service.py` - Fixed MockCollection with cursor support
- `frontend/src/pages/LinkoGenei.jsx` - Added debugging logs
- `frontend/src/pages/Analytics.jsx` - Tab-based analytics
- `frontend/src/pages/ContentAnalytics.jsx` - NEW: Detailed content analysis
- `frontend/src/pages/SocialAnalytics.jsx` - Enhanced social analytics

---

## 🚀 AWS Deployment Steps

### Step 1: Pull Latest Code on AWS EC2
˝
SSH into your AWS EC2 instance:

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

Navigate to your backend directory and pull:

```bash
cd /path/to/ContentGenei/backend
git pull origin main
```

### Step 2: Restart Backend Service

If using PM2:
```bash
pm2 restart contentgenei-backend
pm2 logs contentgenei-backend
```

If using systemd:
```bash
sudo systemctl restart contentgenei-backend
sudo systemctl status contentgenei-backend
```

If running manually:
```bash
# Stop current process (Ctrl+C)
# Then restart
source venv/bin/activate
python app.py
```

### Step 3: Update Frontend on AWS

Navigate to frontend directory:

```bash
cd /path/to/ContentGenei/frontend
git pull origin main
```

Install any new dependencies:
```bash
npm install
```

Rebuild the frontend:
```bash
npm run build
```

### Step 4: Update Nginx (if applicable)

If you're serving the frontend through Nginx, copy the build:

```bash
sudo cp -r dist/* /var/www/contentgenei/
sudo systemctl restart nginx
```

### Step 5: Verify Deployment

**Backend Health Check:**
```bash
curl http://your-backend-url/api/health
```

**Frontend Check:**
- Open: `http://your-aws-ip` or your domain
- Navigate to LinkoGenei page
- Check browser console for logs
- Try saving a post from extension

**Backend Logs Check:**
```bash
# If using PM2
pm2 logs contentgenei-backend

# If using systemd
sudo journalctl -u contentgenei-backend -f

# If running manually
# Check terminal output
```

---

## 🔧 Environment Variables to Verify

Make sure these are set in your AWS backend `.env`:

```bash
# MongoDB (Required for LinkoGenei)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=linkogenei

# Backend URL
FLASK_ENV=production

# CORS (Add your AWS domain)
CORS_ORIGINS=http://your-aws-ip,https://your-domain.com
```

---

## 🧪 Testing After Deployment

### Test 1: LinkoGenei Token Generation

```bash
# Get JWT token first (login to get this)
JWT_TOKEN="your-jwt-token"

# Generate extension token
curl -X POST http://your-backend-url/api/linkogenei/generate-token \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "token": "abc123...",
  "message": "Token generated successfully"
}
```

### Test 2: Save Post

```bash
EXTENSION_TOKEN="token-from-step-1"

curl -X POST http://your-backend-url/api/linkogenei/save-post \
  -H "Authorization: Bearer $EXTENSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://instagram.com/p/test",
    "platform": "instagram",
    "title": "Test Post",
    "category": "Test"
  }'
```

Expected response:
```json
{
  "success": true,
  "post_id": "...",
  "post": {...}
}
```

### Test 3: Get Posts

```bash
curl http://your-backend-url/api/linkogenei/posts \
  -H "Authorization: Bearer $EXTENSION_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "posts": [...],
  "total": 1
}
```

### Test 4: Analytics Page

1. Open browser: `http://your-aws-domain/analytics`
2. Should see two tabs: "Content Analytics" and "Social Analytics"
3. Click each tab to verify they load

### Test 5: Content Analytics

1. Go to: `http://your-aws-domain/content-analytics`
2. Should see generated content list
3. Click "Analyze" button on any content
4. Should see detailed analysis modal

---

## 📊 What's New

### LinkoGenei Improvements:
- ✅ Fixed MockCollection to support `.sort()`, `.skip()`, `.limit()`
- ✅ Added MockCursor class for proper cursor chaining
- ✅ Comprehensive logging for debugging
- ✅ Better error messages
- ✅ Posts now display correctly in dashboard

### Analytics Enhancements:
- ✅ Tab-based navigation (Content Analytics | Social Analytics)
- ✅ New ContentAnalytics page with detailed analysis
- ✅ Readability score calculation
- ✅ SEO score analysis
- ✅ Engagement potential metrics
- ✅ Sentiment analysis
- ✅ Keyword density analysis

---

## 🐛 Troubleshooting

### Issue: Posts not displaying

**Check backend logs:**
```bash
pm2 logs contentgenei-backend | grep "Getting posts"
```

Should see:
```
Getting posts for user xxx: category=all, platform=all
Found X posts
```

**Check MongoDB connection:**
```bash
pm2 logs contentgenei-backend | grep "MongoDB"
```

Should see either:
- `✅ MongoDB connected successfully` (real DB)
- `⚠️ MongoDB unavailable: ... Using in-memory mock database` (mock DB)

### Issue: Extension token invalid

**Regenerate token:**
1. Login to dashboard
2. Go to LinkoGenei page
3. Click "Generate Access Token"
4. Copy new token
5. Re-activate extension with new token

### Issue: CORS errors

**Update CORS_ORIGINS in `.env`:**
```bash
CORS_ORIGINS=http://your-aws-ip,https://your-domain.com,http://localhost:5173
```

Then restart backend.

---

## 📝 Deployment Checklist

- [ ] Code pulled from GitHub on AWS
- [ ] Backend restarted
- [ ] Frontend rebuilt and deployed
- [ ] Environment variables verified
- [ ] MongoDB connection working (or mock DB active)
- [ ] Health check endpoint responding
- [ ] LinkoGenei token generation working
- [ ] Posts can be saved and retrieved
- [ ] Analytics tabs loading correctly
- [ ] Content Analytics showing analysis
- [ ] Extension connecting to AWS backend
- [ ] No CORS errors in browser console

---

## 🎯 Next Steps

1. **Update Extension Backend URL** (if needed):
   - Edit `extension/popup.js` and `extension/content.js`
   - Change `API_URL` to your AWS backend URL
   - Reload extension in Chrome

2. **Monitor Logs**:
   ```bash
   pm2 logs contentgenei-backend --lines 100
   ```

3. **Test All Features**:
   - Content generation
   - Chat with Alex
   - LinkoGenei post saving
   - Analytics viewing
   - Social analytics

---

## 📞 Support

If you encounter issues:
1. Check backend logs: `pm2 logs contentgenei-backend`
2. Check browser console (F12)
3. Verify MongoDB connection
4. Test API endpoints with curl
5. Check CORS configuration

**Deployment Complete!** 🎉
