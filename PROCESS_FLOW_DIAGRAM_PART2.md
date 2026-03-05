# ContentGenie - Technical Architecture & Data Flow (Part 2)

## 9️⃣ DATABASE SCHEMA & RELATIONSHIPS

### Core Database Models

```
┌─────────────────────────────────────────────────────────────┐
│ USER MODEL (SQLite)                                        │
│ File: backend/models.py                                    │
├─────────────────────────────────────────────────────────────┤
│ Fields:                                                     │
│ - id (UUID, Primary Key)                                   │
│ - firebase_uid (String, Unique)                           │
│ - email (String, Unique)                                   │
│ - display_name (String)                                    │
│ - photo_url (String)                                       │
│ - provider (String: email, google)                        │
│ - is_active (Boolean)                                      │
│ - created_at, updated_at, last_login (DateTime)          │
├─────────────────────────────────────────────────────────────┤
│ Relationships:                                             │
│ - sessions → UserSession (One-to-Many)                    │
│ - content → Content (One-to-Many)                         │
│ - instagram_connections → InstagramConnection (1-to-Many) │
│ - team_memberships → TeamMember (One-to-Many)            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CONTENT MODEL (SQLite)                                     │
├─────────────────────────────────────────────────────────────┤
│ Fields:                                                     │
│ - id (UUID, Primary Key)                                   │
│ - user_id (UUID, Foreign Key → User)                      │
│ - content_type (String: post, caption, thread, etc.)      │
│ - platform (String: linkedin, instagram, twitter, etc.)   │
│ - original_prompt (Text)                                   │
│ - generated_content (Text)                                 │
│ - tone (String)                                            │
│ - status (String: draft, published, archived)             │
│ - is_saved (Boolean)                                       │
│ - is_favorite (Boolean)                                    │
│ - usage_count (Integer)                                    │
│ - metadata (JSON)                                          │
│ - created_at, updated_at, last_used_at (DateTime)        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ INSTAGRAM MODELS (SQLite)                                  │
│ File: backend/platforms/instagram/instagram_model.py      │
├─────────────────────────────────────────────────────────────┤
│ InstagramConnection:                                       │
│ - id, user_id, instagram_user_id                         │
│ - instagram_username, instagram_account_type             │
│ - access_token, token_expires_at                         │
│ - followers_count, follows_count, media_count            │
│ - profile_picture_url                                     │
│ - is_active, last_synced_at                              │
├─────────────────────────────────────────────────────────────┤
│ InstagramPost:                                             │
│ - id, user_id, connection_id                             │
│ - instagram_post_id, media_type, media_url              │
│ - caption, permalink                                      │
│ - like_count, comments_count                             │
│ - reach, impressions, saves_count                        │
│ - engagement_rate, performance_score                     │
│ - is_underperforming, ai_suggestions                     │
│ - published_at, created_at, updated_at                   │
├─────────────────────────────────────────────────────────────┤
│ InstagramCompetitor:                                       │
│ - id, user_id, instagram_username                        │
│ - followers_count, follows_count, media_count            │
│ - avg_likes, avg_comments, avg_engagement_rate           │
│ - posting_frequency, last_analyzed_at                    │
│ - is_active                                               │
├─────────────────────────────────────────────────────────────┤
│ OAuthState:                                                │
│ - id, state (UUID), user_id, platform                    │
│ - is_used, expires_at, created_at                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TEAM MODELS (SQLite)                                       │
├─────────────────────────────────────────────────────────────┤
│ Team:                                                       │
│ - id, name, description                                    │
│ - owner_id (Foreign Key → User)                           │
│ - is_active, created_at, updated_at                       │
├─────────────────────────────────────────────────────────────┤
│ TeamMember:                                                │
│ - id, team_id, user_id                                    │
│ - role (owner, admin, member, viewer)                     │
│ - status (pending, active, inactive)                      │
│ - joined_at, invited_at                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ USER PROFILE (MongoDB)                                     │
│ Service: backend/services/profile_service.py              │
├─────────────────────────────────────────────────────────────┤
│ Fields:                                                     │
│ - user_id (String, matches SQLite User.id)                │
│ - full_name, professional_title, location                 │
│ - bio, content_tone, target_audience                      │
│ - niche_tags (Array)                                      │
│ - primary_goal, platforms (Array)                         │
│ - onboarding_complete (Boolean)                           │
│ - preferences (Object)                                     │
│ - created_at, updated_at                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔟 API ENDPOINTS REFERENCE

### Authentication Endpoints
```
POST   /api/auth/verify-token      - Verify Firebase token & create session
POST   /api/auth/refresh            - Refresh JWT access token
POST   /api/auth/logout             - Logout and invalidate session
GET    /api/auth/profile            - Get current user profile
PUT    /api/auth/profile            - Update user profile
GET    /api/auth/sessions           - Get active sessions
DELETE /api/auth/sessions/:id       - Revoke specific session
```

### Profile Endpoints
```
GET    /api/profile                 - Get user profile (with MongoDB data)
PUT    /api/profile                 - Update user profile
POST   /api/profile/onboarding      - Complete onboarding
GET    /api/profile/onboarding/status - Check onboarding status
```

### Content Endpoints
```
POST   /api/content/generate        - Generate AI content
GET    /api/content                 - Get all user content
GET    /api/content/:id             - Get specific content
PUT    /api/content/:id             - Update content
DELETE /api/content/:id             - Delete content
POST   /api/content/:id/save        - Save to library
GET    /api/content/library         - Get saved content
POST   /api/content/:id/favorite    - Toggle favorite
```

### Instagram Endpoints
```
# OAuth Flow
GET    /api/platforms/instagram/auth              - Get OAuth URL
GET    /api/platforms/instagram/callback          - OAuth callback
POST   /api/platforms/instagram/exchange-token    - Exchange code for token

