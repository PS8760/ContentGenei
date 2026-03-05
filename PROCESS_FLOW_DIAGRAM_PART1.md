# ContentGenie - Complete Process Flow Diagram

## 🎯 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTENTGENIE PLATFORM                        │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Frontend   │◄──►│   Backend    │◄──►│  External    │     │
│  │   (React)    │    │   (Flask)    │    │  Services    │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                    │                    │             │
│    User Interface      API Layer          Instagram API        │
│    State Management    Business Logic     Firebase Auth        │
│    Routing            Database            Groq AI              │
│                       AI Services         MongoDB              │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 High-Level System Flow

```
User → Frontend → API Gateway → Authentication → Business Logic → Database
                                                        ↓
                                                  AI Services
                                                        ↓
                                              External APIs
```

---

## 1️⃣ USER AUTHENTICATION FLOW

### Firebase Authentication Process

```
┌─────────┐
│  User   │
└────┬────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User Registration/Login                             │
│ Location: frontend/src/pages/SignIn.jsx, Login.jsx         │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Firebase Authentication                             │
│ - Email/Password                                            │
│ - Google OAuth                                              │
│ - Returns: Firebase ID Token                               │
│ Service: services/firebase_service.py                      │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Token Verification                                  │
│ Endpoint: POST /api/auth/verify-token                      │
│ - Verify Firebase token                                    │
│ - Create/Update user in database                           │
│ - Generate JWT access & refresh tokens                     │
│ File: backend/routes/auth.py                               │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Session Creation                                    │
│ - Create UserSession record                                │
│ - Store session token                                      │
│ - Track IP, user agent, expiry                            │
│ Model: models.py → UserSession                            │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Store Tokens in Frontend                           │
│ - localStorage: access_token, refresh_token                │
│ - Context: AuthContext.jsx                                 │
│ - Redirect to: /onboarding or /dashboard                  │
└─────────────────────────────────────────────────────────────┘
```

### Authentication State Management

```
AuthContext.jsx
    │
    ├─► currentUser (state)
    ├─► loading (state)
    ├─► login() → Firebase → Backend → Store tokens
    ├─► logout() → Clear tokens → Redirect
    └─► useEffect() → Check stored tokens → Auto-login
```

---

## 2️⃣ ONBOARDING FLOW

### User Profile Setup Process

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Check Onboarding Status                            │
│ Endpoint: GET /api/profile/onboarding/status              │
│ - Check if profile exists                                  │
│ - Check if onboarding_complete flag is set               │
│ File: backend/routes/profile.py                           │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Onboarding Form (if not complete)                 │
│ Page: frontend/src/pages/Onboarding.jsx                   │
│ Fields:                                                     │
│ - Full Name                                                │
│ - Professional Title                                       │
│ - Location                                                 │
│ - Bio                                                      │
│ - Content Tone (dropdown)                                 │
│ - Target Audience                                         │
│ - Niche Tags (multi-select)                              │
│ - Primary Goal (dropdown)                                 │
│ - Platforms (checkboxes)                                  │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Submit Onboarding Data                            │
│ Endpoint: POST /api/profile/onboarding                    │
│ - Validate required fields                                │
│ - Create/Update UserProfile in MongoDB                    │
│ - Set onboarding_complete = true                          │
│ Service: services/profile_service.py                      │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Store Completion Flag                             │
│ - localStorage.setItem('onboarding_complete', 'true')     │
│ - Redirect to /dashboard                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ CONTENT CREATION FLOW

