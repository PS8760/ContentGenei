# GeneiLink - Social Media Aggregation Feature

## Overview
GeneiLink is a feature that enables users to aggregate and view their posts from multiple social media platforms (X/Twitter, Instagram, Facebook, LinkedIn) directly on their ContentGenie dashboard. This feature uses OAuth 2.0 authentication to securely connect to various platforms and fetch user content.

## Problem Statement
Content creators manage multiple social media accounts across different platforms. Currently, they need to visit each platform separately to view their posts, track engagement, and manage content. This creates inefficiency and makes it difficult to get a unified view of their content strategy across platforms.

## Solution
GeneiLink provides a centralized dashboard where users can:
- Connect their social media accounts via OAuth 2.0
- View aggregated posts from all connected platforms
- See engagement metrics in one place
- Manage platform connections (add/remove accounts)
- Store platform URLs and access tokens securely

## User Stories

### US-1: Connect Social Media Account
**As a** content creator  
**I want to** connect my social media accounts to ContentGenie  
**So that** I can view all my posts in one centralized dashboard

**Acceptance Criteria:**
- User can initiate OAuth flow for supported platforms (X, Instagram, Facebook, LinkedIn)
- System generates and validates OAuth tokens
- Connected accounts are displayed in the GeneiLink dashboard
- User receives confirmation when account is successfully connected
- Error messages are clear if connection fails

### US-2: View Aggregated Posts
**As a** content creator  
**I want to** see all my posts from different platforms in one view  
**So that** I can easily track my content across all channels

**Acceptance Criteria:**
- Dashboard displays posts from all connected platforms
- Posts show platform icon/badge for easy identification
- Posts display key metrics (likes, comments, shares, views)
- Posts are sorted by date (newest first) by default
- User can filter posts by platform
- User can filter posts by category
- User can search posts by content/keywords
- Pagination is implemented for large post volumes (up to 1000 posts per platform)
- User can view posts from multiple accounts of the same platform

### US-3: Manage Platform Connections
**As a** content creator  
**I want to** manage my connected social media accounts  
**So that** I can add new platforms or remove old connections

**Acceptance Criteria:**
- User can view all connected platforms with connection status
- User can connect multiple accounts per platform (e.g., 2 Instagram accounts)
- User can disconnect/remove a platform connection
- User can reconnect expired or invalid tokens
- System shows last sync time for each platform
- User receives confirmation before disconnecting a platform
- Disconnecting removes stored tokens and URLs securely
- Each connected account is displayed separately with username/handle

### US-4: Secure Token Management
**As a** system administrator  
**I want to** securely store and manage OAuth tokens  
**So that** user data and platform access remain protected

**Acceptance Criteria:**
- OAuth tokens are encrypted before storage
- Tokens are stored per user in the database
- Expired tokens trigger re-authentication flow
- Tokens are never exposed in frontend code or logs
- Token refresh is handled automatically when possible
- Revoked tokens are removed from the database

### US-5: Platform-Specific Data Fetching
**As a** system  
**I want to** fetch posts from each platform using their respective APIs  
**So that** users see accurate and up-to-date content

**Acceptance Criteria:**
- System uses platform-specific API endpoints
- Rate limiting is respected for each platform
- Data is normalized to a common format for display
- Failed API calls are logged and retried
- Users are notified if a platform sync fails
- Sync can be triggered manually by the user
- System fetches up to 1000 posts per connected account

### US-6: Save Posts to Collections
**As a** content creator  
**I want to** save specific posts from any platform to my personal collection  
**So that** I can easily reference and organize important content

**Acceptance Criteria:**
- User can save any post from any connected platform
- Saved posts are stored permanently in the user's account
- User can save posts from any account (their own or others they follow)
- Each saved post retains its original metadata (likes, comments, etc.)
- User can unsave/remove posts from their collection
- Saved posts remain accessible even if the original is deleted
- User can view all saved posts in a dedicated "Saved Posts" section
- Saved posts show which platform and account they came from

### US-7: Categorize and Organize Posts
**As a** content creator  
**I want to** organize my saved posts into custom categories  
**So that** I can easily find and manage content by topic or purpose

**Acceptance Criteria:**
- User can create custom categories (e.g., "Inspiration", "Campaigns", "Best Performers")
- User can assign one or more categories to each saved post
- User can rename or delete categories
- Deleting a category does not delete the posts (posts become uncategorized)
- User can filter saved posts by category
- User can view all posts in a specific category
- Categories are displayed with post counts
- User can add/remove categories from a post at any time
- System provides default categories: "Favorites", "High Engagement", "Inspiration"

## Supported Platforms

### Phase 1 (MVP) - Priority Order
1. **Instagram** - OAuth 2.0 via Facebook Graph API (Instagram Business/Creator accounts)
2. **LinkedIn** - OAuth 2.0
3. **X (Twitter)** - OAuth 2.0 with PKCE

