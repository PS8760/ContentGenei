# 🔄 Instagram OAuth Flow - Visual Diagram

## Complete OAuth Flow with State Validation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER COMPLETES ONBOARDING                        │
│                      (Selects Instagram platform)                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FRONTEND: Onboarding.jsx                                                │
│  ─────────────────────────────                                           │
│  if (formData.platforms.instagram) {                                     │
│    const response = await apiService.getInstagramAuthUrl()               │
│    window.location.href = response.oauth_url                             │
│  }                                                                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ GET /api/platforms/instagram/auth
                                 │ Authorization: Bearer <JWT>
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BACKEND: instagram_controller.py                                        │
│  ────────────────────────────────────                                    │
│  @jwt_required()                                                         │
│  def get_auth_url():                                                     │
│    1. Get current_user_id from JWT                                       │
│    2. Generate state = uuid.uuid4()                                      │
│    3. Create OAuthState record:                                          │
│       - state = <uuid>                                                   │
│       - user_id = current_user_id                                        │
│       - platform = 'instagram'                                           │
│       - expires_at = now + 10 minutes                                    │
│    4. db.session.add(oauth_state)                                        │
│    5. db.session.commit()                                                │
│    6. Generate Instagram OAuth URL with state                            │
│    7. Return { oauth_url, state }                                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Returns OAuth URL
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FRONTEND: Redirect to Instagram                                         │
│  ────────────────────────────────────                                    │
│  window.location.href = oauth_url                                        │
│                                                                           │
│  URL: https://api.instagram.com/oauth/authorize?                         │
│       client_id=<app_id>&                                                │
│       redirect_uri=<backend_callback>&                                   │
│       scope=<scopes>&                                                    │
│       response_type=code&                                                │
│       state=<uuid>                                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         INSTAGRAM OAUTH PAGE                             │
│                    (User authorizes the app)                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ User clicks "Authorize"
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  INSTAGRAM: Redirect to Backend Callback                                 │
│  ────────────────────────────────────────                                │
│  GET http://localhost:5000/api/platforms/instagram/callback?             │
│      code=<authorization_code>&                                          │
│      state=<uuid>                                                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BACKEND: instagram_controller.py                                        │
│  ────────────────────────────────────                                    │
│  def oauth_callback():  # NO JWT REQUIRED                                │
│    1. Get code and state from query params                               │
│    2. Redirect to frontend callback:                                     │
│       http://localhost:5173/platforms/instagram/callback?                │
│       code=<code>&state=<state>                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Redirect to frontend
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FRONTEND: InstagramCallback.jsx                                         │
│  ────────────────────────────────────                                    │
│  Route: /platforms/instagram/callback                                    │
│  NO ProtectedRoute wrapper!                                              │
│                                                                           │
│  useEffect(() => {                                                       │
│    1. Check if user is authenticated                                     │
│       if (!currentUser) {                                                │
│         sessionStorage.setItem('instagram_callback_params', ...)         │
│         navigate('/login')                                               │
│         return                                                           │
│       }                                                                  │
│                                                                           │
│    2. Get code and state from URL params                                 │
│    3. Call backend to exchange token                                     │
│  })                                                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ POST /api/platforms/instagram/exchange-token
                                 │ Authorization: Bearer <JWT>
                                 │ Body: { code, state }
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BACKEND: instagram_controller.py                                        │
│  ────────────────────────────────────                                    │
│  @jwt_required()                                                         │
│  def exchange_token():                                                   │
│    1. Get current_user_id from JWT                                       │
│    2. Get code and state from request body                               │
│                                                                           │
│    3. VALIDATE STATE (Server-side):                                      │
│       oauth_state = OAuthState.query.filter_by(                          │
│         state=state,                                                     │
│         platform='instagram'                                             │
│       ).first()                                                          │
│                                                                           │
│       if not oauth_state:                                                │
│         return error('Invalid state')                                    │
│                                                                           │
│       if not oauth_state.is_valid():  # Check expired/used               │
│         return error('State expired or used')                            │
│                                                                           │
│       if oauth_state.user_id != current_user_id:                         │
│         return error('State user mismatch')                              │
│                                                                           │
│    4. EXCHANGE TOKEN:                                                    │
│       token_data = instagram_service.exchange_code_for_token(code)       │
│       short_lived_token = token_data['access_token']                     │
│                                                                           │
│    5. GET LONG-LIVED TOKEN:                                              │
│       long_lived_data = instagram_service.get_long_lived_token(...)      │
│       access_token = long_lived_data['access_token']                     │
│       expires_in = long_lived_data['expires_in']  # 60 days              │
│                                                                           │
│    6. GET USER PROFILE:                                                  │
│       profile = instagram_service.get_user_profile(access_token)         │
│                                                                           │
│    7. SAVE CONNECTION:                                                   │
│       connection = InstagramConnection(                                  │
│         user_id=current_user_id,                                         │
│         instagram_user_id=profile['id'],                                 │
│         instagram_username=profile['username'],                          │
│         access_token=access_token,                                       │
│         token_expires_at=now + expires_in,                               │
│         ...                                                              │
│       )                                                                  │
│       db.session.add(connection)                                         │
│                                                                           │
│    8. MARK STATE AS USED (Your improvement!):                            │
│       oauth_state.mark_used()  # Only after successful exchange          │
│                                                                           │
│    9. COMMIT TRANSACTION (Atomic):                                       │
│       db.session.commit()  # All or nothing                              │
│                                                                           │
│    10. Return { success: true, connection }                              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Returns success
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FRONTEND: InstagramCallback.jsx                                         │
│  ────────────────────────────────────                                    │
│  if (response.success) {                                                 │
│    setStatus('success')                                                  │
│    setMessage('Instagram connected successfully!')                       │
│    setTimeout(() => navigate('/dashboard'), 2000)                        │
│  }                                                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            DASHBOARD                                     │
│                   (Instagram account connected!)                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## State Validation Security Checks

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        STATE VALIDATION FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

