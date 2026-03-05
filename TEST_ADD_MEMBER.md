# How to Debug "Failed to Fetch" Error - Add Member to Project

## Step 1: Check Backend is Running

Open a terminal and run:
```bash
curl http://localhost:5000/api/health
```

Expected: Should return `{"status": "healthy"}`

---

## Step 2: Check Browser Console

1. Open your app in browser (http://localhost:5173)
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Try to add a member to a project
5. Look for error messages (red text)

**Common errors:**
- `CORS error` - Backend CORS not configured properly
- `401 Unauthorized` - Token expired or invalid
- `404 Not Found` - Wrong API endpoint
- `Network error` - Backend not running

---

## Step 3: Check Network Tab

1. In Developer Tools, go to **Network** tab
2. Try to add a member again
3. Look for the request to `/api/team/projects/{id}/members`
4. Click on it and check:
   - **Status Code**: Should be 200
   - **Request Headers**: Should have `Authorization: Bearer <token>`
   - **Response**: Check the error message

---

## Step 4: Manual Test with curl

Get your token from localStorage:
1. Open browser console (F12)
2. Type: `localStorage.getItem('token')`
3. Copy the token (without quotes)

Then test the endpoint:
```bash
# Replace YOUR_TOKEN and PROJECT_ID
curl -X POST http://localhost:5000/api/team/projects/PROJECT_ID/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"email\": \"test@example.com\"}"
```

---

## Common Issues & Fixes

### Issue 1: CORS Error
**Symptom**: "Access to fetch blocked by CORS policy"

**Fix**: Check `backend/app.py` has correct CORS configuration:
```python
CORS(app, 
     origins=["http://localhost:5173", "http://localhost:3000"],
     supports_credentials=True)
```

### Issue 2: 401 Unauthorized
**Symptom**: "Invalid token" or "Token expired"

**Fix**: 
1. Logout and login again
2. Check token in localStorage: `localStorage.getItem('token')`
3. Token should start with `eyJ`

### Issue 3: 404 Not Found
**Symptom**: "Cannot POST /api/team/projects/.../members"

**Fix**: Check the route in `backend/routes/team.py`:
```python
@team_bp.route('/projects/<project_id>/members', methods=['POST', 'OPTIONS'])
```

### Issue 4: Backend Not Running
**Symptom**: "Failed to fetch" or "Network error"

**Fix**: Start backend:
```bash
cd backend
python run.py
```

---

## Quick Debug Commands

### Check if backend is running:
```bash
curl http://localhost:5000/api/health
```

### Check if route exists:
```bash
curl -X OPTIONS http://localhost:5000/api/team/projects/test/members \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" -v
```

### Check team routes:
```bash
curl http://localhost:5000/api/team/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## What to Check in Code

### Frontend (TeamCollaboration.jsx line 572):
```javascript
const response = await api.addProjectMember(selectedProject.id, memberEmail)
```

### Frontend (api.js line 334):
```javascript
async addProjectMember(projectId, email) {
  return this.request(`/team/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email })
  })
}
```

### Backend (team.py line 1309):
```python
@team_bp.route('/projects/<project_id>/members', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def add_project_member(project_id):
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    # ... rest of code
```

---

## Expected Flow

1. User clicks "Add" button in Add Members modal
2. Frontend calls `api.addProjectMember(projectId, email)`
3. API service sends POST to `/api/team/projects/{id}/members`
4. Backend receives request, validates token
5. Backend adds member to project
6. Backend creates notification for invited user
7. Backend returns success response
8. Frontend shows success alert

---

## If Still Not Working

Run these commands and share the output:

```bash
# 1. Check backend logs
cd backend
python run.py

# 2. In browser console (F12), run:
localStorage.getItem('token')
localStorage.getItem('user')

# 3. Check network request
# Open Network tab, try to add member, click on the failed request
# Share: Status Code, Request Headers, Response
```
