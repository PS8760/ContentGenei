# 🚀 Instagram OAuth - Quick Start Guide

## ⚡ 3-Minute Setup

### 1. Run Setup Script
```bash
# Windows
setup_instagram_oauth.bat

# Linux/Mac
bash setup_instagram_oauth.sh
```

### 2. Configure Instagram Credentials
Edit `backend/.env`:
```bash
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/platforms/instagram/callback
INSTAGRAM_SCOPES=instagram_business_basic
INSTAGRAM_FRONTEND_URL=http://localhost:5173
```

**Get credentials:** https://developers.facebook.com/

### 3. Start Servers
```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
python run.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Test OAuth Flow
1. Go to http://localhost:5173
2. Sign in / Create account
3. Complete onboarding
4. Select "Instagram" platform
5. Click "Finish"
6. Authorize on Instagram
7. Should redirect back with success message

---

## 🔍 Quick Verification

### Check Tables Created:
```bash
sqlite3 backend/instance/contentgenie_dev.db ".tables"
# Should show: instagram_connections, oauth_states
```

### Check State Storage:
```sql
sqlite3 backend/instance/contentgenie_dev.db
SELECT * FROM oauth_states;
```

### Check Connections:
```sql
SELECT * FROM instagram_connections;
```

---

## 🐛 Troubleshooting

### Issue: Migration fails
**Solution:** Activate virtual environment first
```bash
cd backend
venv\Scripts\activate  # Windows
python migrate_instagram_oauth.py
```

### Issue: "Module not found" error
**Solution:** Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Issue: OAuth redirect fails
**Solution:** Check redirect URI matches exactly
- Backend .env: `http://localhost:5000/api/platforms/instagram/callback`
- Instagram app settings: Same URL

### Issue: State validation fails
**Solution:** Check backend logs for specific error
```bash
# Common issues:
# - State expired (>10 minutes old)
# - State already used
# - User mismatch
```

---

## 📊 What Was Implemented

### Backend (6 endpoints):
- `GET /api/platforms/instagram/auth` - Generate OAuth URL
- `GET /api/platforms/instagram/callback` - Handle callback
- `POST /api/platforms/instagram/exchange-token` - Exchange code for token
- `GET /api/platforms/instagram/connections` - Get connections
- `DELETE /api/platforms/instagram/connections/:id` - Disconnect
- `POST /api/platforms/instagram/cleanup-states` - Cleanup expired states

### Frontend (3 components):
- `InstagramCallback.jsx` - Callback handler
- `platformService.js` - Platform orchestration
- Updated `Onboarding.jsx` - OAuth trigger

### Database (2 tables):
- `instagram_connections` - Store connections
- `oauth_states` - CSRF protection

---

## 🎯 Key Features

✅ Server-side state validation  
✅ State expires after 10 minutes  
✅ State can only be used once  
✅ State is user-bound  
✅ Atomic transactions  
✅ Improved error recovery  
✅ No ProtectedRoute on callback  
✅ Modular architecture  

---

## 📖 Full Documentation

See `INSTAGRAM_OAUTH_IMPLEMENTATION_COMPLETE.md` for:
- Complete architecture details
- Security features
- OAuth flow diagram
- Testing checklist
- Future enhancements

---

## ✅ Success Indicators

After setup, you should see:
- ✅ Two new tables in database
- ✅ Backend starts without errors
- ✅ Frontend compiles successfully
- ✅ OAuth redirect works
- ✅ Token exchange succeeds
- ✅ Connection saved in database

---

## 🎉 You're Ready!

The Instagram OAuth integration is complete and ready to use.

**Next:** Test the OAuth flow and verify everything works!
