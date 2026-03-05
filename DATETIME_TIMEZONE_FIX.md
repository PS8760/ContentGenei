# DateTime Timezone Fix - Instagram OAuth

## Issue
Instagram token exchange was failing with error:
```
can't compare offset-naive and offset-aware datetimes
```

This occurs when Python tries to compare a datetime without timezone info (offset-naive) with a datetime that has timezone info (offset-aware).

## Root Cause
Some files were using `datetime.utcnow()` and `datetime.now()` which create offset-naive datetimes, while the Instagram models use `datetime.now(timezone.utc)` which creates offset-aware datetimes.

When comparing or storing these values together, Python raises an error.

## Files Fixed

### 1. `backend/services/mongodb_service.py`
**Changed:**
- `datetime.utcnow()` → `datetime.now(timezone.utc)` (4 occurrences)
- Added `timezone` to imports: `from datetime import datetime, timezone`

**Lines fixed:**
- Line 116: `'created_at': datetime.now(timezone.utc)`
- Line 117: `'updated_at': datetime.now(timezone.utc)`
- Line 229: `'updated_at': datetime.now(timezone.utc)`
- Line 298: `'created_at': datetime.now(timezone.utc)`
- Line 363: `'created_at': datetime.now(timezone.utc)`

### 2. `backend/routes/linkogenei.py`
**Changed:**
- `datetime.utcnow()` → `datetime.now(timezone.utc)` (1 occurrence)
- Added `timezone` to imports: `from datetime import datetime, timezone`

**Lines fixed:**
- Line 38: `'created_at': datetime.now(timezone.utc).isoformat()`

### 3. `backend/platforms/instagram/instagram_controller.py`
**Status:** ✅ Already correct
- Already using `datetime.now(timezone.utc)` throughout
- Already has proper imports

### 4. `backend/platforms/instagram/instagram_model.py`
**Status:** ✅ Already correct
- All datetime defaults use `lambda: datetime.now(timezone.utc)`
- Comparisons in `is_valid()` method use timezone-aware datetimes

### 5. `backend/models.py`
**Status:** ✅ Already correct
- All datetime defaults use `lambda: datetime.now(timezone.utc)`
- All models consistently use timezone-aware datetimes

## Verification

### All datetime usage is now consistent:
```python
# ✅ CORRECT - Offset-aware (has timezone info)
from datetime import datetime, timezone
datetime.now(timezone.utc)

# ❌ WRONG - Offset-naive (no timezone info)
datetime.utcnow()
datetime.now()
```

### Dependencies
- `python-dateutil==2.8.2` is already in `requirements.txt`
- No additional installation needed

## Testing

After these fixes, the Instagram OAuth flow should work without datetime comparison errors.

### Test Steps:
1. Restart backend: `python backend/app.py`
2. Go through onboarding and select Instagram
3. Click "Allow" on Instagram OAuth
4. Token exchange should now complete successfully

### Expected Backend Logs:
```
=== TOKEN EXCHANGE START ===
User ID: <user_id>
Code received: <code>...
State received: <state>
✓ State validated successfully
Step 1: Exchanging code for short-lived token...
Redirect URI being used: https://...
✓ Short-lived token received
Instagram User ID: <instagram_user_id>
Step 2: Exchanging for long-lived token...
✓ Long-lived token received
Expires in: 5184000 seconds
Step 3: Fetching user profile...
✓ Profile received: @username
Creating new connection
✓ Instagram connection saved successfully
=== TOKEN EXCHANGE COMPLETE ===
```

## Why This Matters

Python's datetime module has two types of datetime objects:

1. **Offset-naive**: No timezone information
   - `datetime.now()` - local time, no timezone
   - `datetime.utcnow()` - UTC time, but no timezone marker
   
2. **Offset-aware**: Has timezone information
   - `datetime.now(timezone.utc)` - UTC time with timezone marker
   - Can be safely compared with other offset-aware datetimes

When you try to compare or perform operations between these two types, Python raises:
```
TypeError: can't compare offset-naive and offset-aware datetimes
```

## Best Practice

Always use timezone-aware datetimes in production applications:
```python
from datetime import datetime, timezone

# For current UTC time
now = datetime.now(timezone.utc)

# For storing in database
created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

# For comparisons
if datetime.now(timezone.utc) > expires_at:
    # This works if expires_at is also timezone-aware
    pass
```

## Files Verified as Correct

All other backend files were checked and are already using timezone-aware datetimes:
- ✅ `backend/app.py`
- ✅ `backend/models.py`
- ✅ `backend/platforms/instagram/instagram_controller.py`
- ✅ `backend/platforms/instagram/instagram_model.py`
- ✅ `backend/platforms/instagram/instagram_service.py`
- ✅ All route files in `backend/routes/`
- ✅ All service files in `backend/services/` (except mongodb_service.py which was fixed)

## Summary

Fixed 5 instances of offset-naive datetime usage across 2 files. All datetime operations in the backend are now consistently using timezone-aware datetimes with `datetime.now(timezone.utc)`.
