# 🚀 Vercel + Render Deployment Guide

## ✅ Current Setup

- **Frontend**: Vercel
- **Backend**: Render (https://contentgenei.onrender.com)
- **Environment Variable Set**: `VITE_API_URL=https://contentgenei.onrender.com`

---

## 🔧 Step-by-Step Connection Guide

### 1. Update Vercel Environment Variables

Go to your Vercel project settings:

1. **Navigate to**: Vercel Dashboard → Your Project → Settings → Environment Variables

2. **Add/Update these variables**:

```env
# Backend API URL (already set)
VITE_API_URL=https://contentgenei.onrender.com

# Firebase Configuration (from your local .env)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

3. **Important**: Set these for all environments:
   - Production
   - Preview
   - Development

4. **Redeploy** after adding variables:
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

---

### 2. Update Render Environment Variables

Go to your Render dashboard:

1. **Navigate to**: Render Dashboard → Your Service → Environment

2. **Add/Update these variables**:

```env
# Flask Configuration
FLASK_ENV=production
FLASK_APP=app.py

# Database URLs
DATABASE_URL=your-postgresql-url
MONGODB_URI=your-mongodb-atlas-url

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Groq API
GROQ_API_KEY=your-groq-api-key

# JWT Secret
JWT_SECRET_KEY=your-secret-key

# CORS Origins (add your Vercel URL)
CORS_ORIGINS=https://your-app.vercel.app,https://*.vercel.app

# Python Version
PYTHON_VERSION=3.11.0
```

3. **Save Changes** - Render will automatically redeploy

---

### 3. Fix CORS Issues (If Any)

Your backend already has CORS configured, but let's verify:

#### Check Current CORS in `backend/app.py`:

The configuration should allow your Vercel domain. If you see CORS errors, update:

```python
# In backend/app.py, update CORS_ORIGINS
cors_origins = [
    "http://localhost:5173",
    "https://your-app.vercel.app",  # Add your actual Vercel URL
    "https://*.vercel.app"  # Wildcard for preview deployments
]
```

Then commit and push to trigger Render redeploy.

---

### 4. Update Frontend API Configuration

Verify your `frontend/src/services/api.js` uses the environment variable:

```javascript
class ApiService {
  constructor() {
    // This should use VITE_API_URL from environment
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
    console.log('API Base URL:', this.baseURL) // Debug log
  }
  // ...
}
```

---

### 5. Test the Connection

#### A. Check Backend Health

Open in browser:
```
https://contentgenei.onrender.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-03-04T..."
}
```

#### B. Check Frontend API Calls

1. Open your Vercel app: `https://your-app.vercel.app`
2. Open Browser DevTools (F12)
3. Go to Network tab
4. Try to login or register
5. Check if API calls go to `https://contentgenei.onrender.com`

#### C. Common Issues to Check:

**Issue 1: CORS Error**
```
Access to fetch at 'https://contentgenei.onrender.com/api/...' 
from origin 'https://your-app.vercel.app' has been blocked by CORS policy
```

**Solution**: Add your Vercel URL to `CORS_ORIGINS` in Render environment variables

**Issue 2: 404 Not Found**
```
GET https://contentgenei.onrender.com/api/auth/verify-token 404
```

**Solution**: Check that routes are registered in `backend/app.py`

**Issue 3: 500 Internal Server Error**
```
POST https://contentgenei.onrender.com/api/auth/verify-token 500
```

**Solution**: Check Render logs for error details

---

## 📊 Render Configuration

### Build Command
```bash
pip install -r requirements.txt
```

### Start Command
```bash
gunicorn app:app
```

Or if using `run.py`:
```bash
python run.py
```

### Build Filters (Optional)

Render doesn't have built-in build filters like Vercel's "Ignored Build Step", but you can:

1. **Use Git branches**:
   - Deploy `main` branch to production
   - Use `dev` branch for development
   - Configure in Render: Settings → Branch → `main`

2. **Manual deploys**:
   - Disable auto-deploy: Settings → Auto-Deploy → OFF
   - Use Deploy Hook for manual triggers

3. **Deploy Hook Usage**:
   ```bash
   # Trigger deployment via webhook
   curl -X POST https://api.render.com/deploy/srv-d630e0u8alac738qnt00?key=pYEz9JddGLs
   ```

---

## 🔄 Deployment Workflow

