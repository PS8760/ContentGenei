# ContentGenie - Design Documentation

## Project Overview

**Project Name:** ContentGenie  
**Version:** 1.0.0  
**Last Updated:** February 6, 2026  
**Document Type:** System Design Document (SDD)

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Design](#2-database-design)
3. [API Design](#3-api-design)
4. [Frontend Design](#4-frontend-design)
5. [UI/UX Design](#5-uiux-design)
6. [Security Design](#6-security-design)
7. [Performance Design](#7-performance-design)
8. [Deployment Architecture](#8-deployment-architecture)

---

## 1. System Architecture

### 1.1 High-Level Architecture


```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React 18 Single Page Application (SPA)             │  │
│  │  - Component-based architecture                      │  │
│  │  - React Router for navigation                       │  │
│  │  - Context API for state management                  │  │
│  │  - TailwindCSS for styling                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Flask REST API                                      │  │
│  │  - Blueprint-based routing                           │  │
│  │  - JWT authentication middleware                     │  │
│  │  - Request validation                                │  │
│  │  - Error handling                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services                                            │  │
│  │  - AI Service (Content Generation)                   │  │
│  │  - OCR Service (Text Extraction)                     │  │
│  │  - Analytics Service (Metrics Processing)            │  │
│  │  - Firebase Service (Authentication)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SQLAlchemy ORM                                      │  │
│  │  - Models (User, Content, Analytics, Team, Chat)    │  │
│  │  - Database migrations                               │  │
│  │  - Query optimization                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SQLite (Development) / PostgreSQL (Production)      │  │
│  │  - Relational data storage                           │  │
│  │  - ACID compliance                                   │  │
│  │  - Indexing for performance                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - Groq AI API (Content Generation)                  │  │
│  │  - Firebase Auth (User Authentication)               │  │
│  │  - AWS S3 (File Storage - Future)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Component Interaction Flow

**Content Generation Flow:**
```
User Input → React Component → API Service → Flask Route
          → AI Service → Groq API → Response
          → Database Save → Update UI
```

**Authentication Flow:**
```
User Credentials → Firebase Auth → ID Token
                → Backend Verification → JWT Token
                → Store in localStorage → API Requests
```

**Team Chat Flow:**
```
Message Send → Backend API → Database Save
            → Polling (3s) → Fetch New Messages
            → Update Chat UI → Auto-scroll
```

---

## 2. Database Design

### 2.1 Entity Relationship Diagram (ERD)

```
┌─────────────┐         ┌──────────────────┐
│    User     │1      *│  ContentItem     │
│─────────────│◄────────│──────────────────│
│ id (PK)     │         │ id (PK)          │
│ firebase_uid│         │ user_id (FK)     │
│ email       │         │ title            │
│ display_name│         │ content          │
│ is_premium  │         │ content_type     │
│ created_at  │         │ tone             │
└─────────────┘         │ word_count       │
      │                 │ status           │
      │                 │ created_at       │
      │                 └──────────────────┘
      │                         │
      │                         │1
      │                         │
      │                         │*
      │                 ┌──────────────────┐
      │                 │   Analytics      │
      │                 │──────────────────│
      │                 │ id (PK)          │
      │                 │ user_id (FK)     │
      │                 │ content_id (FK)  │
      │                 │ metric_type      │
      │                 │ metric_value     │
      │                 │ platform         │
      │                 │ date             │
      │                 └──────────────────┘
      │
      │1
      │
      │*
┌─────────────┐
│ TeamMember  │
│─────────────│
│ id (PK)     │
│ owner_id(FK)│
│ member_id   │
│ member_email│
│ status      │
│ role        │
└─────────────┘
      │
      │1
      │
      │*
┌─────────────┐
│  TeamChat   │
│─────────────│
│ id (PK)     │
│ sender_id   │
│ receiver_id │
│ message     │
│ is_read     │
│ created_at  │
└─────────────┘
```

### 2.2 Database Tables

#### Table: users
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    photo_url VARCHAR(500),
    provider VARCHAR(50) DEFAULT 'email',
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    content_generated_count INTEGER DEFAULT 0,
    monthly_content_limit INTEGER DEFAULT 500,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    INDEX idx_email (email),
    INDEX idx_firebase_uid (firebase_uid)
);
```

#### Table: content_items
```sql
CREATE TABLE content_items (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    tone VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,
    tags TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    is_favorite BOOLEAN DEFAULT FALSE,
    ai_model_used VARCHAR(50),
    generation_time FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

#### Table: analytics
```sql
CREATE TABLE analytics (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    content_item_id VARCHAR(36),
    metric_type VARCHAR(50) NOT NULL,
    metric_value FLOAT DEFAULT 0,
    platform VARCHAR(50),
    source VARCHAR(100),
    date DATE NOT NULL,
    hour INTEGER,
    extra_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_item_id) REFERENCES content_items(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_content_id (content_item_id),
    INDEX idx_date (date)
);
```

#### Table: team_members
```sql
CREATE TABLE team_members (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    member_email VARCHAR(120) NOT NULL,
    member_id VARCHAR(36),
    role VARCHAR(20) DEFAULT 'member',
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_owner_id (owner_id),
    INDEX idx_member_id (member_id),
    INDEX idx_member_email (member_email)
);
```

#### Table: team_projects
```sql
CREATE TABLE team_projects (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    members TEXT,
    content_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner_id (owner_id)
);
```

#### Table: collaboration_requests
```sql
CREATE TABLE collaboration_requests (
    id VARCHAR(36) PRIMARY KEY,
    from_user_id VARCHAR(36) NOT NULL,
    to_email VARCHAR(120) NOT NULL,
    to_user_id VARCHAR(36),
    message TEXT,
    request_type VARCHAR(20) DEFAULT 'join_team',
    project_id VARCHAR(36),
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES team_projects(id) ON DELETE SET NULL,
    INDEX idx_from_user (from_user_id),
    INDEX idx_to_email (to_email),
    INDEX idx_to_user (to_user_id)
);
```

#### Table: team_chats
```sql
CREATE TABLE team_chats (
    id VARCHAR(36) PRIMARY KEY,
    sender_id VARCHAR(36) NOT NULL,
    receiver_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_created_at (created_at)
);
```

### 2.3 Database Indexes

**Performance Optimization:**
- Primary keys on all tables (automatic index)
- Foreign keys indexed for JOIN operations
- Email fields indexed for authentication lookups
- Date fields indexed for analytics queries
- User ID fields indexed for user-specific queries

---

## 3. API Design

### 3.1 RESTful API Principles

**Base URL:** `https://api.contentgenie.com/api`

**HTTP Methods:**
- GET: Retrieve resources
- POST: Create resources
- PUT: Update resources
- DELETE: Delete resources

**Response Format:**
```json
{
  "success": true|false,
  "data": {},
  "error": "error message",
  "message": "success message"
}
```

**Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

### 3.2 Authentication Flow

**Step 1: Firebase Authentication**
```
POST /api/auth/verify-token
Headers: None
Body: {
  "idToken": "firebase_id_token"
}
Response: {
  "success": true,
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": { user_object }
}
```

**Step 2: Authenticated Requests**
```
GET /api/content
Headers: {
  "Authorization": "Bearer jwt_token"
}
```

### 3.3 API Endpoints Specification

#### Content Generation
```
POST /api/content/generate
Headers: Authorization: Bearer {token}
Body: {
  "prompt": "string (required, max 5000 chars)",
  "type": "article|social-post|email|blog|caption|script|ad-copy",
  "tone": "professional|casual|friendly|formal|creative|persuasive|informative|conversational",
  "skip_save": boolean (optional, default: false)
}
Response: {
  "success": true,
  "content": "generated content",
  "word_count": 500,
  "generation_time": 3.5
}
```

#### Content CRUD
```
GET /api/content
Headers: Authorization: Bearer {token}
Query Params: ?page=1&limit=20&status=draft&type=article
Response: {
  "success": true,
  "content": [array of content items],
  "total": 100,
  "page": 1,
  "pages": 5
}

POST /api/content
Headers: Authorization: Bearer {token}
Body: {
  "title": "string",
  "content": "string",
  "content_type": "string",
  "tone": "string",
  "status": "draft|published|archived"
}

PUT /api/content/:id
Headers: Authorization: Bearer {token}
Body: { fields to update }

DELETE /api/content/:id
Headers: Authorization: Bearer {token}
```

#### Team Collaboration
```
POST /api/team/members/invite
Headers: Authorization: Bearer {token}
Body: {
  "email": "member@example.com"
}

GET /api/team/requests
Headers: Authorization: Bearer {token}
Response: {
  "success": true,
  "requests": [array of pending requests]
}

POST /api/team/requests/:id/accept
Headers: Authorization: Bearer {token}

POST /api/team/chat/:userId
Headers: Authorization: Bearer {token}
Body: {
  "message": "string"
}

GET /api/team/chat/:userId
Headers: Authorization: Bearer {token}
Response: {
  "success": true,
  "messages": [array of messages],
  "other_user": { user_object }
}
```

---

## 4. Frontend Design

### 4.1 Component Architecture

```
src/
├── components/
│   ├── Header.jsx              # Navigation header
│   ├── Footer.jsx              # Page footer
│   ├── ThemeToggle.jsx         # Dark/light mode toggle
│   ├── ProtectedRoute.jsx      # Auth guard
│   ├── ErrorBoundary.jsx       # Error handling
│   ├── ParticlesBackground.jsx # Animated background
│   └── FloatingEmojis.jsx      # Decorative animations
├── pages/
│   ├── LandingPage.jsx         # Public homepage
│   ├── Login.jsx               # Login page
│   ├── SignIn.jsx              # Sign up page
│   ├── Dashboard.jsx           # Main dashboard
│   ├── Creator.jsx             # Content creation
│   ├── ContentLibrary.jsx      # Content management
│   ├── Analytics.jsx           # Analytics dashboard
│   ├── ContentOptimizer.jsx    # Content optimization
│   ├── SocialScheduler.jsx     # Post scheduling
│   └── TeamCollaboration.jsx   # Team features
├── contexts/
│   ├── AuthContext.jsx         # Authentication state
│   └── ThemeContext.jsx        # Theme state
├── services/
│   └── api.js                  # API client
└── config/
    └── firebase.js             # Firebase config
```

### 4.2 State Management

**Context API Structure:**
```javascript
// AuthContext
{
  currentUser: FirebaseUser,
  backendUser: User,
  login: (email, password) => Promise,
  signup: (email, password, name) => Promise,
  logout: () => Promise,
  signInWithGoogle: () => Promise
}

// ThemeContext
{
  theme: 'light' | 'dark',
  toggleTheme: () => void
}
```

### 4.3 Routing Structure

```javascript
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<SignIn />} />
  
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/creator" element={<Creator />} />
    <Route path="/library" element={<ContentLibrary />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/optimizer" element={<ContentOptimizer />} />
    <Route path="/scheduler" element={<SocialScheduler />} />
    <Route path="/team" element={<TeamCollaboration />} />
  </Route>
</Routes>
```

---

## 5. UI/UX Design

### 5.1 Design System

**Color Palette:**
```css
/* Light Theme */
--primary: #3B82F6 (Blue)
--secondary: #8B5CF6 (Purple)
--success: #10B981 (Green)
--warning: #F59E0B (Orange)
--error: #EF4444 (Red)
--background: #FFFFFF
--surface: #F9FAFB
--text-primary: #111827
--text-secondary: #6B7280

/* Dark Theme */
--primary: #60A5FA
--secondary: #A78BFA
--success: #34D399
--warning: #FBBF24
--error: #F87171
--background: #111827
--surface: #1F2937
--text-primary: #F9FAFB
--text-secondary: #D1D5DB
```

**Typography:**
```css
--font-family: 'Inter', system-ui, sans-serif
--font-size-xs: 0.75rem (12px)
--font-size-sm: 0.875rem (14px)
--font-size-base: 1rem (16px)
--font-size-lg: 1.125rem (18px)
--font-size-xl: 1.25rem (20px)
--font-size-2xl: 1.5rem (24px)
--font-size-3xl: 1.875rem (30px)
--font-size-4xl: 2.25rem (36px)
```

**Spacing:**
```css
--spacing-1: 0.25rem (4px)
--spacing-2: 0.5rem (8px)
--spacing-3: 0.75rem (12px)
--spacing-4: 1rem (16px)
--spacing-6: 1.5rem (24px)
--spacing-8: 2rem (32px)
--spacing-12: 3rem (48px)
```

**Border Radius:**
```css
--radius-sm: 0.375rem (6px)
--radius-md: 0.5rem (8px)
--radius-lg: 0.75rem (12px)
--radius-xl: 1rem (16px)
--radius-2xl: 1.5rem (24px)
--radius-full: 9999px
```

### 5.2 Component Patterns

**Glass Card:**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

**Button Styles:**
```css
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}
```

**Form Input:**
```css
.form-input {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

### 5.3 Responsive Breakpoints

```css
/* Mobile First Approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### 5.4 Animation Guidelines

**Page Transitions:**
```javascript
// GSAP Timeline
gsap.timeline()
  .fromTo(element, 
    { y: 50, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
  )
```

**Hover Effects:**
- Scale: 1.05
- Duration: 0.3s
- Easing: ease-in-out

**Loading States:**
- Spinner for API calls
- Skeleton screens for content
- Progress bars for uploads

---

## 6. Security Design

### 6.1 Authentication Security

**JWT Token Structure:**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "exp": 1234567890,
    "iat": 1234567890
  },
  "signature": "..."
}
```

**Token Expiry:**
- Access Token: 24 hours
- Refresh Token: 30 days
- Session Token: Until logout

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 6.2 API Security

**Rate Limiting:**
```python
@limiter.limit("100 per minute")
def api_endpoint():
    pass
```

**Input Validation:**
```python
from flask import request
from marshmallow import Schema, fields, validate

class ContentSchema(Schema):
    prompt = fields.Str(required=True, validate=validate.Length(max=5000))
    type = fields.Str(required=True, validate=validate.OneOf([...]))
    tone = fields.Str(required=True, validate=validate.OneOf([...]))
```

**SQL Injection Prevention:**
```python
# Use parameterized queries
user = User.query.filter_by(email=email).first()

# Never use string concatenation
# BAD: f"SELECT * FROM users WHERE email = '{email}'"
```

### 6.3 Data Protection

**Encryption:**
- HTTPS for all communications (TLS 1.3)
- Password hashing with bcrypt (cost factor: 12)
- JWT signing with HS256 algorithm

**CORS Configuration:**
```python
CORS(app, origins=[
    "http://localhost:3000",
    "https://contentgenie.com"
])
```

---

## 7. Performance Design

### 7.1 Frontend Optimization

**Code Splitting:**
```javascript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Creator = lazy(() => import('./pages/Creator'))
```

**Asset Optimization:**
- Image compression (WebP format)
- Minified CSS and JavaScript
- Gzip compression
- CDN for static assets

**Caching Strategy:**
```javascript
// Service Worker for offline support
// Cache API responses
// localStorage for user preferences
```

### 7.2 Backend Optimization

**Database Query Optimization:**
```python
# Use eager loading to prevent N+1 queries
content = Content.query.options(
    joinedload(Content.analytics)
).filter_by(user_id=user_id).all()

# Use pagination
content = Content.query.paginate(page=1, per_page=20)

# Use indexes on frequently queried columns
```

**Caching:**
```python
# Redis for session storage
# Cache frequently accessed data
# Cache AI responses (future)
```

### 7.3 AI Service Optimization

**Request Batching:**
- Batch multiple requests when possible
- Use streaming for long responses

**Token Management:**
- Track token usage per request
- Optimize prompts for efficiency
- Cache common responses

---

## 8. Deployment Architecture

### 8.1 Development Environment

```
Local Machine
├── Frontend: npm run dev (Port 3000)
├── Backend: python app.py (Port 5000)
└── Database: SQLite (local file)
```

### 8.2 Production Environment

```
┌─────────────────────────────────────────┐
│         Load Balancer (Nginx)           │
└─────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌───────▼────────┐
│  Frontend      │  │  Backend       │
│  (Vercel)      │  │  (AWS EC2)     │
│  - React App   │  │  - Flask API   │
│  - CDN         │  │  - Gunicorn    │
└────────────────┘  └────────┬───────┘
                             │
                    ┌────────▼────────┐
                    │   Database      │
                    │   (AWS RDS)     │
                    │   PostgreSQL    │
                    └─────────────────┘
```

### 8.3 CI/CD Pipeline

```
GitHub Push
    ↓
GitHub Actions
    ↓
Run Tests
    ↓
Build Application
    ↓
Deploy to Staging
    ↓
Manual Approval
    ↓
Deploy to Production
```

### 8.4 Monitoring & Logging

**Tools:**
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for user analytics
- AWS CloudWatch for infrastructure monitoring

**Metrics to Track:**
- API response times
- Error rates
- User engagement
- System resource usage
- Database query performance

---

## Appendix A: Design Patterns Used

### Creational Patterns
- **Singleton:** API service instance
- **Factory:** Component creation

### Structural Patterns
- **Decorator:** Higher-order components
- **Facade:** API service wrapper

### Behavioral Patterns
- **Observer:** React Context API
- **Strategy:** Different content generation strategies

---

## Appendix B: Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 | UI framework |
| Styling | TailwindCSS | Utility-first CSS |
| Routing | React Router | Client-side routing |
| Animation | GSAP | Smooth animations |
| Backend | Flask | REST API |
| ORM | SQLAlchemy | Database abstraction |
| Auth | Firebase + JWT | Authentication |
| AI | Groq API | Content generation |
| OCR | EasyOCR | Text extraction |
| Database | PostgreSQL | Data storage |
| Hosting | Vercel + AWS | Cloud deployment |

---

**Document Status:** Approved  
**Next Review Date:** 2026-03-06  
**Owner:** Engineering Team  
**Stakeholders:** Product Team, Design Team, DevOps Team
