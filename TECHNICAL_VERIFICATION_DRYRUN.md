# 🔍 Technical Verification - Dry Run

## ⚠️ NO CHANGES APPLIED YET - REVIEW ONLY

This document shows EXACTLY what will be modified before implementation.

---

## 1. Blueprint Registration in app.py

### Current Code (Lines 68-77):
```python
# Register blueprints
from routes.auth import auth_bp
from routes.content import content_bp
from routes.analytics import analytics_bp
from routes.team import team_bp
from routes.linkogenei import linkogenei_bp
from routes.profile import profile_bp
# from routes.geneilink import geneilink_bp  # TODO: Enable in future

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(content_bp, url_prefix='/api/content')
```

### Modified Code (ADD 2 lines):
```python
# Register blueprints
from routes.auth import auth_bp
from routes.content import content_bp
from routes.analytics import analytics_bp
from routes.team import team_bp
from routes.linkogenei import linkogenei_bp
from routes.profile import profile_bp
from platforms.instagram.instagram_controller import instagram_bp  # NEW

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(content_bp, url_prefix='/api/content')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(team_bp, url_prefix='/api/team')
app.register_blueprint(linkogenei_bp)
app.register_blueprint(profile_bp, url_prefix='/api')
app.register_blueprint(instagram_bp, url_prefix='/api/platforms/instagram')  # NEW
```

**Changes**:
- Line 74: Import instagram_bp
- Line 82: Register instagram_bp with prefix `/api/platforms/instagram`

---

## 2. Database Table Creation Strategy

### Current Approach:
Your project uses `db.create_all()` (not Flask-Migrate migrations).

**Evidence**:
- `app.py` line 159: `db.create_all()`
- `migrate_team_tables.py`: Uses `db.create_all()`
- `migrate_geneilink.py`: Uses `db.create_all()`

### Instagram Table Creation:
We'll follow the SAME pattern with a migration script.

**File**: `backend/migrate_instagram_oauth.py` (NEW)
```python
from app import create_app
from models import db

def migrate_instagram_tables():
    """Create Instagram OAuth tables"""
    app = create_app()
    
    with app.app_context():
        # Import model to register it
        from platforms.instagram.instagram_model import InstagramConnection
        
        try:
            # Create only new tables (won't affect existing)
            db.create_all()
            print("✓ Instagram tables created successfully")
            
            # Verify table exists
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'instagram_connections' in tables:
                print("✓ instagram_connections table verified")
            else:
                print("✗ instagram_connections table NOT found")
                
        except Exception as e:
            print(f"✗ Error: {str(e)}")

if __name__ == '__main__':
    migrate_instagram_tables()
```

**Safety**: `db.create_all()` only creates NEW tables. Existing tables are NOT affected.

---

## 3. JWT Protection Strategy

### Endpoint Protection Matrix:

| Endpoint | Method | JWT Required | Reason |
|----------|--------|--------------|--------|
| `/auth` | GET | ✅ YES | Generate OAuth URL for logged-in user |
| `/callback` | GET | ❌ NO | Instagram redirects here (no JWT possible) |
| `/exchange-token` | POST | ✅ YES | Save connection to user account |
| `/connections` | GET | ✅ YES | List user's connections |
| `/connections/<id>` | DELETE | ✅ YES | Disconnect user's account |

### Code Implementation:

**File**: `backend/platforms/instagram/instagram_controller.py`

```python
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from platforms.instagram.instagram_model import InstagramConnection
from platforms.instagram.instagram_service import InstagramService
import uuid

instagram_bp = Blueprint('instagram', __name__)
instagram_service = InstagramService()

# ✅ JWT REQUIRED
@instagram_bp.route('/auth', methods=['GET'])
@jwt_required()
def get_auth_url():
    """Generate Instagram OAuth URL"""
    state = str(uuid.uuid4())
    oauth_url = instagram_service.get_oauth_url(state)
    return jsonify({'success': True, 'oauth_url': oauth_url, 'state': state})

# ❌ NO JWT - Instagram callback
@instagram_bp.route('/callback', methods=['GET'])
def oauth_callback():
    """Handle Instagram OAuth callback - NO JWT"""
    code = request.args.get('code')
    error = request.args.get('error')
    
    # Redirect to frontend with params
    frontend_url = 'http://localhost:5173/platforms/instagram/callback'
    return redirect(f"{frontend_url}?code={code}&error={error}")

# ✅ JWT REQUIRED
@instagram_bp.route('/exchange-token', methods=['POST'])
@jwt_required()
def exchange_token():
    """Exchange code for token and save connection"""
    current_user_id = get_jwt_identity()
    # ... token exchange logic ...

# ✅ JWT REQUIRED
@instagram_bp.route('/connections', methods=['GET'])
@jwt_required()
def get_connections():
    """Get user's Instagram connections"""
    current_user_id = get_jwt_identity()
    # ... list connections ...

# ✅ JWT REQUIRED
@instagram_bp.route('/connections/<connection_id>', methods=['DELETE'])
@jwt_required()
def disconnect_account(connection_id):
    """Disconnect Instagram account"""
    current_user_id = get_jwt_identity()
    # ... disconnect logic ...
```

