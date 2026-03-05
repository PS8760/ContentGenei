# Git Commit Guide - Content Genie Features

This guide organizes all files by feature to help you create clean, focused commits.

---

## 📋 FEATURE 1: PROFILE SYSTEM
**Description**: Complete user profile management with favorites, collaborators, stats, and platform integrations

### Frontend Files:
```
frontend/src/pages/Profile.jsx
frontend/src/contexts/ProfileContext.jsx
```

### Backend Files:
```
backend/routes/profile.py
backend/services/profile_service.py
```

### Database Models (if modified):
```
backend/models.py (User model fields related to profile)
```

### Commit Command:
```bash
git add frontend/src/pages/Profile.jsx
git add frontend/src/contexts/ProfileContext.jsx
git add backend/routes/profile.py
git add backend/services/profile_service.py
git commit -m "feat: Add complete profile system with favorites and collaborators

- User profile page with editable fields (name, title, location, bio)
- Tech stack & interests tags management
- AI voice settings (tone, target audience)
- Platform integration hub (LinkedIn, Twitter, Instagram, YouTube)
- My Featured Creations section (favorites from Creator page)
- Professional Network section (collaborators from Team Collaboration)
- Local stats dashboard (posts created, top niche, time saved)
- ProfileContext for state management
- Backend profile routes with MongoDB integration
- Full light/dark theme support with rounded-3xl cards"
```

---

## 📝 FEATURE 2: ONBOARDING SYSTEM (MCQ STEPPER)
**Description**: 4-step onboarding flow with 9 questions, route guards, and validation

### Frontend Files:
```
frontend/src/pages/Onboarding.jsx
frontend/src/pages/SignIn.jsx
frontend/src/pages/Login.jsx
frontend/src/App.jsx
frontend/src/components/ProtectedRoute.jsx
```

### Backend Files:
```
backend/routes/profile.py (onboarding endpoints)
```

### Commit Command:
```bash
git add frontend/src/pages/Onboarding.jsx
git add frontend/src/pages/SignIn.jsx
git add frontend/src/pages/Login.jsx
git add frontend/src/App.jsx
git add frontend/src/components/ProtectedRoute.jsx
git commit -m "feat: Implement 4-step onboarding with route guards

Step 1: Professional Identity (name, title, location)
Step 2: Brand Voice & Persona (voice, audience, bio)
Step 3: Platform Permissions (Instagram, Twitter, LinkedIn, YouTube)
Step 4: Niche Expertise (tags, primary goal)

- Hard route guard in App.jsx checks localStorage onboarding_complete
- ProtectedRoute simplified to remove async API calls
- SignIn/Login redirect to /onboarding for new users
- SignIn/Login redirect to /dashboard for returning users
- All 9 questions with proper validation
- Modern progress stepper with dots and slim progress bar
- Saves to both localStorage and backend
- Prevents double-reload issue
- Full theme support (light/dark mode)"
```

---

## 🤝 FEATURE 3: TEAM COLLABORATION SYSTEM
**Description**: Complete team collaboration with projects, members, tasks, notifications, and chat

### Frontend Files:
```
frontend/src/pages/TeamCollaboration.jsx
frontend/src/services/api.js
```

### Backend Files:
```
backend/routes/team.py
backend/app.py (CORS configuration)
backend/models.py (TeamProject, TeamMember, CollaborationRequest, TeamChat)
```

### Commit Command:
```bash
git add frontend/src/pages/TeamCollaboration.jsx
git add frontend/src/services/api.js
git add backend/routes/team.py
git add backend/app.py
git commit -m "feat: Complete team collaboration with notifications

Projects:
- Create/view/manage projects with backend persistence
- Add/remove members by email
- Task management with assignment and completion
- Project visibility for both owners and members

Notifications:
- Project invitation notifications
- Task assignment notifications
- Task completion notifications to team leader
- Member joined notifications
- Notification popup (auto-hides after 5s)
- Requests tab with different icons per type

Chat:
- Real-time messaging between team members
- Message history with timestamps
- Unread message indicators

Team Requests:
- Send/accept/reject collaboration requests
- Join team functionality

Backend:
- Fixed CORS for add/remove members
- Proper OPTIONS handling for preflight requests
- JWT authentication with optional flag for OPTIONS
- Project member visibility (owned + member projects)
- Notification system with multiple types
- Store project_id in message field as (project_id:123)

Frontend:
- Standardized localStorage key: content_genie_collaborators
- Professional Network section in Profile page
- Full theme support with rounded-3xl cards"
```

---

## 🔐 FEATURE 4: AUTHENTICATION & TOKEN MANAGEMENT
**Description**: JWT token handling, automatic refresh, and Firebase integration

### Frontend Files:
```
frontend/src/contexts/AuthContext.jsx
frontend/src/services/api.js
```

### Backend Files:
```
backend/routes/auth.py
```