# Connection Management
GET    /api/platforms/instagram/connections       - Get connections
DELETE /api/platforms/instagram/connections/:id   - Disconnect account
GET    /api/platforms/instagram/profile           - Get Instagram profile

# Data Sync & Analytics
POST   /api/platforms/instagram/sync/:id          - Sync Instagram data
GET    /api/platforms/instagram/dashboard/:id     - Get dashboard data
POST   /api/platforms/instagram/posts/:id/suggestions - Generate AI suggestions

# Competitor Tracking
GET    /api/platforms/instagram/competitors       - Get competitors
POST   /api/platforms/instagram/competitors       - Add competitor
DELETE /api/platforms/instagram/competitors/:id   - Remove competitor
GET    /api/platforms/instagram/compare/:id       - Compare with competitors

# AI Features
GET    /api/platforms/instagram/ai/content-gaps/:id        - Content gap analysis
POST   /api/platforms/instagram/ai/optimize-caption        - Optimize caption
POST   /api/platforms/instagram/ai/predict-performance     - Predict performance
GET    /api/platforms/instagram/ai/content-ideas/:id       - Generate content ideas

# Debug
GET    /api/platforms/instagram/debug             - Debug config
GET    /api/platforms/instagram/debug-media/:id   - Debug media data
```

### Analytics Endpoints
```
GET    /api/analytics/overview      - Get analytics overview
GET    /api/analytics/trends        - Get usage trends
GET    /api/analytics/platforms     - Get platform breakdown
```

### Team Endpoints
```
POST   /api/team/create             - Create team
GET    /api/team                    - Get user's teams
GET    /api/team/:id                - Get team details
PUT    /api/team/:id                - Update team
DELETE /api/team/:id                - Delete team
POST   /api/team/:id/invite         - Invite member
GET    /api/team/:id/members        - Get team members
PUT    /api/team/:id/members/:uid   - Update member role
DELETE /api/team/:id/members/:uid   - Remove member
```

### LinkoGenei Endpoints
```
POST   /api/linkogenei/extract      - Extract LinkedIn post
GET    /api/linkogenei/posts        - Get extracted posts
GET    /api/linkogenei/posts/:id    - Get specific post
DELETE /api/linkogenei/posts/:id    - Delete post
POST   /api/linkogenei/analyze      - Analyze post
```

---

## 1️⃣1️⃣ FRONTEND ARCHITECTURE

### Component Hierarchy

```
App.jsx (Root)
├─► AuthProvider (Context)
│   └─► ProfileProvider (Context)
│       └─► ThemeProvider (Context)
│           └─► Router
│               ├─► Navbar (Global)
│               └─► Routes
│                   ├─► Public Routes
│                   │   ├─► LandingPage
│                   │   ├─► SignIn
│                   │   ├─► Login
│                   │   ├─► AboutUs
│                   │   └─► ContactUs
│                   │
│                   ├─► Protected Routes (Require Auth)
│                   │   ├─► Onboarding
│                   │   ├─► Dashboard
│                   │   ├─► Creator
│                   │   ├─► Analytics
│                   │   ├─► ContentLibrary
│                   │   ├─► SocialScheduler
│                   │   ├─► ContentOptimizer
│                   │   ├─► TeamCollaboration
│                   │   ├─► LinkoGenei
│                   │   ├─► Profile
│                   │   └─► InstagramAnalytics
│                   │
│                   └─► OAuth Callbacks
│                       └─► InstagramCallback
```

### State Management

```
┌─────────────────────────────────────────────────────────────┐
│ AuthContext.jsx                                            │
├─────────────────────────────────────────────────────────────┤
│ State:                                                      │
│ - currentUser (User object or null)                        │
│ - loading (Boolean)                                        │
│                                                             │
│ Methods:                                                    │
│ - login(email, password)                                   │
│ - loginWithGoogle()                                        │
│ - signup(email, password, displayName)                     │
│ - logout()                                                 │
│ - resetPassword(email)                                     │
│                                                             │
│ Storage:                                                    │
│ - localStorage: access_token, refresh_token                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ProfileContext.jsx                                         │
├─────────────────────────────────────────────────────────────┤
│ State:                                                      │
│ - profile (Profile object or null)                         │
│ - loading (Boolean)                                        │
│                                                             │
│ Methods:                                                    │
│ - fetchProfile()                                           │
│ - updateProfile(data)                                      │
│ - completeOnboarding(data)                                │
│                                                             │
│ Auto-fetch on user login                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ThemeContext.jsx                                           │
├─────────────────────────────────────────────────────────────┤
│ State:                                                      │
│ - theme ('light' or 'dark')                                │
│                                                             │
│ Methods:                                                    │
│ - toggleTheme()                                            │
│                                                             │
│ Storage:                                                    │
│ - localStorage: theme                                      │
└─────────────────────────────────────────────────────────────┘
```

### Routing & Protection

```
┌─────────────────────────────────────────────────────────────┐
│ ProtectedRoute Component                                   │
│ File: frontend/src/components/ProtectedRoute.jsx          │
├─────────────────────────────────────────────────────────────┤
│ Logic:                                                      │
│ 1. Check if user is authenticated                          │
│    - If not → Redirect to /login                          │
│                                                             │
│ 2. Check onboarding status (if requireOnboarding=true)    │
│    - If not complete → Redirect to /onboarding            │
│                                                             │
│ 3. If all checks pass → Render children                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Route Guard in App.jsx                                     │
├─────────────────────────────────────────────────────────────┤
│ useEffect Hook:                                            │
│ - Runs on every route change                               │
│ - Checks localStorage: onboarding_complete                 │
│ - If false and not on public/onboarding route:            │
│   → Force redirect to /onboarding                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣2️⃣ BACKEND ARCHITECTURE

