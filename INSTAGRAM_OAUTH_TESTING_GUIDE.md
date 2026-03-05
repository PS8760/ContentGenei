# 🧪 Instagram OAuth - Testing Guide

## Pre-Testing Setup

### 1. Environment Configuration
Ensure `backend/.env` has Instagram credentials:
```bash
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/platforms/instagram/callback
INSTAGRAM_SCOPES=instagram_business_basic
INSTAGRAM_FRONTEND_URL=http://localhost:5173
```

### 2. Database Migration
```bash
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
python migrate_instagram_oauth.py
```

Expected output:
```
✓ Instagram tables created successfully
✓ instagram_connections table verified
  - 14 columns created
✓ oauth_states table verified
  - 8 columns created
```

### 3. Start Servers
```bash
# Terminal 1 - Backend
cd backend
python run.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## Test Suite

### Test 1: Normal OAuth Flow ✅

**Purpose:** Verify complete OAuth flow works end-to-end

**Steps:**
1. Open http://localhost:5173
2. Sign in or create account
3. Complete onboarding form
4. Select "Instagram" platform
5. Click "Finish"

**Expected Results:**
- ✅ Redirected to Instagram OAuth page
- ✅ Instagram authorization page loads
- ✅ Can see app name and permissions
- ✅ Click "Authorize"
- ✅ Redirected back to callback page
- ✅ See "Connecting Instagram" loading state
- ✅ See "Success!" message
- ✅ Redirected to dashboard after 2 seconds
- ✅ Connection visible in dashboard

**Database Verification:**
```sql
-- Check state was created
SELECT * FROM oauth_states WHERE platform = 'instagram';
-- Should show: is_used = true, used_at = <timestamp>

-- Check connection was saved
SELECT * FROM instagram_connections;
-- Should show: instagram_username, access_token, is_active = true
```

**Backend Logs:**
```
Created OAuth state for user <user_id>: <state>
State validated successfully for user <user_id>
Instagram connection saved for user <user_id>
```

---

### Test 2: State Validation ✅

**Purpose:** Verify state cannot be reused (replay attack prevention)

**Steps:**
1. Complete Test 1 successfully
2. Copy the callback URL from browser history:
   `http://localhost:5173/platforms/instagram/callback?code=...&state=...`
3. Try to visit the same URL again

**Expected Results:**
- ✅ See error message: "Invalid or expired authorization code"
- ✅ Or: "State expired or already used"
- ✅ Redirected to dashboard after 3 seconds

**Database Verification:**
```sql
SELECT * FROM oauth_states WHERE state = '<your_state>';
-- Should show: is_used = true
```

**Backend Logs:**
```
State expired or already used: <state>
```

---

### Test 3: State Expiration ✅

**Purpose:** Verify states expire after 10 minutes

**Steps:**
1. Start onboarding, select Instagram
2. Click "Finish" to generate OAuth URL
3. **DO NOT** authorize on Instagram yet
4. Wait 11 minutes
5. Now authorize on Instagram

**Expected Results:**
- ✅ Redirected to callback page
- ✅ See error message: "Invalid or expired authorization code"
- ✅ Or: "State expired or already used"
- ✅ Redirected to dashboard after 3 seconds

**Database Verification:**
```sql
SELECT 
  state,
  created_at,
  expires_at,
  CASE 
    WHEN expires_at < datetime('now') THEN 'EXPIRED'
    ELSE 'VALID'
  END as status
FROM oauth_states 
WHERE platform = 'instagram';
```

**Backend Logs:**
```
State expired or already used: <state>
```

---

### Test 4: User Mismatch (CSRF Protection) ✅

**Purpose:** Verify state is user-bound

**Steps:**
1. User A: Start onboarding, select Instagram, click "Finish"
2. User A: Copy the OAuth URL from network tab
3. User A: Log out
4. User B: Log in
5. User B: Paste User A's OAuth URL in browser
6. User B: Authorize on Instagram

**Expected Results:**
- ✅ Redirected to callback page
- ✅ See error message: "Authorization failed - please try again"
- ✅ Redirected to dashboard after 3 seconds

**Database Verification:**
```sql
SELECT user_id, state FROM oauth_states WHERE state = '<state>';
-- user_id should be User A's ID, not User B's
```