### Automatic Deployment (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Vercel**: Auto-deploys frontend (1-2 minutes)
3. **Render**: Auto-deploys backend (3-5 minutes)

### Manual Deployment

#### Vercel:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

#### Render:
```bash
# Use Deploy Hook
curl -X POST https://api.render.com/deploy/srv-d630e0u8alac738qnt00?key=pYEz9JddGLs
```

---

## 🐛 Debugging Guide

### Check Render Logs

1. Go to Render Dashboard
2. Click your service
3. Click "Logs" tab
4. Look for errors

Common errors:
```python
# Database connection error
sqlalchemy.exc.OperationalError: could not connect to server

# Missing environment variable
KeyError: 'GROQ_API_KEY'

# Import error
ModuleNotFoundError: No module named 'flask_cors'
```

### Check Vercel Logs

1. Go to Vercel Dashboard
2. Click your project
3. Click "Deployments"
4. Click latest deployment
5. Click "View Function Logs"

### Test API Endpoints

```bash
# Test health endpoint
curl https://contentgenei.onrender.com/api/health

# Test auth endpoint (should return 401)
curl https://contentgenei.onrender.com/api/auth/verify-token

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://contentgenei.onrender.com/api/profile
```

---

## 🎯 Vercel Configuration

### vercel.json (Optional)

Create `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

---

## 💰 Cost Comparison

### Vercel (Frontend)
- **Free Tier**: 
  - 100GB bandwidth/month
  - Unlimited deployments
  - Custom domains
  - SSL included
- **Cost**: $0/month ✅

### Render (Backend)
- **Free Tier**:
  - 750 hours/month (enough for 1 service)
  - Spins down after 15 min inactivity
  - 512MB RAM
  - Shared CPU
- **Paid Tier** ($7/month):
  - Always on
  - 512MB RAM
  - Shared CPU
  - Better performance
- **Cost**: $0-7/month

### MongoDB Atlas
- **Free Tier**:
  - 512MB storage
  - Shared cluster
  - No credit card required
- **Cost**: $0/month ✅

### Total Monthly Cost
- **Free Setup**: $0/month
- **With Render Paid**: $7/month
- **Runtime with $200**: 28+ months (2+ years!)

---

## 🚀 Performance Optimization

### 1. Render Cold Starts

Free tier spins down after 15 min. First request takes 30-60 seconds.

**Solutions**:
- Upgrade to paid tier ($7/month) for always-on
- Use a ping service (UptimeRobot) to keep it warm
- Accept cold starts for low-traffic apps

### 2. Vercel Edge Caching

Add caching headers in your backend:

```python
@app.after_request
def add_cache_headers(response):
    # Cache static content
    if request.path.startswith('/api/public'):
        response.headers['Cache-Control'] = 'public, max-age=3600'
    return response
```

### 3. Database Connection Pooling

In `backend/config.py`:

```python
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': 5,
    'pool_recycle': 3600,
    'pool_pre_ping': True
}
```

---

## ✅ Final Checklist

- [ ] Vercel environment variables set
- [ ] Render environment variables set
- [ ] CORS configured with Vercel URL
- [ ] Frontend builds successfully
- [ ] Backend starts without errors
- [ ] Database connections work
- [ ] Firebase authentication works
- [ ] API calls from frontend to backend work
- [ ] Admin panel accessible
- [ ] No CORS errors in browser console
- [ ] MongoDB Atlas connected
- [ ] Groq API working

---

## 🎉 Success!

Your app should now be fully connected:

1. **Frontend**: https://your-app.vercel.app
2. **Backend**: https://contentgenei.onrender.com
3. **Database**: MongoDB Atlas (free)

**Test it**:
1. Open your Vercel URL
2. Register a new user
3. Login
4. Generate content
5. Check admin panel

Everything should work seamlessly! 🚀

---

## 📞 Need Help?

Common issues and solutions:

1. **CORS Error**: Add Vercel URL to `CORS_ORIGINS` in Render
2. **404 Error**: Check route registration in `app.py`
3. **500 Error**: Check Render logs for details
4. **Slow Response**: Render free tier cold start (30-60s first request)
5. **Database Error**: Check MongoDB Atlas IP whitelist (0.0.0.0/0)

Check logs:
- Vercel: Dashboard → Deployments → Function Logs
- Render: Dashboard → Service → Logs
