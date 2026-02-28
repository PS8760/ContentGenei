# LinkoGenei - Complete Setup & Usage Guide

## 🎯 Overview

LinkoGenei is a Chrome extension that allows you to save social media posts from Instagram, LinkedIn, Twitter/X, and Facebook to your ContentGenie dashboard. Posts are saved ONLY when you explicitly click the "Save to Genei" button on each post.

---

## ✅ Current Status

- **Backend**: Running on port 5001 ✅
- **MongoDB**: Connected and operational ✅
- **Extension**: Configured and ready ✅
- **Frontend Dashboard**: Available at http://localhost:5173/linkogenei ✅

---

## 🚀 Quick Start

### 1. Start the Backend (if not running)

```bash
cd backend
source venv/bin/activate
python run.py
```

Backend will start on: http://localhost:5001

### 2. Start the Frontend (if not running)

```bash
cd frontend
npm run dev
```

Frontend will start on: http://localhost:5173

### 3. Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The LinkoGenei extension icon should appear in your toolbar

### 4. Generate Token

1. Open http://localhost:5173/linkogenei in your browser
2. Log in to your ContentGenie account
3. Click "Generate Token"
4. Copy the generated token

### 5. Activate Extension

1. Click the LinkoGenei extension icon in Chrome toolbar
2. Paste your token in the input field
3. Click "Activate"
4. Extension is now active! ✅

---

## 📖 How to Use

### Saving Posts

1. **Visit a supported platform**:
   - Instagram: https://www.instagram.com
   - LinkedIn: https://www.linkedin.com
   - Twitter: https://twitter.com
   - X: https://x.com

2. **Look for the "Save to Genei" button**:
   - Appears at the top-right corner of each post
   - Purple gradient button with bookmark icon

3. **Click to save**:
   - Click "Save to Genei" on any post you want to save
   - Button changes to "Saving..." with spinner
   - Success: Button turns green and shows "Saved!"
   - Error: Shows error notification

4. **View saved posts**:
   - Open http://localhost:5173/linkogenei
   - See all your saved posts
   - Filter by platform or category
   - Click to open original post

---

## 🎨 Features

### Extension Features

- ✅ **One-Click Save**: Save any post with a single click
- ✅ **Visual Feedback**: Button states (idle, saving, saved, error)
- ✅ **Platform Detection**: Automatically detects Instagram, LinkedIn, Twitter/X
- ✅ **Duplicate Prevention**: Won't save the same post twice
- ✅ **Notifications**: Success/error messages
- ✅ **Token-Based Auth**: Secure authentication

### Dashboard Features

- ✅ **View All Posts**: See all saved posts in one place
- ✅ **Filter by Platform**: Instagram, LinkedIn, Twitter, etc.
- ✅ **Filter by Category**: Organize posts into categories
- ✅ **Create Categories**: Custom categories with colors
- ✅ **Statistics**: Total posts, categories, platform breakdown
- ✅ **Direct Links**: Click to open original post
- ✅ **Delete Posts**: Remove posts you no longer need
- ✅ **Token Management**: Generate, regenerate, revoke tokens

---

## 🔧 Technical Details

### Architecture

```
┌─────────────────┐
│  Chrome         │
│  Extension      │
│  (content.js)   │
└────────┬────────┘
         │ HTTP POST
         │ /api/linkogenei/save-post
         ▼
┌─────────────────┐
│  Flask Backend  │
│  (Port 5001)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MongoDB        │
│  (linkogenei)   │
└─────────────────┘
```

### Data Flow

1. **User clicks "Save to Genei"** on a post
2. **Extension extracts** post URL and platform
3. **Extension sends** POST request to backend with token
4. **Backend verifies** token and user identity
5. **Backend saves** post to MongoDB
6. **MongoDB stores** post with unique (user_id, url) index
7. **Backend returns** success/error response
8. **Extension shows** visual feedback to user

### Database Schema

**Collection: `saved_posts`**