### AI-Powered Content Generation

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User Input                                         │
│ Page: frontend/src/pages/Creator.jsx                      │
│ Inputs:                                                     │
│ - Content Type (Post, Caption, Thread, etc.)              │
│ - Topic/Keywords                                          │
│ - Tone (Professional, Casual, Humorous, etc.)            │
│ - Platform (LinkedIn, Instagram, Twitter, etc.)           │
│ - Additional Context (optional)                           │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: API Request                                        │
│ Endpoint: POST /api/content/generate                      │
│ Headers: Authorization: Bearer <JWT>                      │
│ Body: {                                                    │
│   content_type, topic, tone, platform, context           │
│ }                                                          │
│ File: frontend/src/services/api.js                       │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Backend Processing                                │
│ File: backend/routes/content.py                           │
│ - Validate JWT token                                      │
│ - Get user_id from token                                  │
│ - Check user limits (daily/monthly)                       │
│ - Prepare AI prompt                                       │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: AI Content Generation                             │
│ Service: backend/services/ai_service.py                   │
│ - AIContentGenerator class                                │
│ - Uses Groq API (llama-3.3-70b-versatile)                │
│ - Constructs prompt with:                                 │
│   * User profile data                                     │
│   * Content type requirements                             │
│   * Tone and style guidelines                             │
│   * Platform-specific formatting                          │
│ - Generates content                                       │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Save to Database                                  │
│ Model: models.py → Content                                │
│ Fields:                                                     │
│ - user_id, content_type, platform                         │
│ - original_prompt, generated_content                      │
│ - tone, status, metadata                                  │
│ - created_at, updated_at                                  │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Return to Frontend                                │
│ Response: {                                                │
│   success: true,                                          │
│   content: { id, generated_content, ... },               │
│   usage: { tokens_used, ... }                            │
│ }                                                          │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Display & Actions                                 │
│ - Show generated content                                  │
│ - Options:                                                │
│   * Copy to clipboard                                     │
│   * Save to library                                       │
│   * Continue generating (variations)                      │
│   * Edit content                                          │
│   * Share/Export                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 4️⃣ INSTAGRAM INTEGRATION FLOW

### Complete Instagram OAuth & Analytics Process

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: OAuth Connection                                  │
└─────────────────────────────────────────────────────────────┘

STEP 1: Initiate Connection
├─► User clicks "Connect Instagram"
├─► Page: frontend/src/pages/InstagramAnalytics.jsx
└─► Endpoint: GET /api/platforms/instagram/auth

STEP 2: Generate OAuth URL
├─► Backend generates state token (UUID)
├─► Store OAuthState in database
│   - state, user_id, platform, expires_at
├─► Return Instagram OAuth URL with:
│   - client_id (Instagram App ID)
│   - redirect_uri
│   - scope (user_profile, user_media)
│   - state (for CSRF protection)
└─► File: backend/platforms/instagram/instagram_controller.py

STEP 3: Redirect to Instagram
├─► User redirected to Instagram
├─► User logs in and authorizes app
└─► Instagram redirects back with code & state

STEP 4: Handle Callback
├─► Endpoint: GET /api/platforms/instagram/callback
├─► NO JWT required (Instagram redirects here)
├─► Redirect to frontend callback page with code & state
└─► Page: frontend/src/pages/platforms/InstagramCallback.jsx

STEP 5: Exchange Code for Token
├─► Frontend calls: POST /api/platforms/instagram/exchange-token
├─► WITH JWT (user is logged in)
├─► Backend:
│   ├─► Validates state token
│   ├─► Exchanges code for short-lived token
│   ├─► Exchanges for long-lived token (60 days)
│   ├─► Fetches user profile
│   └─► Stores InstagramConnection in database
└─► Returns connection data

┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Data Synchronization                             │
└─────────────────────────────────────────────────────────────┘

STEP 6: Sync Instagram Data
├─► User clicks "Sync Data"
├─► Endpoint: POST /api/platforms/instagram/sync/<connection_id>
├─► Backend:
│   ├─► Get user's Instagram connection
│   ├─► Fetch account insights (follower_count)
│   ├─► Fetch recent media (30 posts)
│   │   - media_id, media_type, media_url
│   │   - caption, permalink, timestamp
│   │   - like_count, comments_count
│   ├─► Fetch media insights for each post
│   │   - reach, impressions, saved
│   ├─► Calculate engagement_rate
│   ├─► Create/Update InstagramPost records
│   └─► Update last_synced_at
└─► Returns: synced_posts count

┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: Analytics Dashboard                              │
└─────────────────────────────────────────────────────────────┘