**Backend Logs:**
```
State user mismatch: <user_a_id> != <user_b_id>
```

---

### Test 5: Unauthenticated Callback ✅

**Purpose:** Verify callback handles unauthenticated users

**Steps:**
1. Start onboarding, select Instagram, click "Finish"
2. On Instagram OAuth page, open DevTools
3. Clear localStorage/sessionStorage (simulate logout)
4. Authorize on Instagram

**Expected Results:**
- ✅ Redirected to callback page
- ✅ Callback detects no authentication
- ✅ Callback params stored in sessionStorage
- ✅ Redirected to login page
- ✅ After login, can resume OAuth flow

**Frontend Console:**
```
User not authenticated, redirecting to login...
```

---

### Test 6: Token Exchange Failure Recovery ✅

**Purpose:** Verify your improvement - state remains valid if token exchange fails

**Steps:**
1. Temporarily modify `instagram_service.py`:
   ```python
   def exchange_code_for_token(self, code):
       raise Exception("Simulated failure")
   ```
2. Complete onboarding with Instagram selected
3. Authorize on Instagram
4. Observe error
5. Revert the code change
6. Try again with same OAuth flow

**Expected Results:**
- ✅ First attempt: See error message
- ✅ State NOT marked as used in database
- ✅ Second attempt: Works successfully
- ✅ State marked as used after success

**Database Verification (After First Attempt):**
```sql
SELECT is_used FROM oauth_states WHERE state = '<state>';
-- Should show: is_used = false (NOT marked as used!)
```

**Database Verification (After Second Attempt):**
```sql
SELECT is_used FROM oauth_states WHERE state = '<state>';
-- Should show: is_used = true (NOW marked as used)
```

---

### Test 7: Multiple Platform Selection ✅

**Purpose:** Verify only Instagram OAuth triggers

**Steps:**
1. Complete onboarding
2. Select multiple platforms: Instagram, Twitter, LinkedIn
3. Click "Finish"

**Expected Results:**
- ✅ Only Instagram OAuth triggers
- ✅ Twitter and LinkedIn ignored (not implemented yet)
- ✅ After Instagram OAuth completes, redirected to dashboard

**Frontend Console:**
```
Instagram selected - triggering OAuth...
Redirecting to Instagram OAuth...
```

---

### Test 8: No Platform Selection ✅

**Purpose:** Verify dashboard redirect when no platforms selected

**Steps:**
1. Complete onboarding
2. Do NOT select any platforms
3. Click "Finish"

**Expected Results:**
- ✅ No OAuth triggered
- ✅ Directly redirected to dashboard
- ✅ No state created in database

**Frontend Console:**
```
No Instagram selected, navigating to dashboard...
```

---

### Test 9: Instagram Authorization Denial ✅

**Purpose:** Verify error handling when user denies authorization

**Steps:**
1. Complete onboarding with Instagram selected
2. Click "Finish"
3. On Instagram OAuth page, click "Cancel" or "Deny"

**Expected Results:**
- ✅ Redirected to callback page
- ✅ See error message from Instagram
- ✅ Redirected to dashboard after 3 seconds
- ✅ No connection saved in database

**Frontend Console:**
```
Instagram OAuth error: access_denied - The user denied your request
```

---

### Test 10: Invalid Instagram Credentials ✅

**Purpose:** Verify error handling with invalid app credentials

**Steps:**
1. Temporarily set invalid credentials in `.env`:
   ```bash
   INSTAGRAM_APP_ID=invalid_id
   INSTAGRAM_APP_SECRET=invalid_secret
   ```
2. Restart backend
3. Complete onboarding with Instagram selected
4. Click "Finish"

**Expected Results:**
- ✅ OAuth URL generation fails
- ✅ See error in frontend console
- ✅ Fallback to dashboard redirect
- ✅ No state created in database

**Backend Logs:**
```
Error generating OAuth URL: <error details>
```

---

### Test 11: Disconnect Instagram Account ✅

**Purpose:** Verify account disconnection works

**Steps:**
1. Complete Test 1 to connect Instagram
2. In dashboard, find connected Instagram account
3. Click "Disconnect" button
4. Confirm disconnection