### Phase 2 (Future)
- Facebook
- YouTube
- TikTok
- Pinterest
- Medium

**Note:** Users can connect multiple accounts per platform (e.g., 2 Instagram accounts, 3 LinkedIn profiles)

## Technical Requirements

### Frontend Requirements
- New "GeneiLink" page/section in the dashboard
- OAuth popup/redirect flow implementation
- Platform connection cards with status indicators
- Support for multiple accounts per platform
- Aggregated feed view with filtering and search
- "Save Post" button on each post
- "Saved Posts" collection view
- Category management interface (create, edit, delete categories)
- Category filter and assignment UI
- Drag-and-drop or multi-select for bulk category assignment
- Responsive design for mobile and desktop
- Loading states and error handling

### Backend Requirements
- OAuth 2.0 implementation for each platform
- Support for multiple accounts per platform per user
- Secure token storage with encryption
- API endpoints for:
  - Initiating OAuth flow
  - Handling OAuth callbacks
  - Fetching posts from platforms (up to 1000 per account)
  - Managing platform connections
  - Syncing data
  - Saving posts to user collection
  - Managing categories (CRUD operations)
  - Assigning/removing categories from posts
  - Filtering posts by category
- Database schema for storing:
  - Platform connections (multiple per platform)
  - OAuth tokens (encrypted)
  - Cached posts (up to 1000 per account)
  - Saved posts
  - User-defined categories
  - Post-category relationships
  - Sync metadata
- Background job for periodic syncing
- Rate limiting and error handling

### Security Requirements
- OAuth tokens encrypted at rest
- HTTPS required for all OAuth flows
- CSRF protection for OAuth callbacks
- Token expiration and refresh handling
- Secure storage of client secrets
- User consent before data access
- Compliance with platform API terms of service

### Database Schema

#### Table: `platform_connections`
```sql
- id (primary key)
- user_id (foreign key to users)
- platform_name (enum: 'instagram', 'linkedin', 'twitter', 'facebook')
- platform_user_id (string)
- platform_username (string)
- platform_display_name (string)
- access_token (encrypted text)
- refresh_token (encrypted text, nullable)
- token_expires_at (timestamp, nullable)
- profile_url (string)
- profile_image_url (string, nullable)
- is_active (boolean)
- last_synced_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
- UNIQUE constraint on (user_id, platform_name, platform_user_id)
```

#### Table: `aggregated_posts`
```sql
- id (primary key)
- user_id (foreign key to users)
- connection_id (foreign key to platform_connections)
- platform_name (enum)
- platform_post_id (string)
- content (text)
- media_urls (json array)
- post_url (string)
- published_at (timestamp)
- likes_count (integer)
- comments_count (integer)
- shares_count (integer)
- views_count (integer, nullable)
- is_saved (boolean, default false)
- saved_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)
- UNIQUE constraint on (user_id, platform_name, platform_post_id)
- INDEX on (user_id, is_saved)
- INDEX on (user_id, connection_id)
```

#### Table: `post_categories`
```sql
- id (primary key)
- user_id (foreign key to users)
- name (string, max 50 chars)
- description (text, nullable)
- color (string, hex color code, nullable)
- is_default (boolean, default false)
- post_count (integer, default 0)
- created_at (timestamp)
- updated_at (timestamp)
- UNIQUE constraint on (user_id, name)
```

#### Table: `post_category_assignments`
```sql
- id (primary key)
- post_id (foreign key to aggregated_posts)
- category_id (foreign key to post_categories)
- assigned_at (timestamp)
- UNIQUE constraint on (post_id, category_id)
- INDEX on (post_id)
- INDEX on (category_id)
```

## API Endpoints

### Platform Connection Endpoints
- `POST /api/geneilink/connect/{platform}` - Initiate OAuth flow
- `GET /api/geneilink/callback/{platform}` - Handle OAuth callback
- `GET /api/geneilink/connections` - List all user connections (grouped by platform)
- `DELETE /api/geneilink/connections/{connection_id}` - Disconnect platform account
- `POST /api/geneilink/connections/{connection_id}/sync` - Trigger manual sync

### Posts Endpoints
- `GET /api/geneilink/posts` - Get aggregated posts (with filters: platform, category, saved, search)
- `GET /api/geneilink/posts/{post_id}` - Get specific post details
- `POST /api/geneilink/posts/{post_id}/save` - Save a post to collection
- `DELETE /api/geneilink/posts/{post_id}/save` - Unsave a post
- `GET /api/geneilink/posts/saved` - Get all saved posts
- `POST /api/geneilink/sync-all` - Sync all connected platforms

### Category Endpoints
- `GET /api/geneilink/categories` - List all user categories
- `POST /api/geneilink/categories` - Create new category
- `PUT /api/geneilink/categories/{category_id}` - Update category
- `DELETE /api/geneilink/categories/{category_id}` - Delete category
- `POST /api/geneilink/posts/{post_id}/categories` - Assign categories to post
- `DELETE /api/geneilink/posts/{post_id}/categories/{category_id}` - Remove category from post
- `GET /api/geneilink/categories/{category_id}/posts` - Get all posts in a category