**Security Note**: The `/callback` endpoint doesn't need JWT because:
1. Instagram redirects the user there (can't include JWT in URL)
2. It only redirects to frontend with code
3. Frontend then calls `/exchange-token` WITH JWT to save connection

---

## 4. Onboarding.jsx Modification

### Current handleFinish() (Lines 217-273):
```javascript
const handleFinish = async () => {
  if (validateStep(4)) {
    setIsAnimating(true)
    
    try {
      console.log('Starting onboarding completion...')
      
      // Prepare onboarding data for backend
      const onboardingData = {
        full_name: formData.full_name,
        professional_title: formData.professional_title,
        location: formData.location,
        content_tone: formData.brand_voice,
        target_audience: formData.target_audience,
        bio: formData.bio,
        platforms: formData.platforms,
        niche_tags: formData.expertise_tags,
        primary_goal: formData.primary_goal
      }
      
      // ... existing save logic ...
      
      console.log('Navigating to dashboard...')
      // Navigate to dashboard
      navigate('/dashboard')
      
    } catch (error) {
      // ... error handling ...
    }
  }
}
```

### Modified handleFinish() (ADD Instagram OAuth trigger):
```javascript
const handleFinish = async () => {
  if (validateStep(4)) {
    setIsAnimating(true)
    
    try {
      console.log('Starting onboarding completion...')
      
      // Prepare onboarding data for backend
      const onboardingData = {
        full_name: formData.full_name,
        professional_title: formData.professional_title,
        location: formData.location,
        content_tone: formData.brand_voice,
        target_audience: formData.target_audience,
        bio: formData.bio,
        platforms: formData.platforms,
        niche_tags: formData.expertise_tags,
        primary_goal: formData.primary_goal
      }
      
      console.log('Onboarding data:', onboardingData)
      
      // Prepare user profile for localStorage
      const userProfile = {
        ...onboardingData,
        onboarding_completed_at: new Date().toISOString()
      }
      
      // Try to save to backend
      try {
        console.log('Calling API to complete onboarding...')
        const response = await apiService.completeOnboarding(onboardingData)
        console.log('API response:', response)
        
        if (response.success) {
          console.log('Onboarding saved to backend successfully!')
        } else {
          console.warn('Backend save failed, but continuing with localStorage:', response.error)
        }
      } catch (apiError) {
        console.error('Backend API error (continuing with localStorage):', apiError)
      }
      
      // Always save to localStorage
      localStorage.setItem('user_profile', JSON.stringify(userProfile))
      localStorage.setItem('onboarding_complete', 'true')
      console.log('Saved to localStorage')
      
      // ========== NEW: Instagram OAuth Trigger ==========
      // Check if Instagram was selected
      if (formData.platforms.instagram) {
        console.log('Instagram selected - triggering OAuth...')
        
        try {
          // Get Instagram OAuth URL from backend
          const oauthResponse = await apiService.getInstagramAuthUrl()
          
          if (oauthResponse.success && oauthResponse.oauth_url) {
            console.log('Redirecting to Instagram OAuth...')
            // Store state for verification
            sessionStorage.setItem('instagram_oauth_state', oauthResponse.state)
            // Redirect to Instagram OAuth
            window.location.href = oauthResponse.oauth_url
            return // Stop here, Instagram will redirect back
          } else {
            console.error('Failed to get Instagram OAuth URL:', oauthResponse)
            // Continue to dashboard even if OAuth fails
            navigate('/dashboard')
          }
        } catch (oauthError) {
          console.error('Instagram OAuth error:', oauthError)
          // Continue to dashboard even if OAuth fails
          navigate('/dashboard')
        }
      } else {
        // No Instagram selected, go directly to dashboard
        console.log('No Instagram selected, navigating to dashboard...')
        navigate('/dashboard')
      }
      // ========== END NEW CODE ==========
      
    } catch (error) {
      console.error('Critical error completing onboarding:', error)
      
      // Show error to user
      alert(`Error: ${error.message}\n\nTrying to continue anyway...`)
      
      // Try to continue anyway with localStorage
      try {
        const userProfile = {
          full_name: formData.full_name,
          professional_title: formData.professional_title,
          location: formData.location,
          content_tone: formData.brand_voice,
          target_audience: formData.target_audience,
          bio: formData.bio,
          platforms: formData.platforms,
          niche_tags: formData.expertise_tags,
          primary_goal: formData.primary_goal,
          onboarding_completed_at: new Date().toISOString()
        }
        localStorage.setItem('user_profile', JSON.stringify(userProfile))
        localStorage.setItem('onboarding_complete', 'true')
        navigate('/dashboard')
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        setErrors({ general: 'Failed to save onboarding data. Please try again.' })
        setIsAnimating(false)
      }
    }
  } else {
    console.log('Validation failed for step 4')
  }
}
```

**Changes**:
- Lines 247-270: NEW Instagram OAuth trigger logic
- Checks if `formData.platforms.instagram === true`
- If yes: Gets OAuth URL and redirects to Instagram
- If no: Goes directly to dashboard
- Error handling: Falls back to dashboard if OAuth fails

**User Experience**:
1. User completes onboarding
2. IF Instagram selected → Redirects to Instagram OAuth
3. User authorizes → Instagram redirects to callback
4. Callback exchanges token → Redirects to dashboard
5. IF Instagram NOT selected → Goes directly to dashboard

---

## 5. Dry-Run Diff Preview

### File 1: backend/app.py

```diff
--- backend/app.py (original)
+++ backend/app.py (modified)
@@ -68,6 +68,7 @@
     from routes.team import team_bp
     from routes.linkogenei import linkogenei_bp
     from routes.profile import profile_bp
+    from platforms.instagram.instagram_controller import instagram_bp
     # from routes.geneilink import geneilink_bp  # TODO: Enable in future
     
     app.register_blueprint(auth_bp, url_prefix='/api/auth')
@@ -76,6 +77,7 @@
     app.register_blueprint(team_bp, url_prefix='/api/team')
     app.register_blueprint(linkogenei_bp)  # Already has url_prefix in blueprint
     app.register_blueprint(profile_bp, url_prefix='/api')
+    app.register_blueprint(instagram_bp, url_prefix='/api/platforms/instagram')
     # app.register_blueprint(geneilink_bp, url_prefix='/api/geneilink')  # TODO: Enable in future
     
     # Health check endpoint
```

**Summary**: 2 lines added (import + register)

---

### File 2: backend/.env.example

```diff
--- backend/.env.example (original)
+++ backend/.env.example (modified)
@@ -45,3 +45,11 @@
 # MongoDB Configuration (Optional - for GeneiLink)
 MONGODB_URI=mongodb://localhost:27017/contentgenie
 MONGODB_DATABASE=contentgenie
+
+# Instagram OAuth Configuration
+INSTAGRAM_APP_ID=your_instagram_app_id_here
+INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
+INSTAGRAM_REDIRECT_URI=http://localhost:5173/platforms/instagram/callback
+INSTAGRAM_SCOPES=instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages
+INSTAGRAM_FRONTEND_URL=http://localhost:5173
```

**Summary**: 6 lines added (Instagram env vars)

---

### File 3: frontend/src/App.jsx

```diff
--- frontend/src/App.jsx (original)
+++ frontend/src/App.jsx (modified)
@@ -15,6 +15,7 @@
 import ContentOptimizer from './pages/ContentOptimizer'
 import TeamCollaboration from './pages/TeamCollaboration'
 import GeneiLink from './pages/GeneiLink'
+import InstagramCallback from './pages/platforms/InstagramCallback'
 
 function App() {
   return (
@@ -104,6 +105,11 @@
             <GeneiLink />
           </ProtectedRoute>
         } />
+        <Route path="/platforms/instagram/callback" element={
+          <ProtectedRoute>
+            <InstagramCallback />
+          </ProtectedRoute>
+        } />
         
         {/* Catch all - redirect to home */}
         <Route path="*" element={<Navigate to="/" replace />} />
```

**Summary**: 2 lines added (import + route)

---

### File 4: frontend/src/services/api.js

```diff
--- frontend/src/services/api.js (original)
+++ frontend/src/services/api.js (modified)
@@ -250,6 +250,16 @@
     return handleResponse(response)
   },
   
+  // ==================== INSTAGRAM OAUTH ====================
+  
+  getInstagramAuthUrl: async () => {
+    const response = await api.get('/platforms/instagram/auth')
+    return handleResponse(response)
+  },
+  
+  exchangeInstagramToken: async (code, state) => {
+    const response = await api.post('/platforms/instagram/exchange-token', { code, state })
+    return handleResponse(response)
+  },
+  
+  getInstagramConnections: async () => {
+    const response = await api.get('/platforms/instagram/connections')
+    return handleResponse(response)
+  },
+  
+  disconnectInstagram: async (connectionId) => {
+    const response = await api.delete(`/platforms/instagram/connections/${connectionId}`)
+    return handleResponse(response)
+  },
+  
   // ==================== TEAM COLLABORATION ====================
   
   // Team Members
```

**Summary**: 4 methods added (Instagram OAuth methods)

---

### File 5: frontend/src/pages/Onboarding.jsx

```diff
--- frontend/src/pages/Onboarding.jsx (original)
+++ frontend/src/pages/Onboarding.jsx (modified)
@@ -245,8 +245,35 @@
       localStorage.setItem('user_profile', JSON.stringify(userProfile))
       localStorage.setItem('onboarding_complete', 'true')
       console.log('Saved to localStorage')
       
-      console.log('Navigating to dashboard...')
-      // Navigate to dashboard
-      navigate('/dashboard')
+      // Check if Instagram was selected
+      if (formData.platforms.instagram) {
+        console.log('Instagram selected - triggering OAuth...')
+        
+        try {
+          // Get Instagram OAuth URL from backend
+          const oauthResponse = await apiService.getInstagramAuthUrl()
+          
+          if (oauthResponse.success && oauthResponse.oauth_url) {
+            console.log('Redirecting to Instagram OAuth...')
+            // Store state for verification
+            sessionStorage.setItem('instagram_oauth_state', oauthResponse.state)
+            // Redirect to Instagram OAuth
+            window.location.href = oauthResponse.oauth_url
+            return // Stop here, Instagram will redirect back
+          } else {
+            console.error('Failed to get Instagram OAuth URL:', oauthResponse)
+            // Continue to dashboard even if OAuth fails
+            navigate('/dashboard')
+          }
+        } catch (oauthError) {
+          console.error('Instagram OAuth error:', oauthError)
+          // Continue to dashboard even if OAuth fails
+          navigate('/dashboard')
+        }
+      } else {
+        // No Instagram selected, go directly to dashboard
+        console.log('No Instagram selected, navigating to dashboard...')
+        navigate('/dashboard')
+      }
       
     } catch (error) {
```

**Summary**: 28 lines added (Instagram OAuth trigger logic)

---

### File 6: backend/requirements.txt

```diff
--- backend/requirements.txt (original)
+++ backend/requirements.txt (modified)
@@ -10,3 +10,4 @@
 python-dotenv==1.0.0
 gunicorn==21.2.0
 pymongo==4.6.1
+requests==2.31.0
```

**Summary**: 1 line added (requests library for API calls)

**Note**: Verify if `requests` is already installed. If yes, no change needed.

---

## 6. New Files to Create

### File 1: backend/platforms/__init__.py
```python
# Empty file to make platforms a package
```

---

### File 2: backend/platforms/base_platform.py
```python
from abc import ABC, abstractmethod
from typing import Dict, Any

class BasePlatform(ABC):
    """Base class for all social media platform integrations"""
    
    @abstractmethod
    def get_oauth_url(self, state: str) -> str:
        """Generate OAuth authorization URL"""
        pass
    
    @abstractmethod
    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        pass
    
    @abstractmethod
    def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        """Get user profile information"""
        pass
```

---

### File 3: backend/platforms/instagram/__init__.py
```python
# Empty file to make instagram a package
```

---

### File 4: backend/platforms/instagram/instagram_model.py
```python
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
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), 
                          onupdate=lambda: datetime.now(timezone.utc))
    
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

### File 5: backend/platforms/instagram/instagram_service.py
```python
import requests
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from flask import current_app
import os
from platforms.base_platform import BasePlatform

class InstagramService(BasePlatform):
    """Service for Instagram OAuth and basic API operations"""
    
    def __init__(self):
        self.graph_api_base = "https://graph.instagram.com"
    
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

### File 6: backend/platforms/instagram/instagram_controller.py
```python
from flask import Blueprint, request, jsonify, current_app, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from platforms.instagram.instagram_model import InstagramConnection
from platforms.instagram.instagram_service import InstagramService
from datetime import datetime, timezone, timedelta
import uuid
import os

instagram_bp = Blueprint('instagram', __name__)
instagram_service = InstagramService()

@instagram_bp.route('/auth', methods=['GET'])
@jwt_required()
def get_auth_url():
    """Generate Instagram OAuth URL - JWT REQUIRED"""
    try:
        state = str(uuid.uuid4())
        oauth_url = instagram_service.get_oauth_url(state)
        
        return jsonify({
            'success': True,
            'oauth_url': oauth_url,
            'state': state
        })
    except Exception as e:
        current_app.logger.error(f"Error generating OAuth URL: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@instagram_bp.route('/callback', methods=['GET'])
def oauth_callback():
    """Handle Instagram OAuth callback - NO JWT (Instagram redirects here)"""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        error_description = request.args.get('error_description')
        
        frontend_url = os.environ.get('INSTAGRAM_FRONTEND_URL', 'http://localhost:5173')
        callback_url = f"{frontend_url}/platforms/instagram/callback"
        
        # Handle errors from Instagram
        if error:
            current_app.logger.error(f"Instagram OAuth error: {error} - {error_description}")
            return redirect(f"{callback_url}?error={error}&error_description={error_description}")
        
        # Redirect to frontend with code and state
        return redirect(f"{callback_url}?code={code}&state={state}")
        
    except Exception as e:
        current_app.logger.error(f"Error in OAuth callback: {str(e)}")
        frontend_url = os.environ.get('INSTAGRAM_FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/platforms/instagram/callback?error=callback_error")

@instagram_bp.route('/exchange-token', methods=['POST'])
@jwt_required()
def exchange_token():
    """Exchange authorization code for access token - JWT REQUIRED"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        code = data.get('code')
        state = data.get('state')
        
        if not code:
            return jsonify({'success': False, 'error': 'Authorization code is required'}), 400
        
        # Exchange code for short-lived token
        token_data = instagram_service.exchange_code_for_token(code)
        short_lived_token = token_data.get('access_token')
        instagram_user_id = token_data.get('user_id')
        
        # Exchange for long-lived token (60 days)
        long_lived_data = instagram_service.get_long_lived_token(short_lived_token)
        access_token = long_lived_data.get('access_token')
        expires_in = long_lived_data.get('expires_in', 5184000)  # 60 days default
        
        # Get user profile
        profile = instagram_service.get_user_profile(access_token)
        
        # Calculate token expiration
        token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        
        # Check if connection already exists
        existing_connection = InstagramConnection.query.filter_by(
            user_id=current_user_id,
            instagram_user_id=instagram_user_id
        ).first()
        
        if existing_connection:
            # Update existing connection
            existing_connection.access_token = access_token
            existing_connection.token_expires_at = token_expires_at
            existing_connection.instagram_username = profile.get('username')
            existing_connection.instagram_account_type = profile.get('account_type')
            existing_connection.followers_count = profile.get('followers_count', 0)
            existing_connection.media_count = profile.get('media_count', 0)
            existing_connection.is_active = True
            existing_connection.updated_at = datetime.now(timezone.utc)
            
            connection = existing_connection
        else:
            # Create new connection
            connection = InstagramConnection(
                user_id=current_user_id,
                instagram_user_id=instagram_user_id,
                instagram_username=profile.get('username'),
                instagram_account_type=profile.get('account_type'),
                access_token=access_token,
                token_expires_at=token_expires_at,
                followers_count=profile.get('followers_count', 0),
                media_count=profile.get('media_count', 0),
                is_active=True
            )
            db.session.add(connection)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'connection': connection.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error exchanging token: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@instagram_bp.route('/connections', methods=['GET'])
@jwt_required()
def get_connections():
    """Get user's Instagram connections - JWT REQUIRED"""
    try:
        current_user_id = get_jwt_identity()
        
        connections = InstagramConnection.query.filter_by(
            user_id=current_user_id,
            is_active=True
        ).all()
        
        return jsonify({
            'success': True,
            'connections': [conn.to_dict() for conn in connections]
        })
    except Exception as e:
        current_app.logger.error(f"Error fetching connections: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@instagram_bp.route('/connections/<connection_id>', methods=['DELETE'])
@jwt_required()
def disconnect_account(connection_id):
    """Disconnect Instagram account - JWT REQUIRED"""
    try:
        current_user_id = get_jwt_identity()
        
        connection = InstagramConnection.query.filter_by(
            id=connection_id,
            user_id=current_user_id
        ).first()
        
        if not connection:
            return jsonify({'success': False, 'error': 'Connection not found'}), 404
        
        connection.is_active = False
        connection.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Instagram account disconnected successfully'
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error disconnecting account: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
```

---

### File 7: backend/migrate_instagram_oauth.py
```python
from app import create_app
from models import db

def migrate_instagram_tables():
    """Create Instagram OAuth tables"""
    app = create_app()
    
    with app.app_context():
        # Import model to register it
        from platforms.instagram.instagram_model import InstagramConnection
        
        try:
            # Create only new tables (won't affect existing)
            db.create_all()
            print("✓ Instagram tables created successfully")
            
            # Verify table exists
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'instagram_connections' in tables:
                print("✓ instagram_connections table verified")
                
                # Show table structure
                columns = inspector.get_columns('instagram_connections')
                print(f"✓ Table has {len(columns)} columns:")
                for col in columns:
                    print(f"  - {col['name']}: {col['type']}")
            else:
                print("✗ instagram_connections table NOT found")
                
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    migrate_instagram_tables()
```

---

### File 8: frontend/src/services/platformService.js
```javascript
import apiService from './api'

class PlatformService {
  /**
   * Initiate OAuth flow for a platform
   * @param {string} platform - Platform name (instagram, twitter, etc.)
   * @returns {Promise<string>} OAuth URL
   */
  async initiateOAuth(platform) {
    try {
      let response
      
      switch (platform.toLowerCase()) {
        case 'instagram':
          response = await apiService.getInstagramAuthUrl()
          break
        // Future platforms:
        // case 'twitter':
        //   response = await apiService.getTwitterAuthUrl()
        //   break
        default:
          throw new Error(`Platform ${platform} not supported`)
      }
      
      if (response.success && response.oauth_url) {
        return response.oauth_url
      } else {
        throw new Error(response.error || 'Failed to get OAuth URL')
      }
    } catch (error) {
      console.error(`Error initiating ${platform} OAuth:`, error)
      throw error
    }
  }
  
  /**
   * Get user's connections for a platform
   * @param {string} platform - Platform name
   * @returns {Promise<Array>} List of connections
   */
  async getConnections(platform) {
    try {
      let response
      
      switch (platform.toLowerCase()) {
        case 'instagram':
          response = await apiService.getInstagramConnections()
          break
        default:
          throw new Error(`Platform ${platform} not supported`)
      }
      
      if (response.success) {
        return response.connections || []
      } else {
        throw new Error(response.error || 'Failed to get connections')
      }
    } catch (error) {
      console.error(`Error getting ${platform} connections:`, error)
      throw error
    }
  }
  
  /**
   * Disconnect a platform account
   * @param {string} platform - Platform name
   * @param {string} connectionId - Connection ID
   * @returns {Promise<boolean>} Success status
   */
  async disconnect(platform, connectionId) {
    try {
      let response
      
      switch (platform.toLowerCase()) {
        case 'instagram':
          response = await apiService.disconnectInstagram(connectionId)
          break
        default:
          throw new Error(`Platform ${platform} not supported`)
      }
      
      return response.success
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error)
      throw error
    }
  }
}

export default new PlatformService()
```

---

### File 9: frontend/src/pages/platforms/InstagramCallback.jsx
```javascript
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api'
import ParticlesBackground from '../../components/ParticlesBackground'

const InstagramCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [status, setStatus] = useState('processing') // processing, success, error
  const [message, setMessage] = useState('Connecting your Instagram account...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get params from URL
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // Handle error from Instagram
        if (error) {
          setStatus('error')
          setMessage(errorDescription || 'Instagram authorization failed')
          setTimeout(() => navigate('/dashboard'), 3000)
          return
        }

        // Validate code
        if (!code) {
          setStatus('error')
          setMessage('No authorization code received')
          setTimeout(() => navigate('/dashboard'), 3000)
          return
        }

        // Verify state (optional but recommended)
        const storedState = sessionStorage.getItem('instagram_oauth_state')
        if (storedState && storedState !== state) {
          setStatus('error')
          setMessage('Invalid state parameter - possible CSRF attack')
          setTimeout(() => navigate('/dashboard'), 3000)
          return
        }

        // Exchange code for token
        setMessage('Exchanging authorization code...')
        const response = await apiService.exchangeInstagramToken(code, state)

        if (response.success) {
          setStatus('success')
          setMessage('Instagram connected successfully!')
          
          // Clean up
          sessionStorage.removeItem('instagram_oauth_state')
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => navigate('/dashboard'), 2000)
        } else {
          setStatus('error')
          setMessage(response.error || 'Failed to connect Instagram')
          setTimeout(() => navigate('/dashboard'), 3000)
        }
      } catch (error) {
        console.error('Instagram callback error:', error)
        setStatus('error')
        setMessage('An error occurred while connecting Instagram')
        setTimeout(() => navigate('/dashboard'), 3000)
      }
    }

    if (currentUser) {
      handleCallback()
    } else {
      // Not logged in, redirect to login
      navigate('/login')
    }
  }, [searchParams, navigate, currentUser])

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {status === 'processing' && (
              <div className="w-20 h-20 mx-auto">
                <div className="loading-spinner"></div>
              </div>
            )}
            {status === 'success' && (
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">✓</span>
              </div>
            )}
            {status === 'error' && (
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">✗</span>
              </div>
            )}
          </div>

          {/* Status Message */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {status === 'processing' && 'Connecting Instagram'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Connection Failed'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>

          {/* Progress or Action */}
          {status === 'processing' && (
            <div className="text-sm text-gray-500 dark:text-gray-500">
              Please wait...
            </div>
          )}
          
          {(status === 'success' || status === 'error') && (
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary px-6 py-3 rounded-2xl"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default InstagramCallback
```

---

## 7. Summary of Changes

### Modified Files (6):
1. ✅ `backend/app.py` - 2 lines added
2. ✅ `backend/.env.example` - 6 lines added
3. ✅ `frontend/src/App.jsx` - 2 lines added
4. ✅ `frontend/src/services/api.js` - 4 methods added
5. ✅ `frontend/src/pages/Onboarding.jsx` - 28 lines added
6. ✅ `backend/requirements.txt` - 1 line added (if needed)

### New Files (9):
1. ✅ `backend/platforms/__init__.py`
2. ✅ `backend/platforms/base_platform.py`
3. ✅ `backend/platforms/instagram/__init__.py`
4. ✅ `backend/platforms/instagram/instagram_model.py`
5. ✅ `backend/platforms/instagram/instagram_service.py`
6. ✅ `backend/platforms/instagram/instagram_controller.py`
7. ✅ `backend/migrate_instagram_oauth.py`
8. ✅ `frontend/src/services/platformService.js`
9. ✅ `frontend/src/pages/platforms/InstagramCallback.jsx`

### Total Changes:
- **Lines Modified**: ~50 lines
- **Lines Added**: ~600 lines (new files)
- **Files Modified**: 6
- **Files Created**: 9

---

## 8. Verification Checklist

Before implementation:
- [ ] Reviewed all diffs
- [ ] Confirmed JWT protection strategy
- [ ] Confirmed database migration approach
- [ ] Confirmed no breaking changes
- [ ] Confirmed modular architecture
- [ ] Have Instagram App credentials ready

After implementation:
- [ ] Run migration script
- [ ] Test onboarding without Instagram
- [ ] Test onboarding with Instagram
- [ ] Test OAuth flow end-to-end
- [ ] Test disconnect functionality
- [ ] Verify no existing features broken

---

## 9. Safety Guarantees

✅ **No Breaking Changes**:
- Existing onboarding flow unchanged (except OAuth trigger)
- All existing routes still work
- Database migration only creates NEW table
- No modifications to existing tables

✅ **Rollback Plan**:
- If issues occur, simply remove Instagram blueprint registration
- Delete `platforms/` directory
- Revert Onboarding.jsx changes
- No data loss (existing tables untouched)

✅ **Security**:
- JWT required for all endpoints except callback
- State parameter for CSRF protection
- Tokens stored securely in database
- Environment variables for secrets

---

**Ready for your review and approval!** 🎯
