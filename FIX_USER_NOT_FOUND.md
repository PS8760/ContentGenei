# 🔧 Fix "User not found" Error

## What's Happening

Your backend is running, but the PostgreSQL database is empty. When you log in:
1. ✅ Firebase authenticates you
2. ✅ Frontend sends request to backend
3. ❌ Backend can't find user in empty database
4. ❌ Returns "User not found"

## The Fix (5 minutes)

### Step 1: Wait for Latest Deployment (2 min)

The SSL fix was just pushed. Wait for Render to finish deploying:

1. Go to: https://dashboard.render.com
2. Click your backend service
3. Look for "Your service is live" ✅
4. Check logs - should see no SSL errors

### Step 2: Initialize Database Tables (1 min)

Once deployed, run migrations to create tables:

**Option A: Using Render Shell (Recommended)**
1. In Render Dashboard → Your Service
2. Click "Shell" tab (left sidebar)
3. Run:
```bash
cd backend
python -m flask db upgrade
```

**Option B: Using Render Environment Variable**
1. Add this to Render Environment:
   - Key: `FLASK_APP`
   - Value: `app.py`
2. Then in Shell:
```bash
flask db upgrade
```

### Step 3: Test Login (1 min)

1. Go to: https://content-genei-dhphy2e82-ps8760s-projects.vercel.app
2. Log in with: `ghodkepranav825@gmail.com`
3. The backend will automatically create your user
4. Should work! ✅

## Alternative: Manual Database Setup

If migrations don't work, you can initialize the database directly:

### In Render Shell:

```bash
cd backend
python << EOF
from app import create_app
from models import db

app = create_app('production')
with app.app_context():
    db.create_all()
    print("Database tables created!")
EOF
```

## Troubleshooting

### "flask: command not found"
Run this first:
```bash
cd backend
pip install flask
```

### "No module named 'flask_migrate'"
The migrations might not be set up. Use the manual method above.

### Still getting "User not found"

Check Render logs for the exact error:
1. Dashboard → Your Service → Logs
2. Look for errors when you try to log in
3. Send me the error message

Common issues:
- **SSL error** - Wait for deployment to finish
- **Connection timeout** - DATABASE_URL might be wrong
- **Table doesn't exist** - Run migrations again

## Quick Check - Is Everything Set?

In Render Environment tab, verify you have:

### Critical Variables:
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `FIREBASE_PROJECT_ID` - From Firebase
- [ ] `FIREBASE_PRIVATE_KEY` - From Firebase (with \n)
- [ ] `FIREBASE_CLIENT_EMAIL` - From Firebase
- [ ] `SECRET_KEY` - Long random string
- [ ] `JWT_SECRET_KEY` - Long random string
- [ ] `FLASK_ENV=production`
- [ ] `FLASK_APP=app.py`

### For Full Functionality:
- [ ] `MONGODB_URI` - For LinkoGenei
- [ ] `MONGODB_DB_NAME=linkogenei`
- [ ] `GROQ_API_KEY` - For AI features
- [ ] `ENCRYPTION_KEY` - For OAuth
- [ ] `CORS_ORIGINS` - Your Vercel URL

## What Should Happen

After running migrations and logging in:

1. ✅ Database tables created
2. ✅ You log in with Firebase
3. ✅ Backend creates user automatically
4. ✅ Dashboard loads
5. ✅ All features work

## Timeline

- Wait for deployment: 2-3 minutes
- Run migrations: 30 seconds
- Test login: 30 seconds
- **Total: ~5 minutes**

---

## Quick Commands Reference

### Check if database is connected:
```bash
cd backend
python -c "from app import create_app; from models import db; app = create_app('production'); app.app_context().push(); print('Connected!' if db.engine.connect() else 'Failed')"
```

### List all tables:
```bash
cd backend
python -c "from app import create_app; from models import db; app = create_app('production'); app.app_context().push(); print(db.engine.table_names())"
```

### Count users:
```bash
cd backend
python -c "from app import create_app; from models import db, User; app = create_app('production'); app.app_context().push(); print(f'Users: {User.query.count()}')"
```

---

**Start with Step 1 - wait for deployment, then run migrations!**