```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "url": "string",
  "platform": "string",
  "title": "string",
  "category": "string",
  "notes": "string",
  "tags": ["array"],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Indexes**:
- `(user_id, created_at)` - Fast queries
- `(user_id, url)` - Unique constraint, prevent duplicates
- `(user_id, category)` - Category filtering
- `(user_id, platform)` - Platform filtering

**Collection: `categories`**

```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "name": "string",
  "color": "string",
  "post_count": "number",
  "created_at": "datetime"
}
```

---

## 🔐 Security

### Token-Based Authentication

- Tokens are generated server-side using `secrets.token_urlsafe(32)`
- Tokens are stored in-memory on backend (production: use Redis)
- Tokens are stored in Chrome's local storage
- All API requests require `Authorization: Bearer <token>` header

### CORS Configuration

Backend allows requests from:
- Social media platforms (Instagram, LinkedIn, Twitter, etc.)
- Chrome extensions
- Frontend (localhost:5173)

### Data Privacy

- Posts are stored per-user (user_id isolation)
- Only post URLs are saved (no content scraping)
- Users can delete their posts anytime
- Tokens can be revoked anytime

---

## 🐛 Troubleshooting

### Extension Not Working

**Problem**: "Save to Genei" buttons not appearing

**Solutions**:
1. Check extension is activated (click icon, should show "Active")
2. Verify token is valid (regenerate if needed)
3. Reload the social media page
4. Check browser console for errors (F12)

---

**Problem**: "Failed to fetch" error

**Solutions**:
1. Verify backend is running: `curl http://localhost:5001/api/health`
2. Check CORS headers are set in `backend/app.py`
3. Verify extension has host permissions in `manifest.json`
4. Check browser console for detailed error

---

**Problem**: "Invalid token" error

**Solutions**:
1. Generate a new token from dashboard
2. Paste new token in extension popup
3. Click "Activate" again

---

### Backend Issues

**Problem**: Backend not starting

**Solutions**:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

---

**Problem**: MongoDB connection error

**Solutions**:
1. Check MongoDB is running: `brew services list | grep mongodb`
2. Start MongoDB: `brew services start mongodb-community`
3. Verify connection: `mongosh mongodb://localhost:27017/`

---

### Frontend Issues

**Problem**: Dashboard not loading

**Solutions**:
```bash
cd frontend
npm install
npm run dev
```

---

**Problem**: "Cannot connect to server" error

**Solutions**:
1. Verify backend is running on port 5001
2. Check `frontend/src/services/api.js` has correct API URL
3. Check browser console for CORS errors

---

## 📊 Monitoring

### Check System Status

```bash
# Test backend
curl http://localhost:5001/api/health

# Test LinkoGenei API
curl http://localhost:5001/api/linkogenei/test

# Check MongoDB
mongosh mongodb://localhost:27017/linkogenei
> db.saved_posts.countDocuments()
```

### View Logs

**Backend logs**:
```bash
cd backend
tail -f logs/app.log  # if logging to file
# or check terminal where backend is running
```

**Extension logs**:
- Open Chrome DevTools (F12) on any social media page
- Go to Console tab
- Look for LinkoGenei messages

---

## 🎯 Usage Examples

### Example 1: Save Instagram Post

1. Go to https://www.instagram.com
2. Scroll through your feed
3. See a post you like
4. Click "Save to Genei" button (top-right of post)
5. Button turns green: "Saved!"
6. Open dashboard to see it saved

### Example 2: Organize by Category

1. Open http://localhost:5173/linkogenei
2. Click "Create Category"
3. Enter name: "Coding Tips"
4. Choose color: Blue
5. Click "Create"
6. Click on a saved post
7. Select category: "Coding Tips"
8. Post is now categorized

### Example 3: Filter Posts

1. Open dashboard
2. Use "Filter by Platform" dropdown
3. Select "Instagram"
4. See only Instagram posts
5. Use "Filter by Category" dropdown
6. Select "Coding Tips"
7. See only Instagram posts in Coding Tips category

---

## 📁 File Structure

```
ContentGenei/
├── extension/
│   ├── manifest.json          # Extension configuration
│   ├── content.js             # Main content script
│   ├── content.css            # Button styles
│   ├── popup.html             # Extension popup UI
│   ├── popup.js               # Popup logic
│   ├── background.js          # Background service worker
│   └── icons/                 # Extension icons
│
├── backend/
│   ├── app.py                 # Flask app with CORS
│   ├── routes/
│   │   └── linkogenei.py      # LinkoGenei API routes
│   └── services/
│       └── mongodb_service.py # MongoDB operations
│
└── frontend/
    └── src/
        └── pages/
            └── LinkoGenei.jsx # Dashboard page
```

---

## 🔄 Token Management

### Generate Token

