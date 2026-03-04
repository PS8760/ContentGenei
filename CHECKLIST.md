# ✅ Environment Variables Checklist

Copy this checklist and check off items as you complete them.

## 🎯 Goal
Get all environment variables into Render so your app works.

---

## 📋 Checklist

### Already Have (From Local .env)
- [x] GROQ_API_KEY: `YOUR_GROQ_API_KEY_FROM_LOCAL_ENV`
- [x] ENCRYPTION_KEY: `QaLHHLqT8GgcDgooSuvqJBKisiIZ5JRNKuhc_zISAMA=`
- [x] SECRET_KEY: `0ce4d3069bc7b0c9745a2fec7133647b2026c30287ddd828ae736746860757cb`
- [x] JWT_SECRET_KEY: `200b844835b1cbce5f458e55d8c78aa433bdba1b5b7008cc9ea841836bce01f3`

### Need to Get (Do These Now)

#### 1. PostgreSQL Database
- [ ] Go to Render Dashboard
- [ ] Click "New +" → "PostgreSQL"
- [ ] Name: `contentgenie-db`, Plan: Free
- [ ] Click "Create Database"
- [ ] Wait 2 minutes
- [ ] Copy "Internal Database URL"
- [ ] Paste as `DATABASE_URL` in Render environment

#### 2. MongoDB Atlas
- [ ] Sign up: https://www.mongodb.com/cloud/atlas/register
- [ ] Create M0 FREE cluster in us-east-1
- [ ] Create database user (username: `contentgenie`)
- [ ] Autogenerate password and SAVE IT
- [ ] Add IP: 0.0.0.0/0 (Allow from anywhere)
- [ ] Get connection string
- [ ] Replace `<password>` with your password
- [ ] Paste as `MONGODB_URI` in Render environment
- [ ] Add `MONGODB_DB_NAME=linkogenei` in Render

#### 3. Firebase Credentials
- [ ] Go to Firebase Console: https://console.firebase.google.com
- [ ] Select your project
- [ ] Settings → Service accounts → Generate new private key
- [ ] Download JSON file
- [ ] Copy `project_id` → Add as `FIREBASE_PROJECT_ID`
- [ ] Copy `private_key` → Add as `FIREBASE_PRIVATE_KEY`
- [ ] Copy `client_email` → Add as `FIREBASE_CLIENT_EMAIL`

#### 4. Add to Render
- [ ] Go to Render Dashboard → Your Service → Environment
- [ ] Add `DATABASE_URL` (from step 1)
- [ ] Add `MONGODB_URI` (from step 2)
- [ ] Add `MONGODB_DB_NAME=linkogenei`
- [ ] Add `GROQ_API_KEY=YOUR_GROQ_API_KEY_FROM_LOCAL_ENV`
- [ ] Add `FIREBASE_PROJECT_ID` (from step 3)
- [ ] Add `FIREBASE_PRIVATE_KEY` (from step 3)
- [ ] Add `FIREBASE_CLIENT_EMAIL` (from step 3)
- [ ] Add `SECRET_KEY=0ce4d3069bc7b0c9745a2fec7133647b2026c30287ddd828ae736746860757cb`
- [ ] Add `JWT_SECRET_KEY=200b844835b1cbce5f458e55d8c78aa433bdba1b5b7008cc9ea841836bce01f3`
- [ ] Add `ENCRYPTION_KEY=QaLHHLqT8GgcDgooSuvqJBKisiIZ5JRNKuhc_zISAMA=`
- [ ] Add `FLASK_ENV=production`
- [ ] Add `FLASK_APP=app.py`
- [ ] Add `CORS_ORIGINS=https://content-genei-dhphy2e82-ps8760s-projects.vercel.app,https://*.vercel.app`
- [ ] Click "Save Changes"

#### 5. Wait & Test
- [ ] Wait for Render to redeploy (3-5 minutes)
- [ ] Check deployment status (should show green checkmark)
- [ ] Go to your app: https://content-genei-dhphy2e82-ps8760s-projects.vercel.app
- [ ] Try logging in
- [ ] Try creating content
- [ ] Try LinkoGenei
- [ ] Everything works! 🎉

---

## 🚨 Critical Variables (Must Have)

These 4 are absolutely required:
1. `DATABASE_URL` - For user accounts, projects, content
2. `MONGODB_URI` - For LinkoGenei, AlexChat
3. `GROQ_API_KEY` - For AI content generation
4. Firebase (3 variables) - For authentication

Without these, your app won't work at all.

---

## ⏱️ Time Estimate

- PostgreSQL: 2 minutes
- MongoDB: 5 minutes
- Firebase: 5 minutes
- Add to Render: 2 minutes
- Deployment: 3-5 minutes

**Total: ~15-20 minutes**

---

## 📞 Need Help?

If you get stuck:
1. Check Render logs: Dashboard → Your Service → Logs
2. Look for error messages about missing variables
3. Verify each variable is spelled correctly
4. Make sure no extra spaces in values

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ No errors in Render logs
- ✅ Can log in to your app
- ✅ Can create content
- ✅ LinkoGenei connects
- ✅ AlexChat works
- ✅ No "User not found" errors

---

**Start with Step 1 (PostgreSQL) and work your way down!**