### Service Layer Pattern

```
┌─────────────────────────────────────────────────────────────┐
│ AI Service                                                 │
│ File: backend/services/ai_service.py                      │
├─────────────────────────────────────────────────────────────┤
│ Class: AIContentGenerator                                 │
│                                                             │
│ Methods:                                                    │
│ - generate_content(prompt, content_type, tone, ...)       │
│ - _construct_prompt(...)                                  │
│ - _call_groq_api(prompt, max_tokens)                     │
│                                                             │
│ External API:                                              │
│ - Groq API (llama-3.3-70b-versatile)                     │
│ - API Key from environment                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Instagram AI Service                                       │
│ File: backend/services/instagram_ai_service.py            │
├─────────────────────────────────────────────────────────────┤
│ Class: InstagramAIService                                 │
│                                                             │
│ Methods:                                                    │
│ - analyze_content_gaps(user_posts, competitor_posts)      │
│ - optimize_caption(caption, top_posts)                    │
│ - predict_performance(post_data, historical_posts)        │
│ - generate_content_ideas(user_posts, competitor_posts)    │
│ - _extract_caption_patterns(posts)                        │
│ - _calculate_posting_frequency(posts)                     │
│ - _find_similar_posts(features, historical)               │
│                                                             │
│ Uses: AIContentGenerator for GPT-4 calls                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Instagram Service                                          │
│ File: backend/platforms/instagram/instagram_service.py    │
├─────────────────────────────────────────────────────────────┤
│ Class: InstagramService                                   │
│                                                             │
│ OAuth Methods:                                             │
│ - get_oauth_url(state)                                    │
│ - exchange_code_for_token(code)                           │
│ - get_long_lived_token(short_token)                       │
│                                                             │
│ API Methods:                                               │
│ - get_user_profile(access_token)                          │
│ - get_user_media(user_id, access_token, limit)           │
│ - get_media_insights(media_id, access_token)              │
│ - get_user_insights(user_id, access_token)                │
│                                                             │
│ Analysis Methods:                                          │
│ - calculate_engagement_rate(likes, comments, followers)   │
│ - detect_underperforming_posts(posts)                     │
│ - analyze_competitor(username, access_token)              │
│                                                             │
│ External API:                                              │
│ - Instagram Graph API                                      │
│ - Business Discovery API (for competitors)                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Profile Service                                            │
│ File: backend/services/profile_service.py                 │
├─────────────────────────────────────────────────────────────┤
│ Class: ProfileService                                     │
│                                                             │
│ Methods:                                                    │
│ - get_or_create_profile(user_id, email, name)            │
│ - update_profile(user_id, data)                           │
│ - complete_onboarding(user_id, data)                      │
│ - get_profile(user_id)                                    │
│                                                             │
│ Database: MongoDB (profiles collection)                   │
│ Fallback: Returns default profile if MongoDB unavailable  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Firebase Service                                           │
│ File: backend/services/firebase_service.py                │
├─────────────────────────────────────────────────────────────┤
│ Class: FirebaseService                                    │
│                                                             │
│ Methods:                                                    │
│ - verify_token(id_token)                                  │
│ - _initialize_firebase()                                  │
│                                                             │
│ External Service: Firebase Authentication                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣3️⃣ EXTERNAL INTEGRATIONS

### API Integrations Flow

```
┌─────────────────────────────────────────────────────────────┐
│ GROQ AI API                                                │
├─────────────────────────────────────────────────────────────┤
│ Purpose: AI Content Generation                             │
│ Model: llama-3.3-70b-versatile                            │
│ Endpoint: https://api.groq.com/openai/v1/chat/completions │
│                                                             │
│ Request Flow:                                              │
│ 1. User requests content generation                        │
│ 2. Backend constructs prompt with context                  │
│ 3. Sends to Groq API with parameters:                     │
│    - model, messages, temperature, max_tokens             │
│ 4. Receives generated content                             │
│ 5. Stores in database                                     │
│ 6. Returns to frontend                                    │
│                                                             │
│ Rate Limits: Handled by backend                           │
│ Error Handling: Retry logic + fallback messages           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ INSTAGRAM GRAPH API                                        │
├─────────────────────────────────────────────────────────────┤
│ Purpose: Instagram Data & Analytics                        │
│ Base URL: https://graph.instagram.com                     │
│                                                             │
│ Endpoints Used:                                            │
│ 1. OAuth:                                                  │
│    - /oauth/authorize (user authorization)                │
│    - /oauth/access_token (token exchange)                 │
│                                                             │
│ 2. User Data:                                              │
│    - /me (user profile)                                   │
│    - /me/media (user posts)                               │
│    - /{media-id} (post details)                           │
│                                                             │
│ 3. Insights:                                               │
│    - /me/insights (account insights)                      │
│    - /{media-id}/insights (post insights)                 │
│                                                             │
│ 4. Business Discovery:                                     │
│    - /{ig-user-id}?fields=business_discovery.username()   │
│    (for competitor analysis)                              │
│                                                             │
│ Authentication: Long-lived access tokens (60 days)        │
│ Refresh: Automatic token refresh before expiry            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FIREBASE AUTHENTICATION                                    │
├─────────────────────────────────────────────────────────────┤
│ Purpose: User Authentication & Management                  │
│                                                             │
│ Features Used:                                             │
│ - Email/Password authentication                            │
│ - Google OAuth                                             │
│ - ID Token generation                                      │
│ - Token verification                                       │
│                                                             │
│ Flow:                                                       │
│ 1. User authenticates via Firebase SDK (frontend)         │
│ 2. Firebase returns ID token                              │
│ 3. Frontend sends token to backend                        │
│ 4. Backend verifies with Firebase Admin SDK               │
│ 5. Backend creates/updates user in database               │
│ 6. Backend generates JWT tokens                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ MONGODB                                                    │
├─────────────────────────────────────────────────────────────┤
│ Purpose: User Profiles & Extended Data                    │
│ Connection: MongoDB Atlas or Local                        │
│                                                             │
│ Collections:                                               │
│ - profiles (user profile data)                            │
│ - linkogenei_posts (extracted LinkedIn posts)             │
│                                                             │
│ Why MongoDB:                                               │
│ - Flexible schema for profile data                        │
│ - Easy to add new fields without migrations               │
│ - Good for document-based data (posts, metadata)          │
│                                                             │
│ Fallback: If unavailable, uses default profile data       │
└─────────────────────────────────────────────────────────────┘
```