## Non-Functional Requirements

### Performance
- OAuth flow completes within 10 seconds
- Post fetching completes within 5 seconds per platform
- Dashboard loads aggregated posts within 3 seconds
- Support up to 1000 posts per connected account
- Category operations complete within 1 second
- Saved posts load within 2 seconds

### Scalability
- Support multiple platform connections per user (unlimited)
- Support multiple accounts per platform (e.g., 3 Instagram accounts)
- Handle concurrent OAuth flows
- Queue-based background syncing for large datasets
- Efficient category filtering with indexed queries

### Reliability
- 99% uptime for GeneiLink features
- Graceful degradation if a platform API is down
- Automatic retry for failed API calls (with exponential backoff)

### Usability
- Clear instructions for connecting each platform
- Visual feedback during OAuth flow
- Intuitive platform management interface
- Mobile-responsive design

## Constraints and Assumptions

### Constraints
- Must comply with each platform's API terms of service
- Rate limits imposed by each platform must be respected
- Some platforms require app review/approval before production use
- Instagram only supports Business/Creator accounts via Graph API

### Assumptions
- Users have accounts on the platforms they want to connect
- Users understand and consent to data access permissions
- Platform APIs remain stable and available
- OAuth tokens can be refreshed automatically

## Success Metrics
- Number of users connecting at least one platform
- Average number of platforms connected per user
- Average number of accounts connected per platform
- Daily active users viewing GeneiLink dashboard
- Number of posts saved by users
- Average number of categories created per user
- Successful sync rate (% of syncs without errors)
- User satisfaction score for the feature
- Time spent on GeneiLink dashboard

## Dependencies
- OAuth 2.0 libraries (e.g., `authlib` for Python)
- Platform-specific SDKs or API clients
- Encryption library for token storage (e.g., `cryptography`)
- Background job system (e.g., Celery, or simple cron jobs)
- Database with encryption support

## Risks and Mitigations

### Risk 1: Platform API Changes
**Impact:** High  
**Mitigation:** 
- Monitor platform API changelogs
- Implement versioned API calls
- Add comprehensive error logging
- Maintain fallback mechanisms

### Risk 2: Token Expiration/Revocation
**Impact:** Medium  
**Mitigation:**
- Implement automatic token refresh
- Clear user notifications for re-authentication
- Graceful handling of revoked tokens

### Risk 3: Rate Limiting
**Impact:** Medium  
**Mitigation:**
- Implement rate limit tracking per platform
- Queue-based syncing with delays
- Cache posts to reduce API calls
- Inform users of sync frequency limits

### Risk 4: Security Vulnerabilities
**Impact:** High  
**Mitigation:**
- Encrypt all tokens at rest
- Use HTTPS for all communications
- Regular security audits
- Follow OAuth 2.0 best practices
- Implement CSRF protection

## Future Enhancements
- Cross-posting: Create content and post to multiple platforms
- Analytics: Detailed engagement analytics across platforms
- Scheduling: Schedule posts to multiple platforms
- Content recommendations based on cross-platform performance
- Team collaboration on multi-platform content
- Export aggregated data to CSV/PDF

## Timeline Estimate
- **Phase 1 (MVP):** 3-4 weeks
  - Week 1: Database schema, OAuth infrastructure
  - Week 2: Platform integrations (X, LinkedIn)
  - Week 3: Platform integrations (Facebook, Instagram)
  - Week 4: Frontend UI, testing, bug fixes

- **Phase 2 (Enhancements):** 2-3 weeks
  - Additional platforms
  - Advanced filtering and search
  - Performance optimizations

## Open Questions
1. ~~Should we cache posts locally or always fetch fresh data?~~ **ANSWERED: Cache up to 1000 posts per account**
2. What is the desired sync frequency (real-time, hourly, daily)? **PENDING**
3. Do we need webhook support for real-time updates? **PENDING**
4. ~~Should users be able to interact with posts (like, comment) from GeneiLink?~~ **ANSWERED: No, but they can save and categorize**
5. ~~What is the maximum number of posts to display per platform?~~ **ANSWERED: 1000 posts per account**
6. ~~Should we support multiple accounts per platform (e.g., 2 Twitter accounts)?~~ **ANSWERED: Yes, unlimited accounts per platform**
7. Should categories have a maximum limit per user? **PENDING**
8. Can a post belong to multiple categories? **ANSWERED: Yes (many-to-many relationship)**
9. Should we provide category templates or suggestions? **PENDING**
10. Should saved posts be exportable (CSV, PDF)? **PENDING**

## References
- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [LinkedIn API Documentation](https://docs.microsoft.com/en-us/linkedin/)
- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
