# 🔧 Update CORS for Vercel Deployment

## Your Current Vercel URL
```
https://content-genei-dhphy2e82-ps8760s-projects.vercel.app
```

## Step-by-Step Fix

### 1. Update Render Environment Variables

Go to: https://dashboard.render.com → Your Service → Environment

**Add or update `CORS_ORIGINS`**:
```env
CORS_ORIGINS=https://content-genei-dhphy2e82-ps8760s-projects.vercel.app,https://*.vercel.app,http://localhost:5173
```

**Important**: 
- No spaces after commas
- Include `https://` prefix
- Add wildcard `https://*.vercel.app` for all preview deployments

Click **Save Changes** → Render will redeploy automatically

---

### 2. Update Firebase Authorized Domains

Go to: https://console.firebase.google.com → Your Project → Authentication → Settings → Authorized domains

**Add these domains**:
1. `content-genei-dhphy2e82-ps8760s-projects.vercel.app`
2. `*.vercel.app` (if allowed, otherwise add each preview domain manually)

---

### 3. Verify CORS is Working

After Render redeploys (2-3 minutes), test:

```bash
# Test CORS preflight
curl -X OPTIONS \
  -H "Origin: https://content-genei-dhphy2e82-ps8760s-projects.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  https://contentgenei.onrender.com/api/auth/verify-token -v
```

Look for these headers in response:
```
Access-Control-Allow-Origin: https://content-genei-dhphy2e82-ps8760s-projects.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

### 4. Test in Browser

1. Open: https://content-genei-dhphy2e82-ps8760s-projects.vercel.app
2. Press F12 (DevTools)
3. Go to Console tab
4. Try to register/login
5. Check Network tab for API calls

**Expected behavior**:
- ✅ API calls go to `https://contentgenei.onrender.com`
- ✅ No CORS errors in console
- ✅ Authentication works

**If you see CORS errors**:
```
Access to fetch at 'https://contentgenei.onrender.com/api/...' 
from origin 'https://content-genei-dhphy2e82-ps8760s-projects.vercel.app' 
has been blocked by CORS policy
```

**Solution**: Double-check CORS_ORIGINS in Render (no typos, correct URL)

---

## 🎯 Get Your Production URL

Your current URL is a **preview deployment**. To get production URL:

### Method 1: Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click your project
3. Look for deployment with 🌐 icon (Production)
4. Copy the URL (usually: `https://content-genei.vercel.app`)

### Method 2: Vercel CLI
```bash
cd frontend
vercel ls
```

Look for the production URL in the output.

### Method 3: Check Vercel Settings
1. Vercel Dashboard → Your Project → Settings → Domains
2. Your production domain is listed there

---

## 🔄 Update for Production URL

Once you have your production URL (e.g., `https://content-genei.vercel.app`):

### Update Render CORS_ORIGINS:
```env
CORS_ORIGINS=https://content-genei.vercel.app,https://content-genei-dhphy2e82-ps8760s-projects.vercel.app,https://*.vercel.app,http://localhost:5173
```

### Update Firebase Authorized Domains:
Add: `content-genei.vercel.app`

---

## 🆘 Troubleshooting

### Issue 1: CORS Error Persists
**Check**:
1. CORS_ORIGINS has correct URL (no typos)
2. No spaces in CORS_ORIGINS
3. Render has finished redeploying
4. Clear browser cache (Cmd+Shift+R)

### Issue 2: Firebase Auth Error
**Check**:
1. Domain added to Firebase Authorized Domains
2. Firebase config in Vercel environment variables
3. VITE_FIREBASE_* variables are set correctly

### Issue 3: API Calls Fail
**Check**:
1. VITE_API_URL is set in Vercel: `https://contentgenei.onrender.com`
2. No trailing slash in VITE_API_URL
3. Backend is running (check Render logs)

### Issue 4: Slow Response
**Normal**: Render free tier has cold starts (30-60s first request)
**Solution**: Upgrade to paid tier ($7/month) for always-on

---

## ✅ Verification Checklist

After updating CORS:

- [ ] CORS_ORIGINS updated in Render
- [ ] Render redeployed successfully
- [ ] Firebase authorized domains updated
- [ ] Browser cache cleared
- [ ] Can access Vercel URL
- [ ] No CORS errors in console
- [ ] Can register new user
- [ ] Can login
- [ ] Can generate content
- [ ] Admin panel accessible

---

## 📞 Quick Commands

```bash
# Test backend health
curl https://contentgenei.onrender.com/api/health

# Test CORS
curl -X OPTIONS \
  -H "Origin: https://content-genei-dhphy2e82-ps8760s-projects.vercel.app" \
  https://contentgenei.onrender.com/api/auth/verify-token -v

# Check Render logs
# Go to: https://dashboard.render.com → Your Service → Logs

# Trigger Render redeploy
curl -X POST https://api.render.com/deploy/srv-d630e0u8alac738qnt00?key=pYEz9JddGLs

# Check Vercel deployments
cd frontend
vercel ls
```

---

## 🎉 Success!

Once CORS is configured:
1. Your Vercel frontend will connect to Render backend
2. All API calls will work
3. Authentication will work
4. No CORS errors

**Total setup time**: 5 minutes
**Cost**: $0/month (free tiers) or $7/month (Render paid)
