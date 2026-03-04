# Admin System Setup Guide

## Overview
The admin system is now fully integrated into ContentGenie. This guide will help you set up and use the admin functionality.

## ✅ What's Already Done

### Backend (100% Complete)
- ✅ Added `is_admin` column to User model
- ✅ Created comprehensive admin routes (`/api/admin/*`)
- ✅ Implemented `@admin_required` decorator for security
- ✅ Created migration script (`migrate_add_admin_role.py`)
- ✅ Created admin promotion script (`make_admin.py`)
- ✅ Registered admin routes in `app.py`

### Frontend (100% Complete)
- ✅ Created AdminDashboard component with 5 tabs
- ✅ Added admin route to App.jsx (`/admin`)
- ✅ Added admin link to Header.jsx (visible only to admins)
- ✅ Integrated all admin API methods in `api.js`

## 🚀 Setup Steps

### Step 1: Run Database Migration

Navigate to the backend directory and run the migration:

```bash
cd ContentGenei-01/backend
python migrate_add_admin_role.py
```

This will add the `is_admin` column to your User table.

### Step 2: Create Your First Admin

Promote your user account to admin:

```bash
python make_admin.py your-email@example.com
```

Replace `your-email@example.com` with the email you used to register.

### Step 3: Restart Backend Server

If your backend is running, restart it to load the new routes:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
python run.py
```

### Step 4: Test Admin Access

1. Open your browser and navigate to your app
2. Login with your admin account
3. Click on your profile dropdown in the header
4. You should see a new "🛡️ Admin Panel" option
5. Click it to access the admin dashboard at `/admin`

## 📊 Admin Dashboard Features

### Overview Tab
- Total users, content generated, projects, and premium users
- Monthly growth statistics
- Quick stats cards with color-coded metrics

### Users Tab
- View all registered users
- Search users by name or email
- Toggle admin status (promote/demote)
- Toggle premium status
- Ban/unban users (toggle active status)
- Delete users (with confirmation)
- Pagination for large user lists

### Projects Tab
- View all team collaboration projects
- See project owner and member count
- Delete projects (with confirmation)

### Content Tab
- View recently generated content
- See content type and creator
- Monitor content creation activity

### Logs Tab
- View activity logs
- Track user actions and system events
- Monitor platform usage

## 🔒 Security Features

- Admin routes are protected with `@admin_required` decorator
- Frontend checks `backendUser.is_admin` before showing admin UI
- Non-admin users are redirected to dashboard if they try to access `/admin`
- All admin actions require confirmation dialogs
- User deletion has extra warning

## 🎨 UI Features

- Dark mode consistent with the rest of the app
- Responsive design for mobile and desktop
- Real-time data refresh button
- Color-coded status badges
- Smooth animations and transitions
- Icon-based actions for better UX

## 📝 Admin API Endpoints

All endpoints are prefixed with `/api/admin/`:

- `GET /dashboard` - Get dashboard statistics
- `GET /users` - List all users (with pagination and search)
- `POST /users/<id>/toggle-admin` - Toggle admin status
- `POST /users/<id>/toggle-premium` - Toggle premium status
- `POST /users/<id>/toggle-active` - Ban/unban user
- `DELETE /users/<id>` - Delete user
- `GET /projects` - List all projects
- `DELETE /projects/<id>` - Delete project
- `GET /content/recent` - Get recent content
- `GET /activity-logs` - Get activity logs

## 🛠️ Troubleshooting

### "Admin access required" error
- Make sure you ran `make_admin.py` with your email
- Restart the backend server after running the script
- Clear browser cache and re-login

### Admin link not showing in header
- Make sure `backendUser.is_admin` is true
- Check browser console for errors
- Verify backend authentication is working

### Database errors
- Make sure you ran `migrate_add_admin_role.py`
- Check that SQLite database file has write permissions
- Verify database path in `config.py`

## 🎯 Next Steps

1. Create additional admin accounts for your team
2. Customize admin permissions as needed
3. Add more admin features based on your requirements
4. Monitor user activity through the admin dashboard
5. Use analytics to understand platform usage

## 📚 Related Files

- Backend: `backend/routes/admin.py`
- Frontend: `frontend/src/pages/AdminDashboard.jsx`
- Migration: `backend/migrate_add_admin_role.py`
- Admin Script: `backend/make_admin.py`
- API Service: `frontend/src/services/api.js`
- Models: `backend/models.py`

---

**Note**: The admin system is production-ready and fully integrated. Follow the setup steps above to start using it!
