# Setup Guide - Team Collaboration Features

## 🚀 Quick Start (After Code Changes)

### Step 1: Restart Backend Server

```bash
# Stop the current backend server (Ctrl+C in terminal)

# Navigate to backend directory
cd ContentGenei-01/backend

# Restart the server
python run.py

# You should see:
# * Running on http://127.0.0.1:5001
# * No import errors
# * All routes registered
```

### Step 2: Verify Imports

The backend should start without errors. If you see import errors, check:

```python
# ContentGenei-01/backend/routes/team.py should have:
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, TeamMember, TeamProject, CollaborationRequest, TeamChat
from services.mongodb_service import mongodb_service  # ✅ Fixed
from datetime import datetime, timezone
from sqlalchemy import or_, and_
import json
import re
import uuid  # ✅ Added
```

### Step 3: Test the Fix

Try adding a member to a project from the frontend. The error should be gone!

---

## 📋 Complete Setup Checklist

### Backend Setup

- [x] ✅ Fixed mongodb_service import
- [x] ✅ Added uuid import
- [x] ✅ All new endpoints added
- [ ] Restart backend server
- [ ] Verify no errors in console
- [ ] Test endpoints with Postman (optional)

### Frontend Setup

- [x] ✅ API methods added to api.js
- [ ] Implement UI components (see FRONTEND_IMPLEMENTATION_GUIDE.md)
- [ ] Test each feature
- [ ] Add loading states
- [ ] Add error handling

### Database Setup

- [ ] Ensure PostgreSQL/SQLite is running
- [ ] Run migrations if needed
- [ ] Verify MongoDB connection (optional)

---

## 🔧 What Was Fixed

### 1. Import Error - FIXED ✅

**Before:**
```python
# Missing imports caused error
from flask import Blueprint, request, jsonify
from models import db, User, ...
# mongodb_service was not imported ❌
```

**After:**
```python
# All imports present
from flask import Blueprint, request, jsonify
from models import db, User, ...
from services.mongodb_service import mongodb_service  # ✅
import uuid  # ✅
```

### 2. All New Features Ready ✅

- Role management endpoints
- Task submission endpoint
- Daily updates endpoints
- Enhanced notifications
- Fully editable profile

---

## 🧪 Testing the Fix

### Test 1: Add Member to Project

1. Login to your app
2. Go to Team Collaboration
3. Open a project
4. Click "Add Members"
5. Select a team member
6. Click "Add"

**Expected Result:** ✅ Member added successfully (no error)

### Test 2: Check Backend Logs

Look at your backend console. You should see:
```
INFO: POST /api/team/projects/<id>/members
INFO: 200 OK
```

No errors about mongodb_service!

### Test 3: Verify Notification Created

Check if notification was created:
- Member should see notification in Requests tab
- MongoDB notification created (if MongoDB is connected)
- SQL notification created as backup

---

## 🎯 Next Steps

### 1. Implement Frontend UI

Follow the guide in `FRONTEND_IMPLEMENTATION_GUIDE.md` to add:
- Task submission modal
- Daily updates feed
- Role management UI
- Enhanced notifications

### 2. Test All Features

Test each new feature:
- [ ] Add member to project
- [ ] Update member role
- [ ] Transfer leadership
- [ ] Submit task
- [ ] Post daily update
- [ ] View notifications

### 3. Deploy

Once everything works locally:
1. Commit your changes
2. Push to repository
3. Deploy backend
4. Deploy frontend
5. Test in production

---

## 📊 Verification Commands

### Check Backend Status
```bash
# Check if backend is running
curl http://localhost:5001/api/health

# Expected: {"status": "healthy"}
```

### Check Imports
```bash
# Run Python syntax check
cd ContentGenei-01/backend
python -m py_compile routes/team.py

# No output = success ✅
```

### Check Database
```bash
# Open Python shell
python

# Test imports
>>> from services.mongodb_service import mongodb_service
>>> from models import User
>>> print("Imports OK!")
```

---

## 🐛 If You Still See Errors

### Error: "mongodb_service is not defined"

**Solution:**
1. Make sure you saved the file
2. Restart the backend server
3. Clear Python cache:
   ```bash
   find . -type d -name __pycache__ -exec rm -r {} +
   ```

### Error: "No module named 'services'"

**Solution:**
Check your directory structure:
```
ContentGenei-01/backend/
├── routes/
│   └── team.py
├── services/
│   └── mongodb_service.py  # Must exist
└── run.py
```

### Error: "Cannot import name 'mongodb_service'"

**Solution:**
Check `services/mongodb_service.py` has:
```python
# At the end of the file
mongodb_service = MongoDBService()
```

---

## 💡 Pro Tips

1. **Always restart backend after code changes**
   - Python doesn't auto-reload all modules
   - Ctrl+C then `python run.py`

2. **Check console for errors**
   - Backend console shows all errors
   - Don't ignore warnings

3. **Test incrementally**
   - Test one feature at a time
   - Verify it works before moving on

4. **Use browser dev tools**
   - Check Network tab for API calls
   - Look at Console for errors

5. **Keep documentation handy**
   - IMPLEMENTATION_COMPLETE.md - Overview
   - TROUBLESHOOTING.md - Error solutions
   - FRONTEND_IMPLEMENTATION_GUIDE.md - UI code

---

## ✅ Success Indicators

You'll know everything is working when:

✅ Backend starts without errors
✅ No "mongodb_service is not defined" error
✅ Can add members to projects
✅ Notifications are created
✅ All API endpoints respond correctly
✅ No CORS errors in browser

---

## 📞 Need Help?

1. Check TROUBLESHOOTING.md for common errors
2. Review backend console logs
3. Test endpoints with curl/Postman
4. Verify all imports are correct
5. Make sure backend is restarted

---

## 🎉 You're All Set!

The backend is now ready with all new features:
- ✅ Bug fixes applied
- ✅ New endpoints added
- ✅ Imports fixed
- ✅ Ready to use

**Next:** Implement the frontend UI components and start testing!

---

**Status:** ✅ READY TO USE
**Last Updated:** After fixing mongodb_service import
