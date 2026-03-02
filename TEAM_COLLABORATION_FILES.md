# Team Collaboration Feature - Complete File List

## 🎯 Core Files (Essential)

### Backend Files

#### 1. **Routes**
- **`backend/routes/team.py`** ⭐ MAIN FILE
  - All team collaboration API endpoints
  - Team members management
  - Project CRUD operations
  - Task management (create, update, delete, review)
  - Collaboration requests (invite, accept, reject)
  - Notifications (get, mark read, delete, clear)
  - Team chat functionality
  - ~1900+ lines of code

#### 2. **Models**
- **`backend/models.py`**
  - `TeamMember` - Team member data structure
  - `TeamProject` - Project data structure (stores tasks in description field as JSON)
  - `CollaborationRequest` - Notifications and requests
  - `TeamChat` - Chat messages between team members

#### 3. **Main App**
- **`backend/app.py`**
  - Flask app initialization
  - CORS configuration (critical for frontend-backend communication)
  - Blueprint registration (registers team_bp from routes/team.py)
  - Database initialization

#### 4. **Configuration**
- **`backend/config.py`**
  - Database configuration
  - JWT secret key
  - Environment variables

#### 5. **Database**
- **`backend/instance/contentgenie_dev.db`**
  - SQLite database file
  - Stores all team collaboration data

### Frontend Files

#### 1. **Main Component**
- **`frontend/src/pages/TeamCollaboration.jsx`** ⭐ MAIN FILE
  - Complete team collaboration UI
  - 4 tabs: Team, Projects, Requests, Chat
  - Kanban board for task management
  - Project creation and management
  - Member invitation system
  - Notification handling
  - Real-time chat interface
  - ~2100+ lines of code

#### 2. **API Service**
- **`frontend/src/services/api.js`**
  - All API methods for team collaboration:
    - `getTeamMembers()`
    - `inviteTeamMember(email)`
    - `removeTeamMember(memberId)`
    - `getTeamProjects()`
    - `createTeamProject(projectData)`
    - `deleteTeamProject(projectId)`
    - `addProjectMember(projectId, email)`
    - `removeProjectMember(projectId, memberEmail)`
    - `updateProjectTasks(projectId, tasks)`
    - `reviewTask(projectId, taskId, action)` ✨ NEW
    - `getNotifications()`
    - `markNotificationRead(notificationId)`
    - `deleteNotification(notificationId)` ✨ NEW
    - `clearAllNotifications()` ✨ NEW
    - `getCollaborationRequests()`
    - `acceptRequest(requestId)`
    - `rejectRequest(requestId)`
    - `getChatConversations()`
    - `getChatMessages(otherUserId)`
    - `sendChatMessage(otherUserId, message)`
    - `clearChat(otherUserId)`

#### 3. **Routing**
- **`frontend/src/App.jsx`**
  - Route definition for `/team-collaboration`
  - Protected route wrapper

#### 4. **Authentication Context**
- **`frontend/src/contexts/AuthContext.jsx`**
  - Provides `currentUser` and `backendUser`
  - Used for authorization checks in TeamCollaboration

### Shared Components (Used by Team Collaboration)

- **`frontend/src/components/ParticlesBackground.jsx`** - Background animation
- **`frontend/src/components/FloatingEmojis.jsx`** - Floating emoji effects
- **`frontend/src/components/Footer.jsx`** - Page footer
- **`frontend/src/components/ProtectedRoute.jsx`** - Route protection

---

## 📊 Database Tables Used

### 1. **team_members**
```sql
- id (primary key)
- user_id (foreign key to users)
- team_id
- role (owner/admin/member)
- status (active/pending/inactive)
- joined_at
- invited_by
```

### 2. **team_projects**
```sql
- id (primary key)
- name
- description (stores JSON: {description: string, tasks: array})
- owner_id (foreign key to users)
- members (JSON array of email addresses)
- created_at
- updated_at
```

### 3. **collaboration_requests**
```sql
- id (primary key)
- from_user_id (foreign key to users)
- to_email
- to_user_id (foreign key to users)
- message
- request_type (join_team, project_invitation, task_assignment, task_completed, task_reverted, task_approved)
- project_id (foreign key to team_projects)
- status (pending, accepted, rejected, read)
- created_at
- updated_at
- responded_at
```

### 4. **team_chat**
```sql
- id (primary key)
- from_user_id (foreign key to users)
- to_user_id (foreign key to users)
- message
- read (boolean)
- created_at
```

### 5. **users** (Referenced)
```sql
- id (primary key)
- email
- name
- firebase_uid
- (other user fields)
```

---

## 🔄 Data Flow

### Team Invitation Flow
```
Frontend (TeamCollaboration.jsx)
  → api.inviteTeamMember(email)
  → API Service (api.js)
  → POST /api/team/members/invite
  → Backend (routes/team.py: invite_member())
  → Creates CollaborationRequest with type='join_team'
  → Database (collaboration_requests table)
```

