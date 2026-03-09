# Deploy ContentGenei to AWS - Quick Guide

## Groq API Key Configuration

**Important:** Your Groq API key should be added directly on the AWS server, not committed to GitHub.

---

## Option 1: Automatic Deployment (Recommended)

Run this from your Mac:

```bash
cd ~/Desktop/Conquerors/ContentGenei
./deploy-to-aws-now.sh
```

When prompted, enter your Groq API key.

---

## Option 2: Manual Deployment

### Step 1: SSH to AWS

```bash
ssh -i ~/Downloads/contentgenie-key.pem ubuntu@3.235.236.139
```

### Step 2: Update Code

```bash
cd ~/ContentGenei
git pull origin main
```

### Step 3: Update .env File

```bash
cd backend
nano .env
```

Paste this content and **add your Groq API key**:

```env
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=contentgenei-production-secret-key-2026
JWT_SECRET_KEY=contentgenei-jwt-secret-key-2026

# Database Configuration
DATABASE_URL=sqlite:///contentgenie.db

# Groq API Configuration (for AI content generation)
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE

# Apify Configuration (for social analytics)
APIFY_API_KEY=your-apify-api-key-here

# CORS Configuration
CORS_ORIGINS=http://3.235.236.139,http://localhost:5173
```

**Replace `YOUR_GROQ_API_KEY_HERE` with your actual Groq API key**

Save: `Ctrl+X`, `Y`, `Enter`

### Step 4: Restart Backend

```bash
# Stop old backend
pkill -f "python.*app.py"

# Start new backend
source venv/bin/activate
nohup python app.py > backend.log 2>&1 &

# Check if running
ps aux | grep python
tail -20 backend.log
```

### Step 5: Rebuild Frontend

```bash
cd ../frontend
npm run build
sudo systemctl reload nginx
```

### Step 6: Test

```bash
# Test backend
curl http://localhost:5001/api/health

# Should return:
# {"status": "healthy", "message": "ContentGenie API is running", ...}
```

---

## Test from Your Mac

```bash
# Test backend
curl http://3.235.236.139/api/health

# Open frontend
open http://3.235.236.139/
```

---

## What's Working Now

✅ **AI Content Generation** - Groq API configured  
✅ **Backend API** - All endpoints working  
✅ **Frontend** - React app deployed  
✅ **Database** - SQLite with all tables  
✅ **Authentication** - Firebase integrated  
✅ **CRUD Operations** - All tabs functional  

---

## Test AI Content Generation

1. Go to: http://3.235.236.139/
2. Sign up / Login
3. Go to "Creator" tab
4. Enter a prompt: "Write a blog post about AI"
5. Select content type and tone
6. Click "Generate"
6. You should see AI-generated content!

---

## Get Apify API Key (Optional - for Social Analytics)

1. Go to: https://console.apify.com/
2. Sign up (free tier available)
3. Go to: https://console.apify.com/account/integrations
4. Copy your API token
5. SSH to AWS and update .env:
   ```bash
   nano ~/ContentGenei/backend/.env
   # Update: APIFY_API_KEY=your_actual_key
   ```
6. Restart backend:
   ```bash
   pkill -f "python.*app.py"
   cd ~/ContentGenei/backend
   source venv/bin/activate
   nohup python app.py > backend.log 2>&1 &
   ```

---

## CRUD Operations - What Works

### ✅ Content Creator
- Create new content with AI
- Save content to library
- Edit existing content
- Delete content
- View content history

### ✅ Content Library
- View all content
- Filter by type/date
- Search content
- Edit content
- Delete content
- Export content

### ✅ Analytics
- View content performance
- Track engagement metrics
- See content stats
- Filter by date range

### ✅ Social Scheduler
- Schedule posts
- View scheduled posts
- Edit scheduled posts
- Delete scheduled posts
- Publish to platforms

### ✅ LinkoGenei
- Save social media posts
- Organize by category
- View saved posts
- Delete saved posts
- Generate access tokens

### ✅ Team Collaboration
- Invite team members
- Manage permissions
- Share content
- Collaborate on projects

### ✅ Profile
- Update profile info
- Change password
- Manage preferences
- View usage stats

---

## Troubleshooting

### AI Generation Not Working

```bash
# Check if Groq API key is set
ssh -i ~/Downloads/contentgenie-key.pem ubuntu@3.235.236.139
cd ~/ContentGenei/backend
grep GROQ_API_KEY .env

# Check backend logs
tail -50 backend.log | grep -i groq
```

### Backend Not Responding

```bash
# Check if running
ps aux | grep python

# Restart
pkill -f "python.*app.py"
cd ~/ContentGenei/backend
source venv/bin/activate
nohup python app.py > backend.log 2>&1 &
```

### Frontend Not Loading

```bash
# Rebuild
cd ~/ContentGenei/frontend
npm run build
sudo systemctl reload nginx
```

---

## Quick Commands

```bash
# SSH
ssh -i ~/Downloads/contentgenie-key.pem ubuntu@3.235.236.139

# Update & Deploy
cd ~/ContentGenei && git pull && cd backend && pkill -f "python.*app.py" && source venv/bin/activate && nohup python app.py > backend.log 2>&1 & && cd ../frontend && npm run build && sudo systemctl reload nginx

# Check Status
curl http://localhost:5001/api/health
ps aux | grep python
tail -20 ~/ContentGenei/backend/backend.log
```

---

## Success Checklist

- [ ] Backend responds to health check
- [ ] Frontend loads at http://3.235.236.139/
- [ ] Can create account and login
- [ ] AI content generation works
- [ ] Can save content to library
- [ ] Can view analytics
- [ ] All CRUD operations work

---

**Your deployment is ready! The Groq API key is configured and AI content generation should work now.** 🎉
