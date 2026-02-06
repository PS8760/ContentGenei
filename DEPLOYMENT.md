# ContentGenie Deployment Guide

## Backend Deployment

### Option 1: Deploy to Render (Recommended - Free Tier Available)

1. **Create a Render Account**
   - Go to [render.com](https://render.com) and sign up

2. **Create a New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` directory as the root

3. **Configure the Service**
   - **Name**: contentgenie-backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 4 --timeout 120`
   - **Plan**: Free (or choose paid for better performance)

4. **Add Environment Variables**
   Go to "Environment" tab and add:
   ```
   FLASK_ENV=production
   SECRET_KEY=<generate-a-random-secret-key>
   JWT_SECRET_KEY=<generate-a-random-jwt-secret>
   GROQ_API_KEY=<your-groq-api-key>
   DATABASE_URL=<will-be-auto-filled-if-you-add-postgres>
   CORS_ORIGINS=https://content-ai-orcin-tau.vercel.app
   ```

5. **Add PostgreSQL Database** (Optional but recommended)
   - Click "New +" → "PostgreSQL"
   - Name it `contentgenie-db`
   - Link it to your web service
   - The DATABASE_URL will be automatically set

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your backend URL will be: `https://contentgenie-backend.onrender.com`

### Option 2: Deploy to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)

2. **New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Configure**
   - Railway will auto-detect Python
   - Add environment variables in Settings
   - Add PostgreSQL database from "New" button

4. **Deploy**
   - Railway will automatically deploy
   - Get your URL from Settings → Domains

### Option 3: Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   cd backend
   heroku create contentgenie-backend
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set FLASK_ENV=production
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set JWT_SECRET_KEY=your-jwt-secret
   heroku config:set GROQ_API_KEY=your-groq-key
   heroku config:set CORS_ORIGINS=https://content-ai-orcin-tau.vercel.app
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

## Frontend Configuration

### Update Frontend with Backend URL

1. **Create `.env.production` in frontend folder**
   ```env
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

2. **Update Vercel Environment Variables**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add: `VITE_API_URL` = `https://your-backend-url.onrender.com/api`

3. **Redeploy Frontend**
   ```bash
   cd frontend
   npm run build
   # Or push to GitHub to trigger Vercel deployment
   ```

## Database Migration

If you're using PostgreSQL in production:

```bash
# SSH into your backend server or use Render Shell
cd backend
flask db upgrade
```

## Testing the Deployment

1. **Test Backend Health**
   ```bash
   curl https://your-backend-url.onrender.com/api/health
   ```

2. **Test Frontend Connection**
   - Open https://content-ai-orcin-tau.vercel.app
   - Try logging in
   - Check browser console for any CORS errors

## Troubleshooting

### CORS Errors
- Make sure `CORS_ORIGINS` includes your frontend URL
- Check that backend is returning proper CORS headers

### Database Connection Issues
- Verify DATABASE_URL is set correctly
- Check if database is running
- Run migrations: `flask db upgrade`

### API Key Issues
- Verify all environment variables are set
- Check Groq API key is valid
- Ensure Firebase credentials are properly configured

### 502/503 Errors
- Check backend logs in Render/Railway dashboard
- Verify gunicorn is starting correctly
- Check if database connection is successful

## Environment Variables Checklist

### Backend (Required)
- ✅ FLASK_ENV=production
- ✅ SECRET_KEY
- ✅ JWT_SECRET_KEY
- ✅ GROQ_API_KEY
- ✅ DATABASE_URL
- ✅ CORS_ORIGINS

### Backend (Optional)
- REDIS_URL (for caching)
- FIREBASE_CREDENTIALS_PATH
- MAIL_SERVER, MAIL_PORT, etc. (for email)

### Frontend (Required)
- ✅ VITE_API_URL
- ✅ VITE_FIREBASE_API_KEY
- ✅ VITE_FIREBASE_AUTH_DOMAIN
- ✅ VITE_FIREBASE_PROJECT_ID
- ✅ VITE_FIREBASE_STORAGE_BUCKET
- ✅ VITE_FIREBASE_MESSAGING_SENDER_ID
- ✅ VITE_FIREBASE_APP_ID

## Post-Deployment Steps

1. **Update README.md** with live URLs
2. **Test all features** on production
3. **Monitor logs** for any errors
4. **Set up monitoring** (optional):
   - Sentry for error tracking
   - LogRocket for session replay
   - Google Analytics for usage stats

## Cost Estimates

### Free Tier Options
- **Render**: Free tier available (sleeps after 15 min inactivity)
- **Railway**: $5 credit/month free
- **Vercel**: Free for frontend
- **PostgreSQL**: Free tier on Render/Railway

### Paid Options (for production)
- **Render**: $7/month (always on)
- **Railway**: Pay as you go (~$5-10/month)
- **Heroku**: $7/month (Eco dyno)

## Security Checklist

- ✅ All API keys in environment variables (not in code)
- ✅ CORS properly configured
- ✅ HTTPS enabled (automatic on Render/Railway/Vercel)
- ✅ Database credentials secure
- ✅ JWT secrets are strong and unique
- ✅ Rate limiting enabled (if needed)
- ✅ Input validation on all endpoints

## Support

If you encounter issues:
1. Check the logs in your deployment platform
2. Verify all environment variables are set
3. Test API endpoints with curl or Postman
4. Check CORS configuration
5. Review the troubleshooting section above
