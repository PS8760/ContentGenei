# 📂 Instagram Feature - Files to Extract

## 🎯 Extraction Strategy

Extract ONLY OAuth-related code from Instagram-feature branch.
Refactor into modular structure for scalability.

---

## 📋 File-by-File Extraction Guide

### 1. InstagramConnection Model

**Source**: `origin/Instagram-feature:backend/models_instagram.py`
**Extract**: Lines 1-60 (InstagramConnection class only)
**Destination**: `backend/platforms/instagram/instagram_model.py`

**What to Extract**:
```python
class InstagramConnection(db.Model):
    __tablename__ = 'instagram_connections'
    
    # Fields to keep:
    - id
    - user_id (FK to users.id)
    - instagram_user_id
    - instagram_username
    - instagram_account_type
    - access_token
    - token_expires_at
    - profile_picture_url
    - followers_count
    - follows_count
    - media_count
    - is_active
    - last_synced_at
    - created_at
    - updated_at
    
    # Methods to keep:
    - to_dict(include_token=False)
```

**What to SKIP**:
- InstagramPost model (lines 61-120)
- InstagramCompetitor model (lines 121-180)

---

### 2. Instagram Service

**Source**: `origin/Instagram-feature:backend/services/instagram_service.py`
**Extract**: Lines 1-150 (OAuth methods only)
**Destination**: `backend/platforms/instagram/instagram_service.py`

**What to Extract**:
```python
class InstagramService:
    # Methods to keep:
    - __init__()
    - get_oauth_url(state: str) -> str
    - exchange_code_for_token(code: str) -> Dict
    - get_long_lived_token(short_lived_token: str) -> Dict
    - get_user_profile(access_token: str) -> Dict
```

**What to SKIP**:
- get_user_insights() - Analytics (not needed yet)
- get_user_media() - Media fetching (not needed yet)
- get_media_insights() - Analytics (not needed yet)
- calculate_engagement_rate() - Analytics (not needed yet)
- detect_underperforming_posts() - Analytics (not needed yet)
- get_public_profile_data() - Competitor tracking (not needed yet)
- analyze_competitor() - Competitor tracking (not needed yet)

---

### 3. Instagram Routes/Controller

**Source**: `origin/Instagram-feature:backend/routes/instagram.py`
**Extract**: Specific endpoints only
**Destination**: `backend/platforms/instagram/instagram_controller.py`

**Endpoints to Extract**:

1. **GET /auth** (lines ~40-60)
   ```python
   @instagram_bp.route('/auth', methods=['GET'])
   @jwt_required()
   def get_auth_url():
       # Generate OAuth URL
   ```

2. **GET /callback** (lines ~62-120)
   ```python
   @instagram_bp.route('/callback', methods=['GET'])
   def oauth_callback_handler():
       # Handle OAuth callback (NO JWT)
   ```

3. **POST /exchange-token** (lines ~122-200)
   ```python
   @instagram_bp.route('/exchange-token', methods=['POST'])
   @jwt_required()
   def exchange_token():
       # Exchange code for token
       # Save InstagramConnection
   ```

4. **GET /connections** (lines ~250-270)
   ```python
   @instagram_bp.route('/connections', methods=['GET'])
   @jwt_required()
   def get_connections():
       # List user's connections
   ```

5. **DELETE /connections/<id>** (lines ~272-295)
   ```python
   @instagram_bp.route('/connections/<connection_id>', methods=['DELETE'])
   @jwt_required()
   def disconnect_account(connection_id):
       # Disconnect Instagram
   ```

**Endpoints to SKIP**:
- /debug - Debug endpoint
- /debug-media - Debug endpoint
- /profile/<id> - Profile fetching
- /sync/<id> - Data sync
- /dashboard/<id> - Analytics dashboard
- /posts/<id>/suggestions - AI suggestions
- /competitors - Competitor tracking
- /competitors/<id> - Competitor management
- /compare/<id> - Competitor comparison

---

### 4. Instagram Callback Page