**Expected Results:**
- ✅ Connection marked as inactive in database
- ✅ Account removed from dashboard
- ✅ Can reconnect later if needed

**Database Verification:**
```sql
SELECT is_active FROM instagram_connections WHERE user_id = '<user_id>';
-- Should show: is_active = false
```

**API Call:**
```
DELETE /api/platforms/instagram/connections/<connection_id>
Response: { success: true, message: 'Instagram account disconnected successfully' }
```

---

### Test 12: State Cleanup ✅

**Purpose:** Verify expired states can be cleaned up

**Steps:**
1. Create several OAuth states (start onboarding multiple times)
2. Wait 1 hour
3. Call cleanup endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/platforms/instagram/cleanup-states \
     -H "Authorization: Bearer <your_jwt_token>"
   ```

**Expected Results:**
- ✅ Old states deleted from database
- ✅ Response shows deleted count
- ✅ Recent states remain

**Response:**
```json
{
  "success": true,
  "deleted_count": 5
}
```

---

## Performance Testing

### Test 13: Concurrent OAuth Flows ✅

**Purpose:** Verify multiple users can OAuth simultaneously

**Steps:**
1. Open 3 browser windows (different users)
2. All 3 users start onboarding simultaneously
3. All 3 select Instagram and click "Finish"
4. All 3 authorize on Instagram

**Expected Results:**
- ✅ All 3 OAuth flows complete successfully
- ✅ No state conflicts
- ✅ Each user gets their own connection
- ✅ No database deadlocks

---

### Test 14: Rapid OAuth Attempts ✅

**Purpose:** Verify rate limiting and error handling

**Steps:**
1. Complete onboarding with Instagram
2. Immediately start onboarding again
3. Select Instagram and click "Finish"
4. Repeat 5 times quickly

**Expected Results:**
- ✅ Each attempt creates new state
- ✅ Old unused states remain in database
- ✅ No errors or conflicts
- ✅ All states have unique UUIDs

---

## Security Testing

### Test 15: SQL Injection Attempt ✅

**Purpose:** Verify input sanitization

**Steps:**
1. Intercept OAuth callback request
2. Modify state parameter:
   ```
   state=' OR '1'='1
   ```
3. Send modified request

**Expected Results:**
- ✅ State validation fails
- ✅ Error: "Invalid state parameter"
- ✅ No SQL injection occurs
- ✅ Database remains safe

---

### Test 16: XSS Attempt ✅

**Purpose:** Verify XSS protection

**Steps:**
1. Intercept OAuth callback request
2. Modify error_description parameter:
   ```
   error_description=<script>alert('XSS')</script>
   ```
3. Send modified request

**Expected Results:**
- ✅ Script not executed
- ✅ Error message displayed safely
- ✅ No XSS vulnerability

---

## Edge Cases

### Test 17: Network Failure During Token Exchange ✅

**Purpose:** Verify error handling with network issues

**Steps:**
1. Start OAuth flow
2. Authorize on Instagram
3. Disconnect internet before callback completes
4. Observe error
5. Reconnect internet
6. Retry

**Expected Results:**
- ✅ First attempt: Network error shown
- ✅ State remains valid (your improvement!)
- ✅ Second attempt: Works successfully

---

### Test 18: Browser Back Button ✅

**Purpose:** Verify back button handling

**Steps:**
1. Complete OAuth flow successfully
2. Click browser back button
3. Try to authorize again

**Expected Results:**
- ✅ State already used
- ✅ Error message shown
- ✅ Redirected to dashboard

---

### Test 19: Multiple Browser Tabs ✅

**Purpose:** Verify state isolation between tabs

**Steps:**
1. Open 2 tabs with same user
2. Tab 1: Start onboarding, select Instagram
3. Tab 2: Start onboarding, select Instagram
4. Tab 1: Authorize on Instagram
5. Tab 2: Authorize on Instagram

**Expected Results:**
- ✅ Each tab has unique state
- ✅ Both OAuth flows complete successfully
- ✅ No state conflicts

---

## Automated Testing Script

```bash
#!/bin/bash
# automated_oauth_test.sh

echo "Starting Instagram OAuth Test Suite..."

