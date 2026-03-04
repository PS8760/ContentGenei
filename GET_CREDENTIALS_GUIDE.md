# 🔑 How to Get Your Credentials

This guide will help you get all the values you need for `RENDER_ENV_VARIABLES.txt`

---

## ✅ Already Have (From Your Local .env)

These are already filled in:
- ✅ `SECRET_KEY` - Generated strong key
- ✅ `JWT_SECRET_KEY` - Generated strong key
- ✅ `GROQ_API_KEY` - Your existing key
- ✅ `ENCRYPTION_KEY` - Your existing key
- ✅ `CORS_ORIGINS` - Your Vercel URLs

---

## 🔍 Need to Get

### 1. DATABASE_URL (PostgreSQL from Render)

**Option A: Render Provides Automatically**
1. Go to Render Dashboard: https://dashboard.render.com
2. Click your service
3. Click "Connect" tab
4. Look for "Internal Database URL"
5. Copy the full URL: `postgresql://user:pass@host:5432/db`

**Option B: Create New PostgreSQL Database**
1. In Render Dashboard, click "New +"
2. Select "PostgreSQL"
3. Name: `contentgenie-db`
4. Plan: Free
5. Click "Create Database"
6. Wait 2-3 minutes
7. Copy "Internal Database URL"

---

### 2. MONGODB_URI (MongoDB Atlas - FREE)

**Step-by-step:**

1. **Sign up**: https://www.mongodb.com/cloud/atlas/register
   - Use Google/GitHub for quick signup
   - No credit card required

2. **Create Cluster**:
   - Click "Build a Database"
   - Choose "M0 FREE" (512MB)
   - Provider: AWS
   - Region: `us-east-1` (same as Render)
   - Cluster Name: `contentgenie`
   - Click "Create"

3. **Create Database User**:
   - Click "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Username: `contentgenie_user`
   - Password: Click "Autogenerate Secure Password" → **SAVE THIS!**
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Whitelist IP**:
   - Click "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**:
   - Click "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: Python, Version: 3.11 or later
   - Copy connection string:
   ```
   mongodb+srv://contentgenie_user:<password>@contentgenie.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with the password you saved
   - **This is your MONGODB_URI!**

---

### 3. Firebase Configuration

**Step-by-step:**

1. **Go to Firebase Console**: https://console.firebase.google.com
2. Select your project (or create new one)
3. Click ⚙️ (Settings) → "Project settings"
4. Click "Service accounts" tab
5. Click "Generate new private key"
6. Click "Generate key" (downloads JSON file)

7. **Open the JSON file**, you'll see:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  ...
}
```

8. **Extract these values**:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**IMPORTANT**: For `FIREBASE_PRIVATE_KEY`:
- Keep the `\n` characters (they're important!)
- Include the full key with BEGIN and END markers
- Wrap in quotes if it has spaces

---

### 4. Social Media OAuth (Optional - Skip if not using)

Only needed if you're using GeneiLink social media posting features.

#### Instagram (via Facebook)
1. Go to: https://developers.facebook.com/apps/
2. Click "Create App"
3. Choose "Business" type
4. Fill in app details
5. Go to Settings → Basic
6. Copy:
   - `FACEBOOK_APP_ID`
   - `FACEBOOK_APP_SECRET`

#### LinkedIn
1. Go to: https://www.linkedin.com/developers/apps/
2. Click "Create app"
3. Fill in app details
4. Go to "Auth" tab
5. Copy:
   - `LINKEDIN_CLIENT_ID`
   - `LINKEDIN_CLIENT_SECRET`

#### Twitter/X
1. Go to: https://developer.twitter.com/en/portal/dashboard
2. Create project and app
3. Go to app settings
4. Copy:
   - `TWITTER_CLIENT_ID`
   - `TWITTER_CLIENT_SECRET`

---

## 📋 Quick Checklist

Before adding to Render, make sure you have:

### Required (Must Have):
- [ ] `DATABASE_URL` - PostgreSQL from Render
- [ ] `MONGODB_URI` - MongoDB Atlas connection string
- [ ] `FIREBASE_PROJECT_ID` - From Firebase JSON
- [ ] `FIREBASE_PRIVATE_KEY` - From Firebase JSON
- [ ] `FIREBASE_CLIENT_EMAIL` - From Firebase JSON

### Already Provided:
- [x] `SECRET_KEY` - Generated
- [x] `JWT_SECRET_KEY` - Generated
- [x] `GROQ_API_KEY` - From your .env
- [x] `ENCRYPTION_KEY` - From your .env
- [x] `CORS_ORIGINS` - Your Vercel URLs

### Optional (Skip if not using):
- [ ] `FACEBOOK_APP_ID` - For Instagram posting
- [ ] `FACEBOOK_APP_SECRET` - For Instagram posting
- [ ] `LINKEDIN_CLIENT_ID` - For LinkedIn posting
- [ ] `LINKEDIN_CLIENT_SECRET` - For LinkedIn posting
- [ ] `TWITTER_CLIENT_ID` - For Twitter posting
- [ ] `TWITTER_CLIENT_SECRET` - For Twitter posting

---

## 🚀 Add to Render

Once you have all values:

1. Go to: https://dashboard.render.com
2. Click your service
3. Click "Environment" (left sidebar)
4. For each variable:
   - Click "Add Environment Variable"
   - Key: Variable name (e.g., `DATABASE_URL`)
   - Value: Your value
   - Click "Save"
5. After adding all, click "Save Changes"
6. Render will automatically redeploy (3-5 minutes)

---

## 🔒 Security Tips

- ✅ Never commit credentials to GitHub
- ✅ Use different keys for dev and production
- ✅ Keep `RENDER_ENV_VARIABLES.txt` secure (don't share)
- ✅ Regenerate keys if exposed
- ✅ Use strong passwords for databases
- ✅ Enable 2FA on all accounts

---

## 🆘 Troubleshooting

### MongoDB Connection Error
- Check IP whitelist (should be 0.0.0.0/0)
- Verify password in connection string
- Check username is correct

### Firebase Auth Error
- Verify all three Firebase variables are set
- Check private key includes `\n` characters
- Ensure no extra spaces in values

### Database Connection Error
- Verify DATABASE_URL format
- Check Render database is running
- Wait for database to finish creating

---

## ✅ Test Your Configuration

After adding all variables to Render:

1. Wait for deployment to complete
2. Check logs: Render Dashboard → Your Service → Logs
3. Test backend: `curl https://contentgenei.onrender.com/api/health`
4. Should return: `{"status": "healthy"}`

If you see errors, check the logs for which variable is missing!

---

**Need help?** Check the logs in Render Dashboard → Your Service → Logs
