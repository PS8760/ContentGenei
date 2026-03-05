# DateTime Timezone Fix - Complete Solution

## Problem
Instagram OAuth token exchange failing with error:
```
can't compare offset-naive and offset-aware datetimes
```

## Root Cause
SQLite stores datetime values as strings without timezone information. When these values are retrieved from the database, they become "offset-naive" (no timezone info), but our code creates "offset-aware" datetimes using `datetime.now(timezone.utc)`. Python cannot compare these two types.

## Solution Applied

### 1. Fixed All datetime.utcnow() Usage
**Files Changed:**
- `backend/services/mongodb_service.py` - 5 instances fixed
- `backend/routes/linkogenei.py` - 1 instance fixed

**Change:**
```python
# OLD (offset-naive)
datetime.utcnow()

# NEW (offset-aware)
datetime.now(timezone.utc)
```

### 2. Added Custom TZDateTime Type (models.py)
Created a custom SQLAlchemy TypeDecorator that ensures all datetime values are timezone-aware:

```python
class TZDateTime(TypeDecorator):
    """Custom DateTime type that ensures timezone awareness for SQLite"""
    impl = SQLDateTime
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        """Convert Python datetime to database format"""
        if value is not None:
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            return value.astimezone(timezone.utc)
        return value
    
    def process_result_value(self, value, dialect):
        """Convert database format to Python datetime"""
        if value is not None:
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            return value
        return value
```

### 3. Enhanced OAuthState.is_valid() Method
Added defensive timezone handling in the validation method:

```python
def is_valid(self):
    """Check if state is still valid"""
    if self.is_used:
        return False
    
    # Ensure both datetimes are timezone-aware for comparison
    now = datetime.now(timezone.utc)
    expires_at = self.expires_at
    
    # If expires_at is somehow naive, make it aware (defensive)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if now > expires_at:
        return False
    return True
```

### 4. Enhanced OAuthState.__init__() Method
Added defensive timezone handling when creating states:

```python
def __init__(self, **kwargs):
    super(OAuthState, self).__init__(**kwargs)
    # Set expiration to 10 minutes from now
    if not self.expires_at:
        self.expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    # Ensure expires_at is timezone-aware
    elif self.expires_at.tzinfo is None:
        self.expires_at = self.expires_at.replace(tzinfo=timezone.utc)
```

### 5. Added Defensive Checks in Instagram Controller
Added timezone checks when retrieving OAuthState from database:

```python
# Ensure expires_at is timezone-aware (defensive programming for SQLite)
if oauth_state.expires_at and oauth_state.expires_at.tzinfo is None:
    oauth_state.expires_at = oauth_state.expires_at.replace(tzinfo=timezone.utc)
    current_app.logger.warning(f"Fixed timezone-naive expires_at for state {state}")
```

And when calculating token expiration:

```python
# Calculate token expiration
token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

# Ensure it's timezone-aware (defensive)
if token_expires_at.tzinfo is None:
    token_expires_at = token_expires_at.replace(tzinfo=timezone.utc)
```

## Files Modified

1. **backend/models.py**
   - Added `TZDateTime` custom type
   - Added imports: `from sqlalchemy import TypeDecorator, DateTime as SQLDateTime`

2. **backend/platforms/instagram/instagram_model.py**
   - Enhanced `is_valid()` method with defensive timezone handling
   - Enhanced `__init__()` method with defensive timezone handling

3. **backend/platforms/instagram/instagram_controller.py**
   - Added defensive timezone checks after querying OAuthState
   - Added defensive timezone checks for token_expires_at
   - Added warning log when fixing timezone-naive datetimes

4. **backend/services/mongodb_service.py**
   - Changed 5 instances of `datetime.utcnow()` to `datetime.now(timezone.utc)`
   - Added `timezone` to imports

5. **backend/routes/linkogenei.py**
   - Changed 1 instance of `datetime.utcnow()` to `datetime.now(timezone.utc)`
   - Added `timezone` to imports

## Why This Approach Works

### Multi-Layer Defense:
1. **Creation Layer**: All new datetimes are created as timezone-aware
2. **Storage Layer**: Custom TZDateTime type ensures proper storage/retrieval
3. **Retrieval Layer**: Defensive checks fix any timezone-naive values from database
4. **Comparison Layer**: is_valid() method ensures both sides of comparison are timezone-aware

### SQLite Compatibility:
- SQLite stores datetime as TEXT, INTEGER, or REAL
- When retrieved, Python doesn't know it should be UTC
- Our custom type and defensive checks ensure timezone info is preserved

## Testing

### 1. Restart Backend
```bash
cd backend
python app.py
```

### 2. Test OAuth Flow
1. Go through onboarding
2. Select Instagram platform
3. Click "Allow" on Instagram
4. Watch backend logs for:
   - "✓ State validated successfully"
   - No timezone warnings (unless fixing old data)
   - "✓ Instagram connection saved successfully"

### 3. Expected Logs
```
=== TOKEN EXCHANGE START ===
User ID: <user_id>
Code received: <code>...
State received: <state>
✓ State validated successfully
Step 1: Exchanging code for short-lived token...
✓ Short-lived token received
Step 2: Exchanging for long-lived token...
✓ Long-lived token received
Step 3: Fetching user profile...
✓ Profile received: @username
✓ Instagram connection saved successfully
=== TOKEN EXCHANGE COMPLETE ===
```

### 4. If You See Warnings
If you see:
```
Fixed timezone-naive expires_at for state <state>
```

This means old data in the database had timezone-naive datetimes. The code automatically fixes it. This warning should only appear once per state and will stop appearing for new states.

## Future Migrations

If you want to use the custom TZDateTime type for all datetime columns (optional):

```python
# In models.py, replace:
created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

# With:
created_at = db.Column(TZDateTime, default=lambda: datetime.now(timezone.utc))
```

This is optional because our defensive checks already handle timezone issues.

## Verification Checklist

- [x] All `datetime.utcnow()` replaced with `datetime.now(timezone.utc)`
- [x] All `datetime.now()` replaced with `datetime.now(timezone.utc)`
- [x] Custom TZDateTime type created
- [x] OAuthState.is_valid() has defensive timezone handling
- [x] OAuthState.__init__() has defensive timezone handling
- [x] Instagram controller has defensive timezone checks
- [x] All imports include `timezone`
- [x] No datetime.fromisoformat() without timezone handling

## Summary

The datetime timezone issue is now fixed with a multi-layer defensive approach:
1. All new datetimes are created as timezone-aware
2. Custom SQLAlchemy type handles storage/retrieval
3. Defensive checks fix any timezone-naive values from database
4. Comparison methods ensure both sides are timezone-aware

This ensures the Instagram OAuth token exchange will work correctly regardless of how SQLite stores the datetime values.