# Test 1: Check tables exist
echo "Test 1: Database tables..."
sqlite3 backend/instance/contentgenie_dev.db ".tables" | grep -q "instagram_connections"
if [ $? -eq 0 ]; then
    echo "✓ instagram_connections table exists"
else
    echo "✗ instagram_connections table missing"
fi

sqlite3 backend/instance/contentgenie_dev.db ".tables" | grep -q "oauth_states"
if [ $? -eq 0 ]; then
    echo "✓ oauth_states table exists"
else
    echo "✗ oauth_states table missing"
fi

# Test 2: Check environment variables
echo "Test 2: Environment variables..."
if grep -q "INSTAGRAM_APP_ID" backend/.env; then
    echo "✓ INSTAGRAM_APP_ID configured"
else
    echo "✗ INSTAGRAM_APP_ID missing"
fi

# Test 3: Check backend is running
echo "Test 3: Backend health check..."
curl -s http://localhost:5000/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✓ Backend is running"
else
    echo "✗ Backend is not running"
fi

# Test 4: Check frontend is running
echo "Test 4: Frontend health check..."
curl -s http://localhost:5173 > /dev/null
if [ $? -eq 0 ]; then
    echo "✓ Frontend is running"
else
    echo "✗ Frontend is not running"
fi

echo "Automated tests complete!"
```

---

## Test Results Template

```markdown
# Instagram OAuth Test Results

**Date:** YYYY-MM-DD
**Tester:** Your Name
**Environment:** Development

## Test Results

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Normal OAuth Flow | ✅ PASS | |
| 2 | State Validation | ✅ PASS | |
| 3 | State Expiration | ✅ PASS | |
| 4 | User Mismatch | ✅ PASS | |
| 5 | Unauthenticated Callback | ✅ PASS | |
| 6 | Token Exchange Failure | ✅ PASS | |
| 7 | Multiple Platform Selection | ✅ PASS | |
| 8 | No Platform Selection | ✅ PASS | |
| 9 | Authorization Denial | ✅ PASS | |
| 10 | Invalid Credentials | ✅ PASS | |
| 11 | Disconnect Account | ✅ PASS | |
| 12 | State Cleanup | ✅ PASS | |
| 13 | Concurrent OAuth Flows | ✅ PASS | |
| 14 | Rapid OAuth Attempts | ✅ PASS | |
| 15 | SQL Injection | ✅ PASS | |
| 16 | XSS Attempt | ✅ PASS | |
| 17 | Network Failure | ✅ PASS | |
| 18 | Browser Back Button | ✅ PASS | |
| 19 | Multiple Browser Tabs | ✅ PASS | |

## Summary

**Total Tests:** 19
**Passed:** 19
**Failed:** 0
**Pass Rate:** 100%

## Issues Found

None

## Recommendations

- All tests passed successfully
- OAuth integration is production-ready
- Consider adding monitoring for OAuth failures
```

---

## Debugging Tips

### Check Backend Logs
```bash
# Backend logs show detailed OAuth flow
tail -f backend/logs/app.log
```

### Check Database State
```sql
-- View all OAuth states
SELECT * FROM oauth_states ORDER BY created_at DESC LIMIT 10;

-- View all connections
SELECT * FROM instagram_connections ORDER BY created_at DESC;

-- Check expired states
SELECT COUNT(*) FROM oauth_states 
WHERE expires_at < datetime('now');

-- Check used states
SELECT COUNT(*) FROM oauth_states 
WHERE is_used = true;
```

### Check Network Requests
```javascript
// In browser DevTools Console
// View all API calls
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/api/platforms/instagram'))
  .forEach(r => console.log(r.name, r.duration + 'ms'))
```

---

## Success Criteria

All tests should pass with:
- ✅ No errors in backend logs
- ✅ No errors in frontend console
- ✅ States created and validated correctly
- ✅ Connections saved successfully
- ✅ Security checks working
- ✅ Error handling graceful
- ✅ User experience smooth

---

## Next Steps After Testing

1. ✅ All tests pass → Ready for production
2. ❌ Some tests fail → Review logs and fix issues
3. 🔄 Performance issues → Optimize database queries
4. 🔒 Security concerns → Review security implementation

---

**Happy Testing! 🧪**