### Project Creation Flow
```
Frontend (TeamCollaboration.jsx)
  → api.createTeamProject({name, description})
  → API Service (api.js)
  → POST /api/team/projects
  → Backend (routes/team.py: create_project())
  → Creates TeamProject
  → Database (team_projects table)
```

### Task Assignment Flow
```
Frontend (TeamCollaboration.jsx)
  → api.updateProjectTasks(projectId, tasks)
  → API Service (api.js)
  → PUT /api/team/projects/:id/tasks
  → Backend (routes/team.py: update_project_tasks())
  → Detects new assignee
  → Creates CollaborationRequest with type='task_assignment'
  → Database (team_projects + collaboration_requests tables)
```

### Task Review Flow (NEW)
```
Frontend (TeamCollaboration.jsx)
  → api.reviewTask(projectId, taskId, 'approve' or 'revert')
  → API Service (api.js)
  → POST /api/team/projects/:id/tasks/:taskId/review
  → Backend (routes/team.py: review_task())
  → Updates task status (if revert)
  → Creates notification (task_approved or task_reverted)
  → Database (team_projects + collaboration_requests tables)
```

---

## 🎨 UI Components Breakdown

### TeamCollaboration.jsx Structure

#### State Variables (40+)
- `teamMembers` - List of team members
- `projects` - List of projects
- `requests` - Collaboration requests/notifications
- `selectedProject` - Currently selected project
- `projectTasks` - Tasks for selected project
- `activeTab` - Current tab (team/projects/requests/chat)
- `notifications` - Notification list
- `showNotificationPopup` - Popup visibility
- And many more...

#### Main Sections
1. **Team Tab**
   - Team member list
   - Invite member form
   - Remove member functionality

2. **Projects Tab**
   - Project list view
   - Project detail view (Kanban board)
   - Create project form
   - Add members to project
   - Task management (create, assign, update status)
   - Task review (approve/revert) ✨ NEW

3. **Requests Tab**
   - Collaboration requests list
   - Accept/Reject buttons
   - Mark as read functionality
   - Delete notification (X button) ✨ NEW
   - Clear all notifications ✨ NEW
   - Different notification types display

4. **Chat Tab**
   - Conversation list
   - Chat messages
   - Send message
   - Clear chat

---

## 🔧 Configuration Files

- **`backend/.env`** (or `.env.example`)
  - Database URL
  - JWT secret
  - Firebase credentials

- **`backend/requirements.txt`**
  - Flask dependencies
  - SQLAlchemy
  - Flask-JWT-Extended
  - Flask-CORS

---

## 📝 Migration Files

- **`backend/migrate_team_tables.py`**
  - Database migration script for team tables
  - Creates team_members, team_projects, collaboration_requests tables

---

## 🚀 Startup Files

- **`backend/run.py`** - Backend entry point
- **`restart-backend.bat`** - Windows script to restart backend
- **`RESTART_BACKEND_NOW.bat`** - Alternative restart script

---

## 📚 Documentation Files

- **`TEAM_COLLABORATION_FIX_COMPLETE.md`** - Previous implementation docs
- **`TASK_REVIEW_FEATURE_COMPLETE.md`** - Latest feature docs ✨ NEW
- **`ADD_MEMBER_FIX_SUMMARY.txt`** - Member addition fix
- **`HOW_TO_TEST_ADD_MEMBER.txt`** - Testing guide
- **`TEST_ADD_MEMBER.md`** - Test documentation

---

## ✅ Complete File Checklist

### Must Have (Core Functionality)
- ✅ `backend/routes/team.py`
- ✅ `backend/models.py`
- ✅ `backend/app.py`
- ✅ `backend/config.py`
- ✅ `backend/instance/contentgenie_dev.db`
- ✅ `frontend/src/pages/TeamCollaboration.jsx`
- ✅ `frontend/src/services/api.js`
- ✅ `frontend/src/App.jsx`
- ✅ `frontend/src/contexts/AuthContext.jsx`

### Supporting Files
- ✅ `frontend/src/components/ParticlesBackground.jsx`
- ✅ `frontend/src/components/FloatingEmojis.jsx`
- ✅ `frontend/src/components/Footer.jsx`
- ✅ `frontend/src/components/ProtectedRoute.jsx`

### Configuration
- ✅ `backend/.env` or `backend/.env.example`
- ✅ `backend/requirements.txt`

### Utilities
- ✅ `backend/run.py`
- ✅ `restart-backend.bat`

---

## 🎯 Summary

**Total Essential Files: 9 core files**
- 5 Backend files
- 4 Frontend files

**Total Supporting Files: 8 files**
- 4 UI components
- 2 Configuration files
- 2 Utility scripts

**Grand Total: 17 files** make the complete Team Collaboration feature work.

The two most critical files are:
1. **`backend/routes/team.py`** - All backend logic
2. **`frontend/src/pages/TeamCollaboration.jsx`** - All frontend UI

Everything else supports these two main files.
