# Debugging ML Training Issue

## Step 1: Check Backend Logs

When you click "Train ML Model", check the backend terminal for logs. You should see:

```
=== ML TRAIN MODEL START ===
User ID: xxx, Connection ID: xxx
✓ Connection found: username
✓ Found X posts
```

If you see an error, it will show:
```
=== ML TRAIN MODEL ERROR ===
Error type: ...
Error message: ...
```

## Step 2: Check Browser Console

Open browser DevTools (F12) and check Console tab. Look for:

```
Failed to train model: Error: ...
```

## Step 3: Common Issues & Solutions

### Issue 1: "Need at least 10 posts"
**Cause**: Not enough posts in database
**Solution**: 
```bash
cd backend
python add_varied_post_times.py
```
This adds test posts with engagement data.

### Issue 2: "Connection not found"
**Cause**: Instagram connection not active or doesn't exist
**Solution**: 
1. Go to Instagram Analytics
2. Check if connection is shown in dropdown
3. If not, reconnect Instagram account

### Issue 3: "Module not found: numpy/scipy/sklearn"
**Cause**: ML dependencies not installed
**Solution**:
```bash
cd backend
pip install numpy scipy scikit-learn
```
Or run:
```bash
INSTALL_DEPENDENCIES.bat
```

### Issue 4: Network Error / 500 Internal Server Error
**Cause**: Backend error during training
**Solution**: Check backend terminal for detailed error

## Step 4: Manual Test

Run this to test ML service directly:

```bash
cd backend
python test_ml_prediction.py
```

Should show:
```
✅ Model trained successfully!
   - R² Score: 0.642
   - Training Samples: 15
```

## Step 5: Check Database

Verify you have posts with engagement data:

```bash
cd backend
python check_post_engagement.py
```

Should show posts with engagement_rate > 0.

## Step 6: Get Detailed Error

Add this to browser console and run:

```javascript
// Get connection ID from dropdown
const connectionId = 'YOUR_CONNECTION_ID_HERE';

// Try to train model
fetch('http://localhost:5001/api/platforms/instagram/ml/train-model/' + connectionId, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

## What to Share

If still not working, please share:

1. **Backend terminal output** (the error logs)
2. **Browser console error** (the exact error message)
3. **Number of posts** (from check_post_engagement.py)
4. **Connection status** (is Instagram connected?)

This will help identify the exact issue!
