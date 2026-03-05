# Social Media Analytics & GeneiBot Specification

## Overview
Complete redesign of Analytics page to provide real-time social media account analysis and growth insights, plus an AI chatbot assistant.

---

## 1. Social Media Analytics Dashboard

### Supported Platforms
- 📷 Instagram
- 💼 LinkedIn  
- 🐦 Twitter/X
- 🎥 YouTube

### Features

#### Account Connection
- User pastes their profile URL
- System validates and extracts username/ID
- Fetches real-time data from platform APIs
- Stores connection for future analysis

#### Analytics Metrics

**Instagram:**
- Followers count
- Following count
- Posts count
- Engagement rate (likes + comments / followers)
- Average likes per post
- Average comments per post
- Best performing posts
- Posting frequency
- Growth recommendations

**LinkedIn:**
- Connections count
- Followers count (if company page)
- Posts count
- Engagement rate
- Profile views (if available)
- Post impressions
- Best performing content types

**Twitter/X:**
- Followers count
- Following count
- Tweets count
- Engagement rate
- Retweets average
- Likes average
- Reply rate
- Tweet frequency

**YouTube:**
- Subscribers count
- Total views
- Videos count
- Average views per video
- Engagement rate (likes + comments / views)
- Upload frequency
- Best performing videos
- Watch time estimates

#### Growth Insights
- Engagement trends
- Best posting times
- Content recommendations
- Competitor comparison
- Growth projections
- Action items

---

## 2. Backend Architecture

### API Routes

```
POST /api/social-analytics/connect
- Connect social media account
- Validate URL
- Fetch initial data

GET /api/social-analytics/accounts
- Get all connected accounts

GET /api/social-analytics/account/:platform/:username
- Get detailed analytics for specific account

POST /api/social-analytics/refresh/:account_id
- Refresh data for account

DELETE /api/social-analytics/disconnect/:account_id
- Disconnect account

GET /api/social-analytics/insights/:account_id
- Get AI-generated growth insights
```

### Data Fetching Strategy

**Option 1: Direct API Calls (Preferred)**
- Use official platform APIs where available
- Requires API keys/tokens
- Most reliable and real-time

**Option 2: Web Scraping (Fallback)**
- For platforms without public APIs
- Use libraries like BeautifulSoup, Playwright
- Less reliable, may break with UI changes

**Option 3: Third-Party Services**
- RapidAPI social media APIs
- Social Blade API
- More expensive but reliable

### Implementation Plan
1. Start with public data (no auth required)
2. Add OAuth for authenticated data later
3. Cache data to reduce API calls
4. Update every 6-24 hours

---

## 3. GeneiBot Chatbot

### Features
- **Floating chat widget** (bottom-right corner)
- **Context-aware responses** about website features
- **Feature discovery** - Helps users explore
- **Guided tours** - Step-by-step walkthroughs
- **FAQ handling** - Common questions
- **Auto-updates** - Learns new features automatically

### Knowledge Base

**Core Features:**
1. Content Generation (Creator page)
2. Dashboard & saved content
3. Analytics (new social media analytics)
4. Team Collaboration
5. LinkoGenei (social media aggregation)
6. Profile management
7. Admin features

**Capabilities:**
- Answer "How do I...?" questions
- Explain features
- Provide tips and best practices
- Guide through workflows
- Troubleshoot common issues

### Implementation

**Technology Stack:**
- Frontend: React component with chat UI
- Backend: AI-powered responses (OpenAI/Groq API)
- Storage: MongoDB for chat history
- Context: System prompt with feature documentation

**Chat UI:**
- Minimized: Floating button with "GeneiBot" label
- Expanded: Chat window (400x600px)
- Theme-aware: Light/dark mode support
- Animations: Smooth transitions

---

## 4. Frontend Components

### New Components

