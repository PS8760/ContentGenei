# Instagram & LinkedIn Integration - Complete File List

## 📱 Instagram Integration Files

### Backend Files

#### Core Instagram Files
```
backend/platforms/instagram/
├── __init__.py                      # Package initialization
├── instagram_controller.py          # API endpoints (OAuth, sync, dashboard, ML)
├── instagram_model.py               # Database models (InstagramConnection, InstagramPost, etc.)
└── instagram_service.py             # Instagram Graph API service
```

#### ML & AI Services
```
backend/services/
├── instagram_ml_service.py          # ML features (Pattern Recognition, Predictions)
├── instagram_ai_service.py          # AI content generation for Instagram
└── content_analyzer.py              # Smart Content Assistant (NEW - not yet integrated)
```

#### Database & Configuration
```
backend/
├── models.py                        # Main database models (includes Instagram models)
├── app.py                           # Flask app initialization (registers Instagram blueprint)
├── config.py                        # Configuration settings
└── .env                             # Environment variables (Instagram credentials)
```

#### Utility Scripts
```
backend/
├── add_test_engagement.py           # Add test engagement data
├── add_varied_post_times.py         # Add varied posting times for testing
├── check_post_engagement.py         # Check post engagement data
├── clear_test_data.py               # Clear test data
├── fix_zero_engagement_posts.py     # Fix posts with zero engagement
├── test_ml_endpoint.py              # Test ML endpoints
├── test_ml_prediction.py            # Test ML prediction service
├── test_ml_posting_time.py          # Test ML posting time feature
├── test_pattern_recognition_now.py  # Test pattern recognition with current data
└── INSTALL_DEPENDENCIES.bat         # Install all Python dependencies
```

### Frontend Files

#### Pages
```
frontend/src/pages/
├── InstagramAnalytics.jsx           # Main Instagram analytics dashboard
└── platforms/
    └── InstagramCallback.jsx        # OAuth callback handler
```

#### API Service
```
frontend/src/services/
└── api.js                           # API methods for Instagram endpoints
```

#### Routing
```
frontend/src/
└── App.jsx                          # Route definitions (includes Instagram routes)
```

---

## 💼 LinkedIn Integration Files

### Backend Files

#### Core LinkedIn Files
```
backend/platforms/linkedin/
├── __init__.py                      # Package initialization
├── linkedin_controller.py           # API endpoints (OAuth, connections, posts)
├── linkedin_model.py                # Database models (LinkedInConnection, LinkedInPost)
└── linkedin_service.py              # LinkedIn API service
```

#### Database & Configuration
```
backend/
├── models.py                        # Main database models (includes LinkedIn models)
├── app.py                           # Flask app initialization (registers LinkedIn blueprint)
└── .env                             # Environment variables (LinkedIn credentials)
```

### Frontend Files

#### Pages
```
frontend/src/pages/
├── LinkedInAnalytics.jsx            # LinkedIn analytics dashboard
└── platforms/
    └── LinkedInCallback.jsx         # OAuth callback handler
```

#### API Service
```
frontend/src/services/
└── api.js                           # API methods for LinkedIn endpoints
```

#### Routing
```
frontend/src/
└── App.jsx                          # Route definitions (includes LinkedIn routes)
```

---

## 🔧 Shared/Common Files

### Backend Shared
```
backend/
├── models.py                        # Shared database models (User, OAuthState)
├── app.py                           # Main Flask application
├── config.py                        # Configuration
├── requirements.txt                 # Python dependencies
└── platforms/
    └── base_platform.py             # Base class for platform integrations
```

### Frontend Shared
```
frontend/src/
├── App.jsx                          # Main app with routing
├── services/
│   └── api.js                       # Centralized API service
├── contexts/
│   └── AuthContext.jsx              # Authentication context
└── components/
    ├── Header.jsx                   # Navigation (includes Platforms dropdown)
    └── ProtectedRoute.jsx           # Route protection
```

---

## 📊 Documentation Files

### Instagram Documentation
```
ML_INSIGHTS_EXPLAINED.md             # How ML insights work
ML_PREDICTION_GUIDE.md               # ML prediction detailed guide
ML_PREDICTION_FIXES.md               # Fixes applied to ML prediction
ML_PREDICTION_VISUAL_GUIDE.txt       # Visual guide for ML features
ML_FEATURE_REDESIGN.md               # Proposed redesign for ML features
ML_TAB_INSTRUCTIONS.txt              # Instructions for ML tab
UNDERPERFORMING_POSTS_FIX.md         # Fix for underperforming posts data
CHECK_ML_ISSUE.md                    # Debugging guide for ML issues
```

