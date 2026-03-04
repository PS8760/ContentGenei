# 🔍 Check Render Logs - Deployment Failed

Your deployment failed with "Exited with status 1". This means the app crashed when starting.

## How to Check Logs

1. Go to: https://dashboard.render.com
2. Click your backend service
3. Click "Logs" (left sidebar)
4. Scroll to the bottom to see the latest error

## Common Errors and Solutions

### Error 1: "ModuleNotFoundError: No module named 'X'"
**Solution:** Missing Python package
- Check `backend/requirements.txt` has all packages
- Render should auto-install them

### Error 2: "KeyError: 'DATABASE_URL'" or similar
**Solution:** Missing environment variable
- Go to Environment tab
- Make sure you added ALL 14 variables
- Check spelling matches exactly

### Error 3: "Cannot connect to database"
**Solution:** Database URL is wrong
- Check DATABASE_URL format
- Should start with `postgresql://`
- Check MONGODB_URI format
- Should start with `mongodb+srv://`

### Error 4: "Firebase credentials invalid"
**Solution:** Firebase variables are wrong
- Check FIREBASE_PRIVATE_KEY includes `\n` characters
- Check all 3 Firebase variables are set
- No extra spaces in values

### Error 5: "gunicorn: command not found"
**Solution:** gunicorn not installed
- Should be in requirements.txt
- Check if requirements.txt was uploaded

## Quick Checklist

Check these in Render Environment tab:

### Required Variables (Must Have All 14):
- [ ] FLASK_ENV=production
- [ ] FLASK_APP=app.py
- [ ] SECRET_KEY (long string)
- [ ] JWT_SECRET_KEY (long string)
- [ ] DATABASE_URL (starts with postgresql://)
- [ ] MONGODB_URI (starts with mongodb+srv://)
- [ ] MONGODB_DB_NAME=linkogenei
- [ ] GROQ_API_KEY (starts with gsk_)
- [ ] FIREBASE_PROJECT_ID
- [ ] FIREBASE_PRIVATE_KEY (includes \n)
- [ ] FIREBASE_CLIENT_EMAIL
- [ ] ENCRYPTION_KEY
- [ ] CORS_ORIGINS
- [ ] Any others you added

## What to Look For in Logs

The logs will show the exact error. Look for:

1. **Last line before crash** - Usually shows the error
2. **Traceback** - Shows which file/line caused the error
3. **"Error:"** or **"Exception:"** - The actual error message

## Common Log Messages

### "No module named 'flask'"
```
ModuleNotFoundError: No module named 'flask'
```
**Fix:** requirements.txt missing or not uploaded

### "Missing environment variable"
```
KeyError: 'DATABASE_URL'
```
**Fix:** Add DATABASE_URL to Environment

### "Connection refused"
```
pymongo.errors.ServerSelectionTimeoutError
```
**Fix:** Check MONGODB_URI is correct

### "Invalid Firebase credentials"
```
google.auth.exceptions.DefaultCredentialsError
```
**Fix:** Check Firebase variables

## Next Steps

1. **Check the logs** - Find the exact error message
2. **Copy the error** - Send it to me
3. **I'll help fix it** - Based on the specific error

## Quick Test

After you check the logs, tell me:
- What's the last error message you see?
- Does it mention a missing variable?
- Does it mention a connection error?
- Does it mention a missing module?

Then I can help you fix it quickly!

---

**Go check the logs now and tell me what error you see!**