```
frontend/src/components/
├── GeneiBot/
│   ├── ChatWidget.jsx          # Main chat component
│   ├── ChatMessage.jsx          # Individual message
│   ├── ChatInput.jsx            # Input field
│   └── ChatButton.jsx           # Floating button
│
└── SocialAnalytics/
    ├── PlatformSelector.jsx     # Choose platform
    ├── AccountConnector.jsx     # Paste URL form
    ├── AnalyticsDashboard.jsx   # Main dashboard
    ├── MetricsCard.jsx          # Individual metric
    ├── EngagementChart.jsx      # Charts/graphs
    ├── GrowthInsights.jsx       # AI insights
    └── AccountCard.jsx          # Connected account
```

### Updated Pages

```
frontend/src/pages/
└── Analytics.jsx                # Complete redesign
```

---

## 5. Database Schema

### Social Accounts Collection (MongoDB)

```javascript
{
  _id: ObjectId,
  user_id: String,
  platform: String, // 'instagram', 'linkedin', 'twitter', 'youtube'
  username: String,
  profile_url: String,
  connected_at: Date,
  last_updated: Date,
  
  // Cached metrics
  metrics: {
    followers: Number,
    following: Number,
    posts: Number,
    engagement_rate: Number,
    // Platform-specific fields
  },
  
  // Historical data for trends
  history: [{
    date: Date,
    followers: Number,
    engagement_rate: Number
  }]
}
```

### Chat History Collection (MongoDB)

```javascript
{
  _id: ObjectId,
  user_id: String,
  conversation_id: String,
  messages: [{
    role: String, // 'user' or 'assistant'
    content: String,
    timestamp: Date
  }],
  created_at: Date,
  updated_at: Date
}
```

---

## 6. Implementation Timeline

### Phase 1: Backend (Day 1-2)
- [ ] Create social analytics routes
- [ ] Implement data fetching for each platform
- [ ] Set up MongoDB collections
- [ ] Add caching layer
- [ ] Create GeneiBot API endpoint

### Phase 2: Frontend Components (Day 2-3)
- [ ] Build GeneiBot chat widget
- [ ] Create platform selector
- [ ] Build account connector
- [ ] Design metrics cards
- [ ] Implement charts/graphs

### Phase 3: Analytics Dashboard (Day 3-4)
- [ ] Redesign Analytics page
- [ ] Integrate all components
- [ ] Add theme support
- [ ] Implement real-time updates
- [ ] Add loading states

### Phase 4: AI & Insights (Day 4-5)
- [ ] Integrate AI for GeneiBot responses
- [ ] Generate growth insights
- [ ] Add recommendations engine
- [ ] Implement feature discovery

### Phase 5: Testing & Polish (Day 5-6)
- [ ] Test all platforms
- [ ] Fix bugs
- [ ] Optimize performance
- [ ] Add error handling
- [ ] Deploy to production

---

## 7. API Keys Required

### Social Media APIs
- Instagram Graph API (requires Facebook App)
- LinkedIn API (requires LinkedIn App)
- Twitter API v2 (requires Twitter Developer Account)
- YouTube Data API v3 (requires Google Cloud Project)

### AI Service
- OpenAI API (for GeneiBot) OR
- Groq API (faster, cheaper alternative)

### Optional
- RapidAPI subscription (for fallback data)

---

## 8. Environment Variables

```bash
# Social Media APIs
INSTAGRAM_ACCESS_TOKEN=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
TWITTER_BEARER_TOKEN=
YOUTUBE_API_KEY=

# AI Service
OPENAI_API_KEY=  # or GROQ_API_KEY

# Optional
RAPIDAPI_KEY=
```

---

## 9. Security Considerations

- Rate limiting on API endpoints
- Input validation for URLs
- Sanitize user data
- Secure API key storage
- CORS configuration
- Authentication required for all endpoints

---

## 10. Future Enhancements

- OAuth integration for private metrics
- Competitor analysis
- Automated posting suggestions
- Content calendar integration
- A/B testing recommendations
- Influencer discovery
- Hashtag analytics
- Sentiment analysis

---

**Status**: Ready to implement
**Priority**: High
**Estimated Time**: 5-6 days for full implementation