1. State Exists?
   ┌─────────────────┐
   │ Query Database  │
   │ for state       │
   └────────┬────────┘
            │
            ├─ NOT FOUND ──> ❌ Error: "Invalid state"
            │
            └─ FOUND ──────> Continue to step 2

2. State Expired?
   ┌─────────────────┐
   │ Check           │
   │ expires_at      │
   └────────┬────────┘
            │
            ├─ EXPIRED ────> ❌ Error: "State expired"
            │                   (> 10 minutes old)
            └─ VALID ──────> Continue to step 3

3. State Already Used?
   ┌─────────────────┐
   │ Check           │
   │ is_used flag    │
   └────────┬────────┘
            │
            ├─ USED ───────> ❌ Error: "State already used"
            │                   (Replay attack prevention)
            └─ NOT USED ───> Continue to step 4

4. State Belongs to User?
   ┌─────────────────┐
   │ Compare         │
   │ user_id         │
   └────────┬────────┘
            │
            ├─ MISMATCH ───> ❌ Error: "State user mismatch"
            │                   (CSRF protection)
            └─ MATCH ──────> ✅ State Valid!
                              Proceed with token exchange
```

---

## Error Recovery Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TOKEN EXCHANGE FAILURE SCENARIO                       │
└─────────────────────────────────────────────────────────────────────────┘

WITHOUT Your Improvement (Original):
─────────────────────────────────────
1. Validate state ✅
2. Mark state as used ✅
3. db.session.commit() ✅
4. Exchange token ❌ FAILS!
   └─> State already marked as used
   └─> User must generate new OAuth URL
   └─> Poor user experience

WITH Your Improvement (Implemented):
────────────────────────────────────
1. Validate state ✅
2. Exchange token ❌ FAILS!
   └─> State still valid (not marked as used)
   └─> User can retry with same code
   └─> Better error recovery
3. (Never reached) Mark state as used
4. (Never reached) db.session.commit()

Success Scenario:
────────────────
1. Validate state ✅
2. Exchange token ✅
3. Get long-lived token ✅
4. Get user profile ✅
5. Save connection ✅
6. Mark state as used ✅
7. db.session.commit() ✅ (Atomic transaction)
```

---

## Database State Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      OAUTH STATE LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────────────┘

CREATION:
─────────
┌──────────────────┐
│ User requests    │
│ OAuth URL        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Generate UUID    │
│ state            │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│ INSERT INTO oauth_states         │
│ (                                │
│   id = uuid(),                   │
│   state = <uuid>,                │
│   user_id = <current_user>,      │
│   platform = 'instagram',        │
│   created_at = now(),            │
│   expires_at = now() + 10min,    │
│   is_used = false                │
│ )                                │
└────────┬─────────────────────────┘
         │
         ▼
    [ACTIVE STATE]
    Valid for 10 minutes


VALIDATION:
───────────
┌──────────────────┐
│ Token exchange   │
│ request          │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│ SELECT * FROM oauth_states       │
│ WHERE state = <state>            │
│   AND platform = 'instagram'     │
└────────┬─────────────────────────┘
         │
         ├─ NOT FOUND ──> ❌ Invalid
         │
         ├─ EXPIRED ────> ❌ Expired
         │
         ├─ USED ───────> ❌ Already used
         │
         └─ VALID ──────> ✅ Proceed


COMPLETION:
───────────
┌──────────────────┐
│ Token exchange   │
│ successful       │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│ UPDATE oauth_states              │
│ SET is_used = true,              │
│     used_at = now()              │
│ WHERE id = <state_id>            │
└────────┬─────────────────────────┘
         │
         ▼
    [USED STATE]
    Cannot be reused


