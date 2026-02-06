# Quick Deployment Guide for ContentGenie

## 🚀 Deploy Backend to Render (5 minutes)

### Step 1: Sign up for Render
1. Go to https://render.com
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `PS8760/ContentGenei`
3. Configure:
   - **Name**: `contentgenie-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 4 --timeout 120`
   - **Plan**: Free

### Step 3: Add Environment Variables
Click **"Environment"** tab and add these:

```
FLASK_ENV=production
SECRET_KEY=contentgenie-prod-secret-2024-change-this
JWT_SECRET_KEY=jwt-secret-prod-2024-change-this
GROQ_API_KEY=<your-groq-api-key-from-backend/.env>
CORS_ORIGINS=https://content-ai-orcin-tau.vercel.app
```

### Step 4: Add Database (Optional but Recommended)
1. Click **"New +"** → **"PostgreSQL"**
2. Name: `contentgenie-db`
3. Plan: Free
4. After creation, link it to your web service
5. DATABASE_URL will be automatically added

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. Your backend URL will be: `https://contentgenie-backend.onrender.com`

---

## 🎨 Update Frontend with Backend URL

### Step 1: Update Vercel Environment Variables
1. Go to https://vercel.com/dashboard
2. Select your project: `content-ai-orcin-tau`
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://contentgenie-backend.onrender.com/api`
   - **Environment**: Production

### Step 2: Redeploy Frontend
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Or just push to GitHub to trigger auto-deployment

---

## ✅ Test Your Deployment

### Test Backend
```bash
curl https://contentgenie-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "ContentGenie API is running",
  "version": "1.0.0"
}
```

### Test Frontend
1. Open https://content-ai-orcin-tau.vercel.app
2. Try to sign in
3. Check browser console (F12) for any errors
4. Try creating content

---

## 🔧 Troubleshooting

### Backend not responding?
- Check Render logs: Dashboard → Your Service → Logs
- Verify all environment variables are set
- Make sure GROQ_API_KEY is correct

### CORS errors in frontend?
- Verify CORS_ORIGINS includes your frontend URL
- Check backend logs for CORS-related errors
- Make sure frontend is using correct backend URL

### Database errors?
- If using PostgreSQL, run migrations:
  - Go to Render Shell (in your service dashboard)
  - Run: `flask db upgrade`

### Frontend can't connect to backend?
- Verify VITE_API_URL is set in Vercel
- Check if backend URL is correct
- Test backend health endpoint first

---

## 📝 Important Notes

1. **Free Tier Limitations**:
   - Render free tier sleeps after 15 minutes of inactivity
   - First request after sleep takes ~30 seconds to wake up
   - Upgrade to paid plan ($7/month) for always-on service

2. **Database**:
   - SQLite works for testing but use PostgreSQL for production
   - Free PostgreSQL on Render has 1GB storage limit

3. **API Keys**:
   - Never commit `.env` files to GitHub
   - Always use environment variables in deployment platforms

4. **Monitoring**:
   - Check Render logs regularly
   - Set up email alerts in Render dashboard

---

## 🎉 You're Done!

Your full-stack app is now deployed:
- **Frontend**: https://content-ai-orcin-tau.vercel.app
- **Backend**: https://contentgenie-backend.onrender.com

Share your app with the world! 🚀
