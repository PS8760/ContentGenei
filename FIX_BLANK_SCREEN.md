# Fix Blank Screen Issue - Quick Guide

## The Problem
After making changes to Creator.jsx and Dashboard.jsx, the browser shows a blank screen when accessing localhost.

## The Solution

### Option 1: Restart Frontend Dev Server (RECOMMENDED)

1. **Stop the current frontend server:**
   - Find the terminal/command prompt running `npm run dev`
   - Press `Ctrl + C` to stop it

2. **Start it again:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Wait for the message:**
   ```
   VITE v5.x.x  ready in xxx ms
   
   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```

4. **Open browser and go to:**
   ```
   http://localhost:5173
   ```

### Option 2: Hard Refresh Browser

If the server is already running:

1. **Windows/Linux:**
   - Press `Ctrl + Shift + R`
   - Or `Ctrl + F5`

2. **Mac:**
   - Press `Cmd + Shift + R`

3. **Or manually:**
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

### Option 3: Clear Browser Cache

1. Open browser DevTools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Click "Clear site data" or "Clear storage"
4. Refresh the page

## Verify It's Working

### Check Console for Errors
1. Open DevTools (F12)
2. Go to "Console" tab
3. Look for any red error messages
4. If you see errors, share them for debugging

### Check Network Tab
1. Open DevTools (F12)
2. Go to "Network" tab
3. Refresh the page
4. Check if files are loading (should see index.html, .js, .css files)

### Check if Backend is Running
The frontend needs the backend to be running:

```bash
cd backend
python run.py
```

Should see:
```
* Running on http://127.0.0.1:5000
```

## Common Issues & Fixes

### Issue 1: Port Already in Use
**Error:** `Port 5173 is already in use`

**Fix:**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F

# Then restart
cd frontend
npm run dev
```

### Issue 2: Node Modules Issue
**Error:** Module not found or dependency errors

**Fix:**
```bash
cd frontend
npm install
npm run dev
```

### Issue 3: Vite Cache Issue
**Error:** Blank screen with no console errors

**Fix:**
```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### Issue 4: Build Artifacts
**Error:** Old build files causing issues

**Fix:**
```bash
cd frontend
rm -rf dist
npm run dev
```

## Test the Save Feature

Once the app loads:

1. **Go to Creator page:**
   - Click "AI Content Creator" from Dashboard
   - Or navigate to `http://localhost:5173/creator`

2. **Generate content:**
   - Select content type (e.g., "Article")
   - Enter a prompt (e.g., "Write about AI")
   - Select tone (e.g., "Professional")
   - Click "Generate Content"

3. **Save content:**
   - Click the "Save" button
   - Toast notification should appear (top-right)
   - Click "View Library" or "Continue Generating"

4. **Check Dashboard:**
   - Go to Dashboard
   - Scroll down to "📚 Content Library" section
   - Your saved content should appear with image

## Still Having Issues?

### Check Browser Console
1. Press F12
2. Look for errors in Console tab
3. Common errors:
   - `Cannot read property of undefined` - State issue
   - `Failed to fetch` - Backend not running
   - `Unexpected token` - Syntax error
   - `Module not found` - Import issue

### Check File Changes
Verify these files were updated:
- ✅ `frontend/src/pages/Creator.jsx` - handleSave function
- ✅ `frontend/src/pages/Dashboard.jsx` - libraryContent state
- ✅ `frontend/src/index.css` - slide-in animation

### Rollback if Needed
If nothing works, you can rollback:

```bash
git status
git diff frontend/src/pages/Creator.jsx
git diff frontend/src/pages/Dashboard.jsx

# To rollback
git checkout frontend/src/pages/Creator.jsx
git checkout frontend/src/pages/Dashboard.jsx
git checkout frontend/src/index.css
```

## Quick Checklist

- [ ] Frontend dev server is running (`npm run dev` in frontend folder)
- [ ] Backend server is running (`python run.py` in backend folder)
- [ ] Browser is accessing `http://localhost:5173`
- [ ] Hard refresh attempted (Ctrl+Shift+R)
- [ ] No errors in browser console (F12)
- [ ] No errors in terminal running dev server

## Expected Behavior

### When Working Correctly:
1. Landing page loads at `http://localhost:5173`
2. Can navigate to Dashboard
3. Can navigate to Creator
4. Can generate content
5. Can save content (toast appears)
6. Dashboard shows saved content in library section

### What You Should See:
- **Creator Page:** Generate tab with form and action buttons
- **Save Button:** Gray button that says "Save"
- **Toast:** Green notification in top-right after saving
- **Dashboard:** Content Library section with saved posts (if any)

---

**Most Common Fix:** Just restart the frontend dev server! 🔄
