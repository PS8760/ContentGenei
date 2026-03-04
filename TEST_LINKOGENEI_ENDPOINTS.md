# Test LinkoGenei Endpoints

## Quick Test Script

Copy and paste this into your browser console (F12 → Console) while on the GeneiLink page:

```javascript
// Test Script for LinkoGenei Endpoints
(async function testLinkoGenei() {
  console.log('=== LinkoGenei Endpoint Test ===\n')
  
  // Step 1: Check tokens
  console.log('1. Checking tokens...')
  const jwtToken = localStorage.getItem('access_token')
  const extensionToken = localStorage.getItem('linkogenei_extension_token')
  
  console.log('JWT Token:', jwtToken ? '✅ Present' : '❌ Missing')
  console.log('Extension Token:', extensionToken ? '✅ Present' : '❌ Missing')
  console.log('')
  
  // Step 2: Generate extension token if missing
  if (!extensionToken && jwtToken) {
    console.log('2. Generating extension token...')
    try {
      const response = await fetch('https://contentgenei.onrender.com/api/linkogenei/generate-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      console.log('Generate Token Response:', data)
      
      if (data.success && data.token) {
        localStorage.setItem('linkogenei_extension_token', data.token)
        console.log('✅ Extension token generated and stored!')
        console.log('Token:', data.token.substring(0, 20) + '...')
      } else {
        console.error('❌ Failed to generate token:', data.error)
        return
      }
    } catch (error) {
      console.error('❌ Error generating token:', error)
      return
    }
  } else if (!jwtToken) {
    console.error('❌ No JWT token found. Please log in first.')
    return
  }
  console.log('')
  
  // Step 3: Test posts endpoint
  console.log('3. Testing /api/linkogenei/posts...')
  try {
    const newExtensionToken = localStorage.getItem('linkogenei_extension_token')
    const response = await fetch('https://contentgenei.onrender.com/api/linkogenei/posts', {
      headers: {
        'Authorization': `Bearer ${newExtensionToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Posts endpoint failed:', errorText)
    } else {
      const data = await response.json()
      console.log('✅ Posts endpoint working!')
      console.log('Response:', data)
    }
  } catch (error) {
    console.error('❌ Error calling posts endpoint:', error)
  }
  console.log('')
  
  // Step 4: Test categories endpoint
  console.log('4. Testing /api/linkogenei/categories...')
  try {
    const newExtensionToken = localStorage.getItem('linkogenei_extension_token')
    const response = await fetch('https://contentgenei.onrender.com/api/linkogenei/categories', {
      headers: {
        'Authorization': `Bearer ${newExtensionToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Categories endpoint failed:', errorText)
    } else {
      const data = await response.json()
      console.log('✅ Categories endpoint working!')
      console.log('Response:', data)
    }
  } catch (error) {
    console.error('❌ Error calling categories endpoint:', error)
  }
  console.log('')
  
  // Step 5: Test stats endpoint
  console.log('5. Testing /api/linkogenei/stats...')
  try {
    const newExtensionToken = localStorage.getItem('linkogenei_extension_token')
    const response = await fetch('https://contentgenei.onrender.com/api/linkogenei/stats', {
      headers: {
        'Authorization': `Bearer ${newExtensionToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Stats endpoint failed:', errorText)
    } else {
      const data = await response.json()
      console.log('✅ Stats endpoint working!')
      console.log('Response:', data)
    }
  } catch (error) {
    console.error('❌ Error calling stats endpoint:', error)
  }
  console.log('')
  
  console.log('=== Test Complete ===')
})()
```

## What This Test Does

1. **Checks for tokens** in localStorage
2. **Generates extension token** if missing (using JWT token)
3. **Tests /posts endpoint** with extension token
4. **Tests /categories endpoint** with extension token
5. **Tests /stats endpoint** with extension token

## Expected Output

### If Everything Works ✅
```
=== LinkoGenei Endpoint Test ===

1. Checking tokens...
JWT Token: ✅ Present
Extension Token: ✅ Present

3. Testing /api/linkogenei/posts...
Status: 200 OK
✅ Posts endpoint working!
Response: {success: true, posts: [], total: 0}

4. Testing /api/linkogenei/categories...
Status: 200 OK
✅ Categories endpoint working!
Response: {success: true, categories: []}

5. Testing /api/linkogenei/stats...
Status: 200 OK
✅ Stats endpoint working!
Response: {success: true, stats: {total_posts: 0, ...}}

=== Test Complete ===
```

### If Token Generation Fails ❌
```
2. Generating extension token...
❌ Failed to generate token: 'MongoDBService' object has no attribute 'store_extension_token'
```
**Solution**: Backend not deployed yet. Wait for Render deployment.

### If Endpoints Fail ❌
```
3. Testing /api/linkogenei/posts...
Status: 401 Unauthorized
❌ Posts endpoint failed: {"success": false, "error": "Invalid or expired token"}
```
**Solution**: Token verification issue. Check Render logs.

### If Network Fails ❌
```
3. Testing /api/linkogenei/posts...
❌ Error calling posts endpoint: TypeError: Failed to fetch
```
**Solution**: Backend is down or network issue. Check Render status.

---

## After Running the Test

### If All Tests Pass ✅
The backend is working! The issue is in the frontend code. Try:
1. Clear browser cache
2. Hard reload (Ctrl+Shift+R)
3. Clear localStorage and reload

### If Tests Fail ❌
Share the console output with me so I can see the exact error.

---

## Alternative: Test with cURL

If you have terminal access:

```bash
# 1. Generate token (replace YOUR_JWT_TOKEN)
curl -X POST https://contentgenei.onrender.com/api/linkogenei/generate-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# 2. Test posts endpoint (replace YOUR_EXTENSION_TOKEN)
curl https://contentgenei.onrender.com/api/linkogenei/posts \
  -H "Authorization: Bearer YOUR_EXTENSION_TOKEN" \
  -H "Content-Type: application/json"

# 3. Test categories endpoint
curl https://contentgenei.onrender.com/api/linkogenei/categories \
  -H "Authorization: Bearer YOUR_EXTENSION_TOKEN" \
  -H "Content-Type: application/json"

# 4. Test stats endpoint
curl https://contentgenei.onrender.com/api/linkogenei/stats \
  -H "Authorization: Bearer YOUR_EXTENSION_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Run This Test Now

1. Go to GeneiLink page
2. Press F12 to open console
3. Copy the entire test script above
4. Paste into console
5. Press Enter
6. Share the output with me

This will tell us exactly what's failing!