### LinkedIn Documentation
```
LINKEDIN_API_LIMITATIONS.md          # LinkedIn API limitations explained
```

### General Documentation
```
INSTAGRAM_LINKEDIN_FILES.md          # This file - complete file list
```

---

## 🗄️ Database Tables

### Instagram Tables
```sql
-- InstagramConnection
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- instagram_user_id (String)
- instagram_username (String)
- access_token (String, Encrypted)
- token_expires_at (DateTime)
- followers_count (Integer)
- profile_picture_url (String)
- is_active (Boolean)
- last_synced_at (DateTime)
- created_at (DateTime)
- updated_at (DateTime)

-- InstagramPost
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- connection_id (UUID, Foreign Key → instagram_connections.id)
- instagram_post_id (String, Unique)
- media_type (String: IMAGE/VIDEO/CAROUSEL_ALBUM)
- media_url (String)
- permalink (String)
- caption (Text)
- like_count (Integer)
- comments_count (Integer)
- reach (Integer)
- impressions (Integer)
- saves_count (Integer)
- engagement_rate (Float)
- is_underperforming (Boolean)
- performance_score (Float)
- ai_suggestions (JSON)
- suggestions_generated_at (DateTime)
- published_at (DateTime)
- created_at (DateTime)
- updated_at (DateTime)

-- InstagramCompetitor
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- username (String)
- follower_count (Integer)
- avg_engagement_rate (Float)
- post_frequency (String)
- top_content_types (JSON)
- last_analyzed_at (DateTime)
- created_at (DateTime)
- updated_at (DateTime)
```

### LinkedIn Tables
```sql
-- LinkedInConnection
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- linkedin_user_id (String)
- linkedin_name (String)
- linkedin_email (String)
- access_token (String, Encrypted)
- token_expires_at (DateTime)
- profile_picture_url (String)
- connections_count (Integer)
- is_active (Boolean)
- last_synced_at (DateTime)
- created_at (DateTime)
- updated_at (DateTime)

-- LinkedInPost
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- connection_id (UUID, Foreign Key → linkedin_connections.id)
- linkedin_post_id (String, Unique)
- content (Text)
- media_url (String)
- like_count (Integer)
- comment_count (Integer)
- share_count (Integer)
- impression_count (Integer)
- engagement_rate (Float)
- published_at (DateTime)
- created_at (DateTime)
- updated_at (DateTime)
```

### Shared Tables
```sql
-- OAuthState (used by both platforms)
- id (UUID, Primary Key)
- state (String, Unique)
- user_id (UUID, Foreign Key → users.id)
- platform (String: 'instagram' or 'linkedin')
- is_used (Boolean)
- used_at (DateTime)
- expires_at (DateTime)
- created_at (DateTime)
```

---

## 🔌 API Endpoints

### Instagram Endpoints
```
Authentication & Connection:
GET    /api/platforms/instagram/auth                    # Get OAuth URL
POST   /api/platforms/instagram/callback                # OAuth callback
GET    /api/platforms/instagram/connections             # Get user's connections
DELETE /api/platforms/instagram/connections/:id         # Delete connection

Data Sync:
POST   /api/platforms/instagram/sync/:connection_id     # Sync Instagram data

Analytics:
GET    /api/platforms/instagram/dashboard/:connection_id    # Get dashboard data
GET    /api/platforms/instagram/compare/:connection_id      # Compare with competitors

ML Features:
GET    /api/platforms/instagram/ml/analyze-patterns/:connection_id        # Pattern Recognition
POST   /api/platforms/instagram/ml/train-model/:connection_id             # Train ML model
POST   /api/platforms/instagram/ml/predict-engagement/:connection_id      # Predict engagement
GET    /api/platforms/instagram/ml/optimal-posting-time/:connection_id    # Get optimal time
POST   /api/platforms/instagram/ml/sentiment-analysis/:connection_id      # Sentiment analysis

AI Features:
POST   /api/platforms/instagram/posts/:post_id/suggestions  # Generate AI suggestions

Competitors:
GET    /api/platforms/instagram/competitors                 # Get competitors
POST   /api/platforms/instagram/competitors                 # Add competitor
DELETE /api/platforms/instagram/competitors/:id             # Remove competitor
```

### LinkedIn Endpoints
```
Authentication & Connection:
GET    /api/platforms/linkedin/auth                     # Get OAuth URL
POST   /api/platforms/linkedin/exchange-token           # Exchange code for token
GET    /api/platforms/linkedin/connections              # Get user's connections
DELETE /api/platforms/linkedin/connections/:id          # Delete connection

Analytics:
GET    /api/platforms/linkedin/dashboard/:connection_id # Get dashboard data
POST   /api/platforms/linkedin/sync/:connection_id      # Sync LinkedIn data
```

