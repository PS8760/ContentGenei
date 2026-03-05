# How to Restart Backend and Fix 500 Errors

## The Issue
You're getting 500 Internal Server Error because the backend needs to be restarted after code changes.

## Solution: Restart Backend

### Step 1: Stop the Backend
If the backend is running, press `Ctrl+C` in the terminal where it's running.

### Step 2: Start the Backend Again
```bash
cd backend
python run.py
```

You should see:
```
 * Running on http://0.0.0.0:5001
 * Running on http://127.0.0.1:5001
```

### Step 3: Check for Errors
When the backend starts, watch for any error messages. If you see errors about missing modules, run:

```bash
pip install numpy scipy textblob scikit-learn
```

### Step 4: Test the Endpoint
Once the backend is running, refresh your browser and try clicking "Analyze Patterns" again.

## Common Issues

### Issue 1: Module Not Found
**Error**: `ModuleNotFoundError: No module named 'numpy'`

**Fix**:
```bash
cd backend
pip install numpy scipy textblob scikit-learn
python -m textblob.download_corpora
```

### Issue 2: Port Already in Use
**Error**: `Address already in use`

**Fix**:
```bash
# On Windows
netstat -ano | findstr :5001
taskkill /PID <PID_NUMBER> /F

# Then restart
python run.py
```

### Issue 3: Database Error
**Error**: Something about database or SQLAlchemy

**Fix**:
```bash
cd backend
python init_db.py
python run.py
```

## Quick Test

After restarting, test if the backend is working:

1. Open browser: http://localhost:5001/api/health
2. You should see: `{"status": "healthy", ...}`

If you see this, the backend is running correctly!

## Still Getting 500 Errors?

Check the backend terminal for the actual error message. It will show you exactly what's wrong.

Look for lines like:
```
ERROR in app: ...
Traceback (most recent call last):
  ...
```

Copy that error and I can help you fix it!

## What We Changed

We fixed the ML endpoints to properly handle datetime objects instead of strings. The changes are in:
- `backend/platforms/instagram/instagram_controller.py`

These changes require a backend restart to take effect.