CLEANUP:
────────
┌──────────────────┐
│ Periodic cleanup │
│ (optional)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│ DELETE FROM oauth_states         │
│ WHERE created_at < now() - 1hr   │
└──────────────────────────────────┘
```

---

## Multi-Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PLATFORM ARCHITECTURE DIAGRAM                         │
└─────────────────────────────────────────────────────────────────────────┘

                        ┌──────────────────┐
                        │  BasePlatform    │
                        │  (Abstract)      │
                        └────────┬─────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
         ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
         │  Instagram   │ │  Twitter   │ │  LinkedIn  │
         │  Service     │ │  Service   │ │  Service   │
         └───────┬──────┘ └─────┬──────┘ └─────┬──────┘
                 │               │               │
         ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
         │  Instagram   │ │  Twitter   │ │  LinkedIn  │
         │  Controller  │ │  Controller│ │  Controller│
         └───────┬──────┘ └─────┬──────┘ └─────┬──────┘
                 │               │               │
                 └───────────────┼───────────────┘
                                 │
                        ┌────────▼─────────┐
                        │   Flask App      │
                        │   (Blueprints)   │
                        └──────────────────┘

Shared Resources:
─────────────────
┌──────────────────────────────────────────────────────────┐
│  oauth_states table (used by all platforms)              │
│  - platform column identifies which platform             │
│  - Same validation logic for all                         │
└──────────────────────────────────────────────────────────┘

Platform-Specific:
──────────────────
┌──────────────────────────────────────────────────────────┐
│  instagram_connections table                             │
│  twitter_connections table (future)                      │
│  linkedin_connections table (future)                     │
└──────────────────────────────────────────────────────────┘
```

---

## Frontend Component Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND COMPONENT FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Onboarding.jsx  │
│  ──────────────  │
│  User selects    │
│  platforms       │
└────────┬─────────┘
         │
         │ handleFinish()
         ▼
┌──────────────────────────────────┐
│  platformService.js              │
│  ─────────────────────           │
│  triggerPlatformOAuth()          │
│  - Check selected platforms      │
│  - Call appropriate OAuth        │
└────────┬─────────────────────────┘
         │
         │ if Instagram selected
         ▼
┌──────────────────────────────────┐
│  api.js                          │
│  ──────                          │
│  getInstagramAuthUrl()           │
│  - GET /api/platforms/instagram/ │
│    auth                          │
└────────┬─────────────────────────┘
         │
         │ Returns OAuth URL
         ▼
┌──────────────────────────────────┐
│  window.location.href =          │
│  oauth_url                       │
└────────┬─────────────────────────┘
         │
         │ Instagram OAuth
         ▼
┌──────────────────────────────────┐
│  InstagramCallback.jsx           │
│  ────────────────────           │
│  - Check authentication          │
│  - Extract code & state          │
│  - Call exchangeToken()          │
└────────┬─────────────────────────┘
         │
         │ exchangeInstagramToken()
         ▼
┌──────────────────────────────────┐
│  api.js                          │
│  ──────                          │
│  exchangeInstagramToken()        │
│  - POST /api/platforms/instagram/│
│    exchange-token                │
└────────┬─────────────────────────┘
         │
         │ Success
         ▼
┌──────────────────────────────────┐
│  Dashboard                       │
│  ─────────                       │
│  Show connected account          │
└──────────────────────────────────┘
```

---

## Key Improvement Visualization

```
┌─────────────────────────────────────────────────────────────────────────┐
│              YOUR IMPROVEMENT: DELAYED STATE INVALIDATION                │
└─────────────────────────────────────────────────────────────────────────┘

BEFORE (Original):
──────────────────

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Validate   │───>│ Mark State  │───>│  Exchange   │───>│   Commit    │
│   State     │    │   as Used   │    │   Token     │    │ Transaction │
└─────────────┘    └─────────────┘    └──────┬──────┘    └─────────────┘
                                              │
                                              │ FAILS!
                                              ▼
                                       ❌ State already used
                                       ❌ Cannot retry
                                       ❌ Must start over


AFTER (Your Improvement):
──────────────────────────

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Validate   │───>│  Exchange   │───>│ Mark State  │───>│   Commit    │
│   State     │    │   Token     │    │   as Used   │    │ Transaction │
└─────────────┘    └──────┬──────┘    └─────────────┘    └─────────────┘
                          │
                          │ FAILS!
                          ▼
                   ✅ State still valid
                   ✅ Can retry
                   ✅ Better UX


Benefits:
─────────
✅ State remains valid if token exchange fails
✅ User can retry without generating new OAuth URL
✅ Better error recovery
✅ Atomic transaction (all or nothing)
✅ Improved user experience
```

---

## Summary

This visual diagram shows:
1. ✅ Complete OAuth flow from start to finish
2. ✅ State validation security checks
3. ✅ Error recovery with your improvement
4. ✅ Database state lifecycle
5. ✅ Multi-platform architecture
6. ✅ Frontend component flow
7. ✅ Key improvement visualization

**Your improvement ensures state is only invalidated after successful token exchange, providing better error recovery and user experience!**