### Commit Command:
```bash
git add frontend/src/contexts/AuthContext.jsx
git add frontend/src/services/api.js
git add backend/routes/auth.py
git commit -m "feat: Enhanced authentication with automatic token refresh

- JWT identity explicitly converted to string (user.id)
- Automatic token refresh on 401 errors
- Retry logic in API request method
- Enhanced getAuthHeaders() with token refresh
- Comprehensive logging throughout auth flow
- Token flow: Firebase → idToken → JWT → localStorage → API calls
- Backend port: http://localhost:5000
- Frontend port: http://localhost:5173"
```

---

## 📦 FILES TO EXCLUDE FROM COMMITS

### Always exclude:
```
node_modules/
backend/venv/
backend/__pycache__/
backend/**/__pycache__/
*.pyc
*.db
backend/instance/*.db
.env
.DS_Store
```

### Documentation files (commit separately):
```
*.md (except README.md)
*.txt
```

---

## 🌿 RECOMMENDED BRANCH STRATEGY

### Create separate branches for each feature:
```bash
# Profile Feature
git checkout -b feature/profile-system
# ... make commits ...
git push origin feature/profile-system

# Onboarding Feature
git checkout main
git checkout -b feature/onboarding-system
# ... make commits ...
git push origin feature/onboarding-system

# Team Collaboration Feature
git checkout main
git checkout -b feature/team-collaboration
# ... make commits ...
git push origin feature/team-collaboration

# Authentication Feature
git checkout main
git checkout -b feature/auth-token-management
# ... make commits ...
git push origin feature/auth-token-management
```

---

## 📊 QUICK REFERENCE: FILE LOCATIONS

### Profile System:
- **Frontend**: `frontend/src/pages/Profile.jsx`, `frontend/src/contexts/ProfileContext.jsx`
- **Backend**: `backend/routes/profile.py`, `backend/services/profile_service.py`

### Onboarding System:
- **Frontend**: `frontend/src/pages/Onboarding.jsx`, `frontend/src/App.jsx`, `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/pages/SignIn.jsx`, `frontend/src/pages/Login.jsx`
- **Backend**: `backend/routes/profile.py` (onboarding endpoints)

### Team Collaboration:
- **Frontend**: `frontend/src/pages/TeamCollaboration.jsx`, `frontend/src/services/api.js`
- **Backend**: `backend/routes/team.py`, `backend/app.py` (CORS)
- **Models**: `backend/models.py` (TeamProject, TeamMember, CollaborationRequest, TeamChat)

### Authentication:
- **Frontend**: `frontend/src/contexts/AuthContext.jsx`, `frontend/src/services/api.js`
- **Backend**: `backend/routes/auth.py`

---

## 🎯 KEY TECHNICAL DETAILS

### Profile System:
- Uses `localStorage` for favorites: `favorites_content`
- Uses `localStorage` for collaborators: `content_genie_collaborators`
- Uses `localStorage` for profile: `user_profile`
- Uses `localStorage` for stats: `user_stats`
- Cards use `rounded-3xl`, buttons use `rounded-2xl`, avatars use `rounded-full`

### Onboarding System:
- 4 steps, 9 questions total
- Uses `localStorage` key: `onboarding_complete` (value: 'true')
- Hard route guard in `App.jsx` checks localStorage
- `ProtectedRoute` has `requireOnboarding` prop (default: true)
- Saves to both localStorage and backend

### Team Collaboration:
- Projects stored in backend database (SQLite)
- Members can see projects they own OR are members of
- Notification types: `project_invitation`, `task_assignment`, `task_completed`, `member_joined`, `join_team`
- Project ID stored in message field as `(project_id:123)`
- CORS allows: `http://localhost:5173`, `http://localhost:3000`, production URL

### Authentication:
- JWT identity is database user ID (`user.id`), NOT Firebase UID
- Token stored in localStorage: `token`
- Automatic refresh on 401 errors
- Backend port: `http://localhost:5000`
- Frontend port: `http://localhost:5173`

---

## ✅ VERIFICATION CHECKLIST

Before committing, verify:
- [ ] No `node_modules/` or `venv/` included
- [ ] No `.db` files included
- [ ] No `.env` files included
- [ ] No `__pycache__/` directories included
- [ ] All related files for the feature are included
- [ ] Commit message follows format: `feat: Description`
- [ ] Branch name is descriptive: `feature/feature-name`

---

## 🚀 DEPLOYMENT NOTES

### Environment Variables Required:
```
# Backend (.env)
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_URL=sqlite:///instance/contentgenie_dev.db
MONGODB_URI=your-mongodb-uri
FIREBASE_CREDENTIALS=path-to-firebase-credentials.json

# Frontend (.env)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_API_URL=http://localhost:5000
```

### Ports:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

---

## 📝 NOTES

1. **Profile Feature** includes the "My Featured Creations" (favorites) and "Professional Network" (collaborators) sections
2. **Onboarding Feature** includes the MCQ stepper with 4 steps and 9 questions
3. **Team Collaboration** includes projects, members, tasks, notifications, and chat
4. **Authentication** includes JWT token management and automatic refresh

All features have full light/dark theme support and use the standardized design system (rounded-3xl for cards, rounded-2xl for buttons).
