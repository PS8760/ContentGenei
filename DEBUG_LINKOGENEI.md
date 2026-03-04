# Debug LinkoGenei "Failed to Fetch" Error

## How to Find the Exact Error

### Step 1: Open Browser DevTools
1. Press **F12** to open Developer Tools
2. Click the **Network** tab
3. Make sure "Preserve log" is checked

### Step 2: Reproduce the Error
1. Go to GeneiLink page
2. Click "Feed", "Categories", or "Saved" tab
3. Watch the Network tab for failed requests

### Step 3: Check Failed Request
Look for requests to:
- `https://contentgenei.onrender.com/api/linkogenei/posts`
- `https://contentgenei.onrender.com/api/linkogenei/categories`
- `https://contentgenei.onrender.com/api/linkogenei/stats`

Click on the failed request and check:
- **Status Code**: (e.g., 401, 403, 404, 500, CORS error)
- **Response**: What error message is returned
- **Headers**: Check if Authorization header is present

### Step 4: Check Console for Details
In the **Console** tab, look for:
```
API Request: https://contentgenei.onrender.com/api/linkogenei/posts
```

Then check what happens after that.

---

## Common Causes & Solutions

### 1. CORS Error
**Symptoms**: 
- Status: (failed) or (CORS error)
- Console: "Access to fetch has been blocked by CORS policy"

**Solution**: Backend CORS not configured for LinkoGenei endpoints

**Fix**: Add CORS headers to LinkoGenei routes

---

### 2. 401 Unauthorized
**Symptoms**:
- Status: 401
- Response: "Invalid or expired token"

**Causes**:
- Extension token not generated
- Extension token not in localStorage
- Extension token expired

**Check**:
```javascript
// In browser console
console.log(localStorage.getItem('linkogenei_extension_token'))
```

**Fix**: Clear localStorage and reload:
```javascript
localStorage.clear()
location.reload()
```

---

### 3. 404 Not Found
**Symptoms**:
- Status: 404
- Response: "Not Found"

**Causes**:
- Endpoint doesn't exist
- Wrong URL

**Check**: Verify backend is running:
```
https://contentgenei.onrender.com/api/health
```

---

### 4. 500 Internal Server Error
**Symptoms**:
- Status: 500
- Response: Server error message

**Causes**:
- Backend code error
- MongoDB connection issue

**Check**: Render logs for error details

---

### 5. Network Error (Failed to Fetch)
**Symptoms**:
- Status: (failed)
- No response
- Console: "TypeError: Failed to fetch"

**Causes**:
- Backend is down
- Network connectivity issue
- Request blocked by browser

**Check**:
1. Backend health: https://contentgenei.onrender.com/api/health
2. Render dashboard: https://dashboard.render.com/
3. Backend logs for errors

---

## Quick Tests

### Test 1: Check Backend Health
```bash
curl https://contentgenei.onrender.com/api/health
```

Expected: `{"status": "healthy"}`

### Test 2: Check Extension Token in Browser
```javascript
// Open browser console (F12)
console.log('Extension Token:', localStorage.getItem('linkogenei_extension_token'))
console.log('JWT Token:', localStorage.getItem('access_token'))
```

### Test 3: Manually Generate Token
```javascript
// In browser console
fetch('https://contentgenei.onrender.com/api/linkogenei/generate-token', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('Token Response:', data)
  if (data.success) {
    localStorage.setItem('linkogenei_extension_token', data.token)
    console.log('Token stored!')
  }
})
.catch(err => console.error('Error:', err))
```

### Test 4: Test LinkoGenei Endpoint
```javascript
// After generating token, test posts endpoint
fetch('https://contentgenei.onrender.com/api/linkogenei/posts', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('linkogenei_extension_token'),
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Posts Response:', data))
.catch(err => console.error('Error:', err))
```

---

## Most Likely Issues

### Issue 1: Extension Token Not Generated
The automatic token generation might not be working.

**Check**:
1. Open GeneiLink page
2. Open console (F12)
3. Look for: "No extension token found, generating one..."
4. Look for: "Extension token generated successfully"

**If you don't see these messages**, the token isn't being generated.

**Manual Fix**:
Run Test 3 above to manually generate token.

---

### Issue 2: CORS Not Configured
LinkoGenei endpoints might not have CORS headers.

**Check Network Tab**:
- If you see "CORS error" or "Access-Control-Allow-Origin"
- This is the issue

**Fix Required**: Update backend CORS configuration

---

### Issue 3: Backend Not Deployed
The latest backend changes might not be deployed yet.

**Check**:
1. Go to: https://dashboard.render.com/
2. Check deployment status
3. Look for "Live" status
4. Check deploy time (should be recent)

---

## What to Report

Please provide:

1. **Network Tab Screenshot**:
   - Show the failed request
   - Show status code
   - Show response (if any)

2. **Console Output**:
   - Copy all console messages
   - Include errors and warnings

3. **localStorage Check**:
```javascript
console.log({
  extensionToken: localStorage.getItem('linkogenei_extension_token'),
  jwtToken: localStorage.getItem('access_token'),
  hasExtensionToken: !!localStorage.getItem('linkogenei_extension_token'),
  hasJwtToken: !!localStorage.getItem('access_token')
})
```

4. **Backend Health Check**:
   - Visit: https://contentgenei.onrender.com/api/health
   - Copy the response

5. **Render Deployment Status**:
   - Is it "Live"?
   - When was last deployment?
   - Any errors in logs?

---

## Temporary Workaround

If LinkoGenei features aren't critical right now, you can:

1. Skip the GeneiLink page for now
2. Focus on other features (Dashboard, Creator, Analytics)
3. Come back to LinkoGenei after we identify the exact error

---

## Next Steps

1. Open Network tab (F12 → Network)
2. Try loading posts/categories/stats
3. Click on failed request
4. Copy the exact error message
5. Share that with me

This will tell us exactly what's wrong!