**Source**: `origin/Instagram-feature:frontend/src/pages/InstagramCallback.jsx`
**Extract**: Entire file (107 lines)
**Destination**: `frontend/src/pages/platforms/InstagramCallback.jsx`

**What to Extract**:
```jsx
// Full component with:
- URL param parsing (code, state, error)
- Loading state
- Success state
- Error handling
- Redirect to dashboard
```

**Modifications Needed**:
- Update API endpoint paths to match new structure
- Update redirect URL to `/dashboard`
- Add better error messages

---

### 5. API Service Methods

**Source**: `origin/Instagram-feature:frontend/src/services/api.js`
**Extract**: Instagram-related methods only
**Destination**: `frontend/src/services/api.js` (append)

**Methods to Extract**:
```javascript
// Instagram OAuth
getInstagramAuthUrl: () => api.get('/api/platforms/instagram/auth'),
exchangeInstagramToken: (code, state) => api.post('/api/platforms/instagram/exchange-token', { code, state }),
getInstagramConnections: () => api.get('/api/platforms/instagram/connections'),
disconnectInstagram: (connectionId) => api.delete(`/api/platforms/instagram/connections/${connectionId}`)
```

**Methods to SKIP**:
- syncInstagramData() - Sync endpoint
- getInstagramDashboard() - Analytics
- getInstagramProfile() - Profile fetching
- generatePostSuggestions() - AI suggestions
- getCompetitors() - Competitor tracking
- addCompetitor() - Competitor tracking
- removeCompetitor() - Competitor tracking
- compareWithCompetitors() - Competitor comparison

---

### 6. Environment Variables

**Source**: `origin/Instagram-feature:backend/.env.example`
**Extract**: Instagram-related vars only
**Destination**: `backend/.env.example` (append)

**Variables to Extract**:
```bash
# Instagram OAuth Configuration
INSTAGRAM_APP_ID=your_instagram_app_id_here
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:5173/platforms/instagram/callback
INSTAGRAM_SCOPES=instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages
INSTAGRAM_FRONTEND_URL=http://localhost:5173
```

---

### 7. Dependencies

**Source**: `origin/Instagram-feature:backend/requirements.txt`
**Check**: Instagram-related dependencies
**Destination**: `backend/requirements.txt` (verify/add if missing)

**Dependencies to Verify**:
```
requests>=2.31.0  # For API calls
python-dotenv>=1.0.0  # For env vars
```

---

## 📊 Extraction Summary

### Total Files to Create: 9

1. `backend/platforms/__init__.py` - NEW
2. `backend/platforms/base_platform.py` - NEW
3. `backend/platforms/instagram/__init__.py` - NEW
4. `backend/platforms/instagram/instagram_model.py` - EXTRACTED
5. `backend/platforms/instagram/instagram_service.py` - EXTRACTED
6. `backend/platforms/instagram/instagram_controller.py` - EXTRACTED
7. `backend/migrate_instagram_oauth.py` - NEW
8. `frontend/src/services/platformService.js` - NEW
9. `frontend/src/pages/platforms/InstagramCallback.jsx` - EXTRACTED

### Total Files to Modify: 6

1. `backend/app.py` - Register blueprint
2. `backend/.env.example` - Add env vars
3. `backend/requirements.txt` - Verify dependencies
4. `frontend/src/App.jsx` - Add route
5. `frontend/src/services/api.js` - Add methods
6. `frontend/src/pages/Onboarding.jsx` - Add OAuth trigger

---

## 🔍 Line-by-Line Extraction Details

### InstagramConnection Model (60 lines)