STEP 7: Load Dashboard Data
├─► Endpoint: GET /api/platforms/instagram/dashboard/<connection_id>
├─► Backend:
│   ├─► Get posts (filter by connection_id AND user_id)
│   ├─► Calculate metrics:
│   │   - total_posts, total_likes, total_comments
│   │   - total_reach, total_impressions
│   │   - avg_engagement_rate
│   ├─► Detect underperforming posts
│   └─► Return dashboard data
└─► Frontend displays:
    ├─► Stats cards (followers, engagement, reach, posts)
    ├─► Charts (engagement trends, post type distribution)
    ├─► Underperforming posts with AI suggestions
    └─► Recent posts grid

┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: AI-Powered Features                              │
└─────────────────────────────────────────────────────────────┘

FEATURE 1: Content Gap Analysis
├─► Endpoint: GET /api/platforms/instagram/ai/content-gaps/<connection_id>
├─► Service: backend/services/instagram_ai_service.py
├─► Process:
│   ├─► Analyze user's posts (content types, frequency, engagement)
│   ├─► Analyze competitor posts
│   ├─► Identify gaps:
│   │   - Missing content types
│   │   - Low posting frequency
│   │   - Lower engagement rate
│   │   - Caption length mismatch
│   └─► Return prioritized recommendations
└─► Frontend displays gaps with severity and recommendations

FEATURE 2: Caption Optimizer
├─► Endpoint: POST /api/platforms/instagram/ai/optimize-caption
├─► Input: { caption, connection_id }
├─► Process:
│   ├─► Get user's top 10 performing posts
│   ├─► Extract caption patterns:
│   │   - Average length
│   │   - Common hooks
│   │   - Engagement triggers
│   │   - Hashtag count
│   │   - Emoji usage
│   │   - CTA style
│   ├─► Use GPT-4 to rewrite caption with patterns
│   └─► Predict improvement percentage
└─► Returns: optimized_caption, improvements, predicted_impact

FEATURE 3: Performance Predictor
├─► Endpoint: POST /api/platforms/instagram/ai/predict-performance
├─► Input: { post: {media_type, caption}, connection_id }
├─► Process:
│   ├─► Extract post features (type, caption length, hashtags)
│   ├─► Find similar historical posts
│   ├─► Calculate baseline engagement
│   ├─► Apply multipliers:
│   │   - Carousel: +15%
│   │   - Video: +10%
│   │   - Optimal caption length: +5%
│   │   - Optimal hashtags: +8%
│   └─► Return prediction with confidence
└─► Returns: predicted_engagement, confidence, reasoning

FEATURE 4: Content Ideas Generator
├─► Endpoint: GET /api/platforms/instagram/ai/content-ideas/<connection_id>
├─► Input: niche (query param)
├─► Process:
│   ├─► Analyze user's top performing posts
│   ├─► Analyze competitor's top posts
│   ├─► Use GPT-4 to generate 10 ideas
│   └─► Each idea includes:
│       - Content type
│       - Specific topic
│       - Hook/angle
│       - Why it will work
└─► Returns: 10 personalized content ideas

┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: Competitor Tracking                              │
└─────────────────────────────────────────────────────────────┘

STEP 8: Add Competitor
├─► Endpoint: POST /api/platforms/instagram/competitors
├─► Input: { username }
├─► Process:
│   ├─► Use Instagram Business Discovery API
│   ├─► Fetch competitor data:
│   │   - followers_count, follows_count, media_count
│   │   - Recent posts for engagement calculation
│   │   - avg_likes, avg_comments, avg_engagement_rate
│   ├─► Create InstagramCompetitor record
│   └─► Return competitor data
└─► Note: Both user and competitor need Business/Creator accounts

STEP 9: Compare Accounts
├─► Endpoint: GET /api/platforms/instagram/compare/<connection_id>
├─► Process:
│   ├─► Get user's metrics
│   ├─► Get all competitors' metrics
│   └─► Return comparison data
└─► Frontend displays bar charts comparing:
    ├─► Followers
    ├─► Engagement rate
    └─► Post count
