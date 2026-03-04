# 🔑 Environment Variables Explained

## What Are Environment Variables?

Environment variables are configuration settings that your app needs to run. They're kept separate from your code for security (so API keys don't get committed to GitHub).

---

## 📋 Your Environment Variables

### ✅ Already Set (You Have These!)

#### `SECRET_KEY`
```
Value: 0ce4d3069bc7b0c9745a2fec7133647b2026c30287ddd828ae736746860757cb
```
**What it does**: Encrypts session data and cookies
**Why you need it**: Security - prevents session hijacking
**Status**: ✅ Generated and ready to use

#### `JWT_SECRET_KEY`
```
Value: 200b844835b1cbce5f458e55d8c78aa433bdba1b5b7008cc9ea841836bce01f3
```
**What it does**: Signs JWT tokens for authentication
**Why you need it**: Security - prevents token forgery
**Status**: ✅ Generated and ready to use

#### `GROQ_API_KEY`
```
Value: (from your local .env file)
```
**What it does**: Connects to Groq AI for content generation
**Why you need it**: Powers AI content creation
**Status**: ✅ You have this in your local .env

#### `ENCRYPTION_KEY`
```
Value: QaLHHLqT8GgcDgooSuvqJBKisiIZ5JRNKuhc_zISAMA=
```
**What it does**: Encrypts OAuth tokens for social media
**Why you need it**: Security - protects user social media tokens
**Status**: ✅ From your local .env

#### `CORS_ORIGINS`
```
Value: https://content-genei-dhphy2e82-ps8760s-projects.vercel.app,https://*.vercel.app
```
**What it does**: Allows your frontend to talk to backend
**Why you need it**: Security - prevents unauthorized access
**Status**: ✅ Set to your Vercel URLs

#### `FLASK_ENV`
```
Value: production
```
**What it does**: Tells Flask to run in production mode
**Why you need it**: Performance and security optimizations
**Status**: ✅ Set to production

#### `FLASK_APP`
```
Value: app.py
```
**What it does**: Tells Flask which file to run
**Why you need it**: Flask needs to know the entry point
**Status**: ✅ Set to app.py

---

### ❌ Missing (You Need to Get These!)

#### `MONGODB_URI` 🔴 CRITICAL!
```
Example: mongodb+srv://user:pass@cluster.mongodb.net/linkogenei?retryWrites=true&w=majority
```
**What it does**: Connects to MongoDB database
**Why you need it**: Stores chat, notifications, saved posts, profiles
**Without it**: AlexChat, LinkoGenei, Notifications DON'T WORK
**How to get**: Follow `URGENT_MONGODB_SETUP.md`
**Cost**: FREE (MongoDB Atlas M0)
**Time**: 15 minutes

#### `DATABASE_URL` 🟡 IMPORTANT
```
Example: postgresql://user:pass@host:5432/database
```
**What it does**: Connects to PostgreSQL database
**Why you need it**: Stores users, content, teams, analytics
**Without it**: Most features won't work
**How to get**: Render auto-provides OR create new PostgreSQL in Render
**Cost**: FREE (Render provides)
**Time**: 2 minutes

#### `FIREBASE_PROJECT_ID` 🟡 IMPORTANT
```
Example: contentgenie-12345
```
**What it does**: Identifies your Firebase project
**Why you need it**: Backend Firebase authentication
**Without it**: Auth might be unreliable
**How to get**: Firebase Console → Project Settings → General
**Cost**: FREE
**Time**: 2 minutes

#### `FIREBASE_PRIVATE_KEY` 🟡 IMPORTANT
```
Example: -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n
```
**What it does**: Authenticates backend with Firebase
**Why you need it**: Backend Firebase authentication
**Without it**: Auth might be unreliable
**How to get**: Firebase Console → Service Accounts → Generate Key
**Cost**: FREE
**Time**: 2 minutes

#### `FIREBASE_CLIENT_EMAIL` 🟡 IMPORTANT
```
Example: firebase-adminsdk-xxxxx@contentgenie.iam.gserviceaccount.com
```
**What it does**: Service account email for Firebase
**Why you need it**: Backend Firebase authentication
**Without it**: Auth might be unreliable
**How to get**: Firebase Console → Service Accounts → Generate Key
**Cost**: FREE
**Time**: 2 minutes

---

### 🟢 Optional (Only if Using Social Media Features)

#### `FACEBOOK_APP_ID` & `FACEBOOK_APP_SECRET`
**What it does**: Allows posting to Instagram via Facebook
**Why you need it**: GeneiLink Instagram posting
**Without it**: Can't post to Instagram
**How to get**: Facebook Developers → Create App
**Cost**: FREE
**Time**: 10 minutes

