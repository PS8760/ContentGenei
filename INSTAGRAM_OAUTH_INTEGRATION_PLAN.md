# 📋 Instagram OAuth Integration Plan

## 🎯 Integration Goal

Integrate Instagram OAuth from `origin/Instagram-feature` branch into current `content-library` branch **WITHOUT** breaking existing onboarding flow or authentication.

---

## 🔍 Analysis Summary

### Files Analyzed from Instagram-feature Branch:

1. **backend/models_instagram.py** - 3 models (InstagramConnection, InstagramPost, InstagramCompetitor)
2. **backend/services/instagram_service.py** - OAuth and API service
3. **backend/routes/instagram.py** - 16 endpoints (OAuth, sync, analytics, competitors)
4. **frontend/src/pages/InstagramCallback.jsx** - OAuth callback handler
5. **frontend/src/services/api.js** - API client methods

### Current Architecture:

1. **Onboarding Flow** (frontend/src/pages/Onboarding.jsx):
   - 4-step stepper form
   - Step 3 asks: "Which platforms do you want to connect?"
   - Platforms stored in `formData.platforms` object
   - On completion: saves to backend + localStorage → navigates to `/dashboard`

2. **User Model** (backend/models.py):
   - Already has `PlatformConnection` model for GeneiLink feature
   - User entity with relationships

3. **Current Platform Support**:
   - GeneiLink already has `PlatformConnection` model
   - Supports: instagram, linkedin, twitter, facebook

---

## ⚠️ Key Constraints

1. ✅ **DO NOT** switch branches
2. ✅ **DO NOT** modify main branch
3. ✅ **DO NOT** change stepper logic
4. ✅ **DO NOT** break authentication
5. ✅ **DO NOT** add separate connect button
6. ✅ **DO NOT** bypass onboarding
7. ✅ **MUST** integrate OAuth into existing onboarding flow
8. ✅ **MUST** link tokens to existing User entity
9. ✅ **MUST** be modular for future platforms (Twitter, LinkedIn)

---

## 🏗️ Proposed Architecture

### Modular Structure:

```
backend/
├── platforms/                    # NEW: Platform integrations
│   ├── __init__.py
│   ├── base_platform.py         # Base class for all platforms
│   └── instagram/
│       ├── __init__.py
│       ├── instagram_model.py   # InstagramConnection model
│       ├── instagram_service.py # OAuth + API service
│       └── instagram_controller.py # Routes/endpoints
│
├── models.py                     # Keep existing models
├── app.py                        # Register platform blueprints
└── routes/
    └── platforms.py              # NEW: Platform orchestration

frontend/
├── pages/
│   ├── Onboarding.jsx           # NO CHANGES (keep as-is)
│   ├── Dashboard.jsx            # Add OAuth trigger logic
│   └── platforms/               # NEW: Platform callbacks
│       └── InstagramCallback.jsx
│
└── services/
    ├── api.js                   # Add platform methods
    └── platformService.js       # NEW: Platform orchestration
```

---

## 📦 What to Extract from Instagram-feature

### ✅ INCLUDE (Minimal OAuth):

1. **Models** (from `models_instagram.py`):
   - `InstagramConnection` only (NOT InstagramPost, NOT InstagramCompetitor)
   - Refactor to fit modular structure

2. **Service** (from `instagram_service.py`):
   - `get_oauth_url()` - Generate OAuth URL
   - `exchange_code_for_token()` - Exchange code for token
   - `get_long_lived_token()` - Get 60-day token
   - `get_user_profile()` - Get basic profile info

3. **Routes** (from `instagram.py`):
   - `/auth` - Generate OAuth URL
   - `/callback` - Handle OAuth callback
   - `/exchange-token` - Exchange code for token
   - `/connections` - Get user's connections
   - `/connections/<id>` DELETE - Disconnect account

4. **Frontend**:
   - `InstagramCallback.jsx` - OAuth callback page
   - API methods for OAuth flow

### ❌ EXCLUDE (Not needed yet):

- Analytics endpoints
- Sync endpoints
- Competitor tracking
- InstagramPost model
- InstagramCompetitor model
- Dashboard data endpoints
- AI suggestions
- Media insights
- All analytics UI

---

## 🔄 Integration Flow

### Current Flow (Onboarding):
```
1. User logs in
2. If new → Onboarding stepper
3. Step 3: Select platforms (Instagram checkbox)
4. Complete onboarding → Save data → Navigate to /dashboard
```