```

---

## 5️⃣ CONTENT LIBRARY FLOW

### Save, Search, and Manage Content

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Save Content to Library                           │
│ Trigger: User clicks "Save to Library" button             │
│ Endpoint: POST /api/content/<content_id>/save            │
│ - Mark content as saved (is_saved = true)                │
│ - Add to user's library                                   │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: View Library                                      │
│ Page: frontend/src/pages/ContentLibrary.jsx              │
│ Endpoint: GET /api/content/library                       │
│ - Fetch all saved content for user                       │
│ - Filter by: platform, content_type, date               │
│ - Search by: keywords in content                         │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Search & Filter                                   │
│ Frontend:                                                  │
│ - Search input (real-time filtering)                     │
│ - Platform filter (All, LinkedIn, Instagram, etc.)       │
│ - Type filter (Post, Caption, Thread, etc.)              │
│ - Date range filter                                       │
│ Backend:                                                   │
│ - SQL queries with WHERE clauses                          │
│ - LIKE operator for text search                          │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Content Actions                                   │
│ - View full content                                       │
│ - Copy to clipboard                                       │
│ - Edit content                                            │
│ - Delete from library                                     │
│ - Add to favorites                                        │
│ - Export (CSV, JSON)                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 6️⃣ ANALYTICS FLOW

### Content Performance Tracking

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Track Content Usage                               │
│ - Every content generation increments usage_count         │
│ - Track: created_at, last_used_at                        │
│ - Store: platform, content_type, tone                    │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Analytics Dashboard                               │
│ Page: frontend/src/pages/Analytics.jsx                   │
│ Endpoint: GET /api/analytics/overview                    │
│ Metrics:                                                   │
│ - Total content generated                                 │
│ - Content by platform                                     │
│ - Content by type                                         │
│ - Usage trends (daily/weekly/monthly)                    │
│ - Most used tones                                         │
│ - Saved vs generated ratio                               │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Visualizations                                    │
│ Charts (using Recharts):                                  │
│ - Line chart: Content generation over time               │
│ - Bar chart: Content by platform                         │
│ - Pie chart: Content type distribution                   │
│ - Area chart: Usage trends                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 7️⃣ TEAM COLLABORATION FLOW

### Multi-User Workspace Management

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Create Team                                       │
│ Endpoint: POST /api/team/create                          │
│ Input: { name, description }                             │
│ - Create Team record                                      │
│ - Add creator as owner (role: 'owner')                   │
│ - Generate team_id                                        │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Invite Members                                    │
│ Endpoint: POST /api/team/<team_id>/invite               │
│ Input: { email, role }                                   │
│ Roles: owner, admin, member, viewer                      │
│ - Create TeamMember record                                │
│ - Send invitation email (optional)                       │
│ - Set status: 'pending'                                  │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Accept Invitation                                │
│ - User receives email/notification                        │
│ - Clicks accept link                                      │
│ - Status changes to 'active'                             │
│ - User gains access to team workspace                    │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Team Content Sharing                             │
│ - Content can be marked as 'team_shared'                 │
│ - All team members can view shared content               │
│ - Permissions based on role:                             │
│   * Owner/Admin: Full access                             │
│   * Member: Create, edit own, view all                   │
│   * Viewer: View only                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 8️⃣ LINKOGENEI FLOW

### LinkedIn Post Extraction via Chrome Extension

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Chrome Extension Activation                       │
│ File: extension/content.js                                │
│ - Detects LinkedIn post page                             │
│ - Injects extraction UI                                   │
│ - Shows "Extract with ContentGenie" button               │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Extract Post Data                                │
│ - Parse LinkedIn DOM                                      │
│ - Extract:                                                │
│   * Post text content                                     │
│   * Author name                                           │
│   * Engagement metrics (likes, comments, shares)         │
│   * Post URL                                             │
│   * Images (if any)                                      │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Send to Backend                                  │
│ Endpoint: POST /api/linkogenei/extract                   │
│ - Extension sends extracted data                          │
│ - Backend validates and stores                           │
│ - Creates LinkoGeneiPost record in MongoDB              │
└────┬────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: View in Dashboard                                │
│ Page: frontend/src/pages/LinkoGenei.jsx                 │
│ - Display extracted posts                                │
│ - Show engagement metrics                                │
│ - Options:                                               │
│   * Analyze post                                         │
│   * Generate similar content                             │
│   * Save to library                                      │
└─────────────────────────────────────────────────────────────┘
```