1. Log in to ContentGenie
2. Go to http://localhost:5173/linkogenei
3. Click "Generate Token"
4. Copy token (shown once)
5. Paste in extension

### Regenerate Token

1. Go to dashboard
2. Click "Regenerate Token"
3. Confirm action
4. Copy new token
5. Update extension with new token
6. Old token is invalidated

### Revoke Token

1. Go to dashboard
2. Click "Revoke Token"
3. Confirm action
4. Extension will stop working
5. Generate new token to reactivate

---

## 📈 Statistics

View your usage statistics on the dashboard:

- **Total Posts**: Number of posts saved
- **Total Categories**: Number of categories created
- **Platform Breakdown**: Posts per platform (Instagram, LinkedIn, etc.)
- **Category Breakdown**: Posts per category

---

## 🎨 Customization

### Change Button Style

Edit `extension/content.css`:

```css
.linkogenei-save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Change colors here */
}
```

### Change Button Position

Edit `extension/content.js`:

```javascript
const PLATFORM_SELECTORS = {
  instagram: {
    buttonPosition: 'top-right',  // Change to 'top-left', 'bottom-right', etc.
  }
}
```

### Add New Platform

1. Edit `extension/manifest.json` - Add to `host_permissions` and `content_scripts.matches`
2. Edit `extension/content.js` - Add platform config to `PLATFORM_SELECTORS`
3. Reload extension

---

## 🚀 Production Deployment

### Backend

1. Use Redis for token storage (not in-memory)
2. Set proper CORS origins (not `*`)
3. Use environment variables for secrets
4. Enable HTTPS
5. Use production MongoDB instance

### Extension

1. Update API_URL to production backend
2. Create production build
3. Submit to Chrome Web Store
4. Update manifest with production permissions

---

## 📝 API Reference

### Generate Token

```
POST /api/linkogenei/generate-token
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "token": "abc123...",
  "message": "Token generated successfully"
}
```

### Verify Token

```
POST /api/linkogenei/verify-token
Authorization: Bearer <EXTENSION_TOKEN>

Response:
{
  "success": true,
  "user_id": "user123",
  "message": "Token verified successfully"
}
```

### Save Post

```
POST /api/linkogenei/save-post
Authorization: Bearer <EXTENSION_TOKEN>
Content-Type: application/json

Body:
{
  "url": "https://www.instagram.com/p/ABC123/",
  "platform": "Instagram",
  "title": "Instagram",
  "saved_at": "2026-02-28T10:30:00Z"
}

Response:
{
  "success": true,
  "post_id": "507f1f77bcf86cd799439011",
  "post": { ... }
}
```

### Get Posts

```
GET /api/linkogenei/posts?category=coding&platform=Instagram&limit=50&skip=0
Authorization: Bearer <EXTENSION_TOKEN>

Response:
{
  "success": true,
  "posts": [ ... ],
  "total": 100,
  "limit": 50,
  "skip": 0
}
```

### Get Statistics

```
GET /api/linkogenei/stats
Authorization: Bearer <EXTENSION_TOKEN>

Response:
{
  "success": true,
  "stats": {
    "total_posts": 150,
    "total_categories": 5,
    "platforms": {
      "Instagram": 80,
      "LinkedIn": 50,
      "Twitter": 20
    },
    "categories": {
      "Coding": 60,
      "Design": 40,
      "Marketing": 50
    }
  }
}
```

---

## ✅ Verification Checklist

- [ ] Backend running on port 5001
- [ ] MongoDB running and connected
- [ ] Frontend running on port 5173
- [ ] Extension loaded in Chrome
- [ ] Token generated from dashboard
- [ ] Token pasted in extension
- [ ] Extension activated
- [ ] "Save to Genei" buttons appear on posts
- [ ] Clicking button saves post
- [ ] Saved posts appear in dashboard
- [ ] Can filter by platform
- [ ] Can filter by category
- [ ] Can create new categories
- [ ] Can delete posts
- [ ] Statistics are accurate

---

## 🎉 Success!

Your LinkoGenei extension is now fully operational! You can save posts from Instagram, LinkedIn, Twitter/X, and Facebook with a single click.

**Key Points to Remember**:
- Posts are saved ONLY when you click "Save to Genei"
- Each post is saved individually (no bulk saving)
- Duplicate posts are prevented automatically
- You can organize posts with categories
- Tokens can be regenerated or revoked anytime

Enjoy saving your favorite social media posts! 🚀