```python
# FROM: origin/Instagram-feature:backend/models_instagram.py
# LINES: 1-60
# TO: backend/platforms/instagram/instagram_model.py

from models import db
from datetime import datetime, timezone
import uuid

class InstagramConnection(db.Model):
    __tablename__ = 'instagram_connections'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Instagram account details
    instagram_user_id = db.Column(db.String(255), nullable=False)
    instagram_username = db.Column(db.String(255), nullable=False)
    instagram_account_type = db.Column(db.String(50), nullable=True)
    
    # OAuth tokens
    access_token = db.Column(db.Text, nullable=False)
    token_expires_at = db.Column(db.DateTime, nullable=True)
    
    # Profile information
    profile_picture_url = db.Column(db.String(500), nullable=True)
    followers_count = db.Column(db.Integer, default=0)
    follows_count = db.Column(db.Integer, default=0)
    media_count = db.Column(db.Integer, default=0)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    last_synced_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'instagram_user_id', name='unique_instagram_connection'),
    )
    
    def to_dict(self, include_token=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'instagram_user_id': self.instagram_user_id,
            'instagram_username': self.instagram_username,
            'instagram_account_type': self.instagram_account_type,
            'profile_picture_url': self.profile_picture_url,
            'followers_count': self.followers_count,
            'follows_count': self.follows_count,
            'media_count': self.media_count,
            'is_active': self.is_active,
            'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'token_expires_at': self.token_expires_at.isoformat() if self.token_expires_at else None
        }
        
        if include_token:
            data['access_token'] = self.access_token
        
        return data
```

---

### Instagram Service (150 lines)

```python
# FROM: origin/Instagram-feature:backend/services/instagram_service.py
# LINES: 1-150 (OAuth methods only)
# TO: backend/platforms/instagram/instagram_service.py

import requests
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from flask import current_app
import os

class InstagramService:
    """Service for Instagram OAuth and basic API operations"""
    
    def __init__(self):
        self.graph_api_base = "https://graph.instagram.com"
        self.graph_api_v2_base = "https://graph.facebook.com/v21.0"
    
    def get_oauth_url(self, state: str) -> str:
        """Generate Instagram OAuth URL"""
        app_id = os.environ.get('INSTAGRAM_APP_ID')
        redirect_uri = os.environ.get('INSTAGRAM_REDIRECT_URI')
        scopes = os.environ.get('INSTAGRAM_SCOPES', 'instagram_business_basic')
        
        if not app_id or not redirect_uri:
            raise ValueError("Instagram OAuth not configured")
        
        params = {
            'client_id': app_id,
            'redirect_uri': redirect_uri,
            'scope': scopes,
            'response_type': 'code',
            'state': state
        }
        
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return f"https://api.instagram.com/oauth/authorize?{query_string}"
    
    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        app_id = os.environ.get('INSTAGRAM_APP_ID')
        app_secret = os.environ.get('INSTAGRAM_APP_SECRET')
        redirect_uri = os.environ.get('INSTAGRAM_REDIRECT_URI')
        
        url = "https://api.instagram.com/oauth/access_token"
        data = {
            'client_id': app_id,
            'client_secret': app_secret,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri,
            'code': code
        }
        
        response = requests.post(url, data=data)
        response.raise_for_status()
        return response.json()
    
    def get_long_lived_token(self, short_lived_token: str) -> Dict[str, Any]:
        """Exchange short-lived token for long-lived token (60 days)"""
        app_secret = os.environ.get('INSTAGRAM_APP_SECRET')
        
        url = f"{self.graph_api_base}/access_token"
        params = {
            'grant_type': 'ig_exchange_token',
            'client_secret': app_secret,
            'access_token': short_lived_token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        """Get Instagram user profile information"""
        url = f"{self.graph_api_base}/me"
        params = {
            'fields': 'id,username,account_type,media_count,followers_count',
            'access_token': access_token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
```

---

## ✅ Verification Checklist

Before extraction:
- [ ] Confirmed Instagram-feature branch is fetched
- [ ] Reviewed all files to extract
- [ ] Identified lines to extract vs skip
- [ ] Planned modular structure
- [ ] Confirmed no breaking changes

After extraction:
- [ ] All extracted files created
- [ ] All modifications applied
- [ ] No syntax errors
- [ ] Database migration ready
- [ ] Environment variables documented
- [ ] Routes registered correctly
- [ ] Frontend routes added
- [ ] API methods added

---

**Ready to start extraction?**