---

## 🔑 Environment Variables

### Instagram Configuration
```env
# Instagram OAuth (Instagram Basic Display API)
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=https://your-domain.com/api/platforms/instagram/callback
INSTAGRAM_SCOPES=instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages
INSTAGRAM_FRONTEND_URL=http://localhost:5173
```

### LinkedIn Configuration
```env
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:5173/platforms/linkedin/callback
LINKEDIN_SCOPES=openid,profile,email,w_member_social,r_liteprofile
```

---

## 📦 Dependencies

### Python Dependencies (Backend)
```
# Core
Flask==3.0.0
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.1.1
Flask-JWT-Extended==4.6.0
requests==2.31.0

# ML Dependencies
numpy>=1.26.0
scipy>=1.11.4
scikit-learn>=1.3.2
textblob>=0.17.1

# AI
groq==1.0.0

# Database
psycopg2-binary==2.9.9
pymongo==4.6.1

# Security
cryptography==46.0.4
bcrypt==4.1.2
PyJWT==2.8.0

# Utilities
python-dotenv==1.0.0
python-dateutil==2.8.2
validators==0.22.0
beautifulsoup4==4.12.2
Pillow>=10.2.0
```

### JavaScript Dependencies (Frontend)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.x",
    "axios": "^1.x"
  }
}
```

---

## 🎯 Key Features by File

### Instagram Features

**instagram_controller.py** (1,500+ lines)
- OAuth authentication flow
- Data synchronization from Instagram API
- Dashboard analytics
- Pattern Recognition (ML)
- ML model training & prediction
- Optimal posting time recommendations
- Sentiment analysis
- AI suggestions for underperforming posts
- Competitor analysis

**instagram_ml_service.py** (850+ lines)
- Pattern recognition (caption length, posting time, format)
- Hashtag & emoji analysis
- ML model training (Linear Regression)
- Engagement prediction
- Sentiment analysis
- Feature importance calculation

**InstagramAnalytics.jsx** (2,000+ lines)
- Dashboard with metrics
- Recent posts grid
- Underperforming posts section
- ML Insights tab (Pattern Recognition, ML Prediction, Optimal Timing)
- Competitor comparison
- AI suggestions UI

### LinkedIn Features

**linkedin_controller.py** (300+ lines)
- OAuth authentication flow
- Token exchange
- User profile fetching
- Connection management
- Dashboard data
- Data synchronization

**linkedin_service.py** (200+ lines)
- OAuth URL generation
- Token exchange
- Profile API calls
- Posts fetching
- Connection count (limited by API)

**LinkedInAnalytics.jsx** (500+ lines)
- Dashboard with basic metrics
- Connection management
- Profile display
- API limitations notice

---

## 🚀 Integration Flow

### Instagram Integration Flow
```
1. User clicks "Connect Instagram"
2. Frontend calls /api/platforms/instagram/auth
3. Backend generates OAuth URL with state
4. User redirects to Instagram OAuth
5. User authorizes app
6. Instagram redirects to /api/platforms/instagram/callback
7. Backend exchanges code for access token
8. Backend fetches user profile
9. Backend stores connection in database
10. Frontend redirects to InstagramAnalytics
11. User can sync data, view analytics, use ML features
```

### LinkedIn Integration Flow
```
1. User clicks "Connect LinkedIn"
2. Frontend calls /api/platforms/linkedin/auth
3. Backend generates OAuth URL with state
4. User redirects to LinkedIn OAuth
5. User authorizes app
6. LinkedIn redirects to frontend callback
7. Frontend calls /api/platforms/linkedin/exchange-token
8. Backend exchanges code for access token
9. Backend fetches user profile
10. Backend stores connection in database
11. Frontend redirects to LinkedInAnalytics
12. User can view basic analytics (limited by API)
```

---

## 📝 Notes

### Instagram
- Uses Instagram Graph API (Business accounts)
- Requires Facebook App with Instagram Basic Display
- Full access to posts, insights, comments
- ML features fully functional
- AI suggestions powered by Groq

### LinkedIn
- Uses LinkedIn OAuth 2.0
- Severely limited without Partner Program
- Can only access: name, email, profile picture
- Cannot access: posts, connections count, analytics
- Most features require LinkedIn Partner Program approval

---

**Last Updated**: March 7, 2026
**Total Files**: 50+ files across backend and frontend