### New Flow (With Instagram OAuth):
```
1. User logs in
2. If new → Onboarding stepper
3. Step 3: Select platforms (Instagram checkbox)
4. Complete onboarding → Save data
5. Check selected platforms:
   IF Instagram selected:
     → Redirect to Instagram OAuth
     → User authorizes
     → Callback to /platforms/instagram/callback
     → Exchange code for token
     → Save InstagramConnection
     → Navigate to /dashboard
   ELSE:
     → Navigate to /dashboard directly
```

---

## 📝 Implementation Plan

### Phase 1: Backend Structure (Modular)

#### Step 1.1: Create Base Platform Class
**File**: `backend/platforms/base_platform.py`

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BasePlatform(ABC):
    """Base class for all platform integrations"""
    
    @abstractmethod
    def get_oauth_url(self, state: str, redirect_uri: str) -> str:
        """Generate OAuth URL"""
        pass
    
    @abstractmethod
    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        pass
    
    @abstractmethod
    def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        """Get user profile information"""
        pass
    
    @abstractmethod
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token"""
        pass
```

#### Step 1.2: Create Instagram Model
**File**: `backend/platforms/instagram/instagram_model.py`

Extract ONLY `InstagramConnection` from `models_instagram.py`:
- Link to User via `user_id` foreign key
- Store OAuth tokens
- Store profile info (username, followers, etc.)
- Add `is_active` flag

#### Step 1.3: Create Instagram Service
**File**: `backend/platforms/instagram/instagram_service.py`

Extract from `instagram_service.py`:
- Inherit from `BasePlatform`
- `get_oauth_url()` - Uses env vars
- `exchange_code_for_token()` - Short-lived token
- `get_long_lived_token()` - 60-day token
- `get_user_profile()` - Basic profile

#### Step 1.4: Create Instagram Controller
**File**: `backend/platforms/instagram/instagram_controller.py`

Extract from `instagram.py`:
- `GET /auth` - Generate OAuth URL
- `GET /callback` - Handle OAuth callback (NO JWT required)
- `POST /exchange-token` - Exchange code (JWT required)
- `GET /connections` - List connections (JWT required)
- `DELETE /connections/<id>` - Disconnect (JWT required)

#### Step 1.5: Register Blueprint
**File**: `backend/app.py`

```python
from platforms.instagram.instagram_controller import instagram_bp

app.register_blueprint(instagram_bp, url_prefix='/api/platforms/instagram')
```

---

### Phase 2: Frontend Integration

#### Step 2.1: Create Platform Service
**File**: `frontend/src/services/platformService.js`

```javascript
class PlatformService {
  async initiateOAuth(platform, redirectUri) {
    // Get OAuth URL from backend
    // Redirect user to platform OAuth
  }
  
  async handleCallback(platform, code, state) {
    // Exchange code for token
    // Save connection
  }
  
  async getConnections(platform) {
    // Get user's platform connections
  }
  
  async disconnect(platform, connectionId) {
    // Disconnect platform
  }
}
```

#### Step 2.2: Create Instagram Callback Page
**File**: `frontend/src/pages/platforms/InstagramCallback.jsx`

Extract from Instagram-feature:
- Parse URL params (code, state, error)
- Call backend to exchange token
- Show loading/success/error states
- Redirect to dashboard on success

#### Step 2.3: Update API Service
**File**: `frontend/src/services/api.js`

Add methods:
```javascript
// Instagram OAuth
getInstagramAuthUrl: () => api.get('/platforms/instagram/auth'),
exchangeInstagramToken: (code, state) => api.post('/platforms/instagram/exchange-token', { code, state }),
getInstagramConnections: () => api.get('/platforms/instagram/connections'),
disconnectInstagram: (connectionId) => api.delete(`/platforms/instagram/connections/${connectionId}`)
```

#### Step 2.4: Update App Routes
**File**: `frontend/src/App.jsx`

Add route:
```jsx
<Route path="/platforms/instagram/callback" element={<InstagramCallback />} />
```

#### Step 2.5: Update Onboarding Completion
**File**: `frontend/src/pages/Onboarding.jsx`

Modify `handleFinish()`:
```javascript
const handleFinish = async () => {
  // ... existing validation ...
  
  // Save onboarding data
  await apiService.completeOnboarding(onboardingData)
  
  // Check if Instagram was selected
  if (formData.platforms.instagram) {
    // Get OAuth URL
    const response = await apiService.getInstagramAuthUrl()
    // Redirect to Instagram OAuth
    window.location.href = response.oauth_url
  } else {
    // Navigate to dashboard directly
    navigate('/dashboard')
  }
}
```

---

### Phase 3: Database Migration

#### Step 3.1: Create Migration Script
**File**: `backend/migrate_instagram_oauth.py`

```python
from models import db
from platforms.instagram.instagram_model import InstagramConnection

# Create instagram_connections table
db.create_all()
```

#### Step 3.2: Update .env.example
**File**: `backend/.env.example`

Add:
```
# Instagram OAuth
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:5173/platforms/instagram/callback
INSTAGRAM_SCOPES=instagram_business_basic,instagram_business_manage_comments
```

---

## 🔐 Security Considerations

1. **Token Storage**:
   - Store tokens encrypted in production
   - Use environment variables for secrets
   - Never expose tokens in API responses (except internal use)

2. **State Parameter**:
   - Generate unique state for each OAuth request
   - Verify state in callback to prevent CSRF

3. **JWT Protection**:
   - All endpoints except `/callback` require JWT
   - Callback endpoint validates state instead

4. **Token Expiration**:
   - Store `token_expires_at` in database
   - Implement token refresh logic

---

## 📊 File Changes Summary

### Files to CREATE:

1. `backend/platforms/__init__.py`
2. `backend/platforms/base_platform.py`
3. `backend/platforms/instagram/__init__.py`
4. `backend/platforms/instagram/instagram_model.py`
5. `backend/platforms/instagram/instagram_service.py`
6. `backend/platforms/instagram/instagram_controller.py`
7. `backend/migrate_instagram_oauth.py`
8. `frontend/src/services/platformService.js`
9. `frontend/src/pages/platforms/InstagramCallback.jsx`

### Files to MODIFY:

1. `backend/app.py` - Register Instagram blueprint
2. `backend/.env.example` - Add Instagram env vars
3. `backend/requirements.txt` - Verify dependencies
4. `frontend/src/App.jsx` - Add Instagram callback route
5. `frontend/src/services/api.js` - Add Instagram methods
6. `frontend/src/pages/Onboarding.jsx` - Add OAuth trigger logic

### Files to READ (for reference):

1. `origin/Instagram-feature:backend/models_instagram.py`
2. `origin/Instagram-feature:backend/services/instagram_service.py`
3. `origin/Instagram-feature:backend/routes/instagram.py`
4. `origin/Instagram-feature:frontend/src/pages/InstagramCallback.jsx`

---

## ✅ Testing Checklist

### Backend Tests:

- [ ] Instagram model creates table successfully
- [ ] OAuth URL generation works
- [ ] Token exchange works
- [ ] Profile fetch works
- [ ] Connection save works
- [ ] Connection list works
- [ ] Disconnect works

### Frontend Tests:

- [ ] Onboarding completes without Instagram
- [ ] Onboarding triggers OAuth when Instagram selected
- [ ] OAuth callback handles success
- [ ] OAuth callback handles errors
- [ ] Dashboard shows connected accounts
- [ ] Disconnect works from dashboard

### Integration Tests:

- [ ] Full OAuth flow works end-to-end
- [ ] Tokens stored correctly in database
- [ ] User can reconnect after disconnect
- [ ] Multiple users can connect Instagram
- [ ] Error handling works (denied, expired, etc.)

---

## 🚀 Scalability for Future Platforms

### Adding Twitter (Example):

1. Create `backend/platforms/twitter/`
2. Implement `TwitterService(BasePlatform)`
3. Create `twitter_model.py` (similar to Instagram)
4. Create `twitter_controller.py` (same endpoints)
5. Register blueprint in `app.py`
6. Add Twitter callback page
7. Update onboarding logic

**Same pattern for LinkedIn, Facebook, TikTok, etc.**

---

## 📋 Next Steps

1. **Review this plan** - Confirm approach
2. **Show file diffs** - Compare Instagram-feature files
3. **Create modular structure** - Build base classes
4. **Extract Instagram OAuth** - Minimal implementation
5. **Test integration** - Verify OAuth flow
6. **Document** - Add setup instructions

---

## ⚠️ Important Notes

1. **NO breaking changes** to existing onboarding
2. **NO analytics** in this phase (future feature)
3. **NO UI changes** except callback page
4. **Modular design** for easy platform additions
5. **Security first** - proper token handling
6. **Test thoroughly** before merging

---

## 🎯 Success Criteria

✅ User completes onboarding
✅ If Instagram selected → OAuth triggered
✅ User authorizes on Instagram
✅ Token saved to database
✅ User redirected to dashboard
✅ Connection visible in dashboard
✅ User can disconnect
✅ No breaking changes to existing features
✅ Code is modular and scalable

---

**Ready to proceed with implementation?**