#### `LINKEDIN_CLIENT_ID` & `LINKEDIN_CLIENT_SECRET`
**What it does**: Allows posting to LinkedIn
**Why you need it**: GeneiLink LinkedIn posting
**Without it**: Can't post to LinkedIn
**How to get**: LinkedIn Developers → Create App
**Cost**: FREE
**Time**: 10 minutes

#### `TWITTER_CLIENT_ID` & `TWITTER_CLIENT_SECRET`
**What it does**: Allows posting to Twitter/X
**Why you need it**: GeneiLink Twitter posting
**Without it**: Can't post to Twitter
**How to get**: Twitter Developer Portal → Create App
**Cost**: FREE (Basic tier)
**Time**: 10 minutes

---

## 🎯 Priority Order

### Do Now (Critical)
1. **MONGODB_URI** - Without this, AlexChat, LinkoGenei, Notifications are broken
2. **DATABASE_URL** - Check if Render auto-provided, or create new

### Do Next (Important)
3. **Firebase Config** (3 variables) - Improves auth reliability

### Do Later (Optional)
4. **Social Media OAuth** - Only if using GeneiLink posting features

---

## 📊 Feature Dependencies

### What Works Without MongoDB?
- ✅ Login/Register (uses Firebase + PostgreSQL)
- ✅ Content Generation (uses Groq API)
- ✅ Analytics (uses PostgreSQL)
- ✅ Team Collaboration (uses PostgreSQL)
- ✅ Admin Dashboard (uses PostgreSQL)

### What Doesn't Work Without MongoDB?
- ❌ AlexChat (needs MongoDB for conversations)
- ❌ LinkoGenei (needs MongoDB for saved posts)
- ❌ Notifications (needs MongoDB for notification storage)
- ❌ Extended Profiles (needs MongoDB for 50+ fields)
- ❌ Team Chat (needs MongoDB for chat history)

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep environment variables in Render/Vercel only
- Use different keys for development and production
- Regenerate keys if they're exposed
- Use strong, random passwords for databases
- Enable 2FA on all accounts (MongoDB, Firebase, etc.)

### ❌ DON'T:
- Commit .env files to GitHub
- Share environment variables publicly
- Use simple/guessable passwords
- Reuse keys across projects
- Store keys in code comments

---

## 🧪 Testing Your Configuration

### Test Backend Health
```bash
curl https://contentgenei.onrender.com/api/health
```
Should return: `{"status": "healthy"}`

### Test MongoDB Connection
Check Render logs for:
```
Connected to MongoDB: linkogenei
```

### Test Firebase
Try logging in - should work without errors

### Test Groq API
Try generating content - should work

---

## 🆘 Common Issues

### Issue: "MongoDB connection failed"
**Cause**: MONGODB_URI not set or incorrect
**Fix**: Follow `URGENT_MONGODB_SETUP.md`

### Issue: "Database connection failed"
**Cause**: DATABASE_URL not set
**Fix**: Check Render → Environment for DATABASE_URL

### Issue: "Firebase verification unavailable"
**Cause**: Firebase config variables not set
**Fix**: Follow `GET_CREDENTIALS_GUIDE.md` Section 3

### Issue: "CORS error"
**Cause**: CORS_ORIGINS doesn't include your Vercel URL
**Fix**: Add your Vercel URL to CORS_ORIGINS

---

## 📋 Quick Checklist

Before deploying, make sure you have:

### Required (Must Have)
- [ ] SECRET_KEY ✅
- [ ] JWT_SECRET_KEY ✅
- [ ] GROQ_API_KEY ✅
- [ ] ENCRYPTION_KEY ✅
- [ ] CORS_ORIGINS ✅
- [ ] FLASK_ENV ✅
- [ ] FLASK_APP ✅
- [ ] MONGODB_URI ❌ (GET THIS NOW!)
- [ ] DATABASE_URL ⚠️ (Check Render)

### Important (Should Have)
- [ ] FIREBASE_PROJECT_ID ❌
- [ ] FIREBASE_PRIVATE_KEY ❌
- [ ] FIREBASE_CLIENT_EMAIL ❌

### Optional (Nice to Have)
- [ ] FACEBOOK_APP_ID (if using Instagram)
- [ ] FACEBOOK_APP_SECRET (if using Instagram)
- [ ] LINKEDIN_CLIENT_ID (if using LinkedIn)
- [ ] LINKEDIN_CLIENT_SECRET (if using LinkedIn)
- [ ] TWITTER_CLIENT_ID (if using Twitter)
- [ ] TWITTER_CLIENT_SECRET (if using Twitter)

---

## 🚀 Next Steps

1. **Read**: `URGENT_MONGODB_SETUP.md`
2. **Get**: MONGODB_URI (15 minutes)
3. **Add**: To Render Environment
4. **Test**: AlexChat and LinkoGenei
5. **Celebrate**: Everything works! 🎉

---

**Questions?** Check the Render logs for specific error messages.
