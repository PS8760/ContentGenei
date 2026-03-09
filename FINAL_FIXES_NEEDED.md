# Final Fixes Needed - User Reported Issues

## Issue 1: LinkoGenei Extension Error ❌

**Error Message**: "Cannot connect to server. Make sure backend is running on port 5001"

**Status**: Fix ready, needs deployment

**Solution**: We switched from MongoDB to SQLite. Deploy the fix:

```bash
cd ContentGenei
./deploy-all-fixes.sh
```

**Alternative**: If you prefer MongoDB, install it on AWS:

```bash
# SSH to AWS
ssh ubuntu@3.235.236.139

# Run MongoDB installation script
cd /home/ubuntu/ContentGenei
chmod +x install-mongodb-aws.sh
./install-mongodb-aws.sh

# Update .env
echo "MONGODB_URI=mongodb://localhost:27017/" >> backend/.env
echo "MONGODB_DB_NAME=linkogenei" >> backend/.env

# Restart backend
sudo systemctl restart contentgenei-backend
```

---

## Issue 2: Profile Picture Upload Not Working ❌

**Problem**: There's no profile picture upload functionality in the Profile page.

**Status**: Feature doesn't exist yet

**Solution**: Need to add:
1. File upload input in Profile page
2. Image upload endpoint in backend
3. Store image URL in user profile
4. Display uploaded image

**Quick Fix**: Use Firebase photo URL from Google Sign-In (already available)

---

## Issue 3: No Way to View Analytics ❌

**Problem**: After connecting a social account, user can't easily see how to view analytics.

**Current Behavior**: 
- User clicks on account card → Shows analytics
- But this isn't obvious to users

**Solution**: Make it more obvious:
1. Add "View Analytics" button on each account card
2. Add tooltip/hint text
3. Improve visual feedback when account is selected

---

## Recommended Actions

### Priority 1: Deploy LinkoGenei Fix (5 minutes)
```bash
cd ContentGenei
./deploy-all-fixes.sh
```

### Priority 2: Improve Social Analytics UX (10 minutes)
- Add "View Analytics" button to account cards
- Add loading state when fetching analytics
- Add empty state message

### Priority 3: Add Profile Picture Upload (30 minutes)
- Add file upload component
- Create upload endpoint
- Store in Firebase Storage or local uploads folder

---

## Quick Wins

### 1. Use Firebase Photo URL
The user's Google profile photo is already available in `currentUser.photoURL`. Just display it in the Profile page.

### 2. Make Analytics More Obvious
Add a prominent "View Analytics" button on each connected account card.

### 3. Deploy SQLite Fix
This will immediately fix the LinkoGenei extension error.

