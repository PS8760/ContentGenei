# Performance Optimization Guide

## Common Causes of Slow Loading

### 1. **Render Free Tier Cold Starts** ⏰
**Problem**: Render free tier spins down after 15 minutes of inactivity
**Impact**: First request takes 30-60 seconds to wake up
**Solution**: 
- Upgrade to paid tier ($7/month) for always-on
- Or use a keep-alive service (ping every 10 minutes)

### 2. **Heavy Animations & Particles** 🎨
**Problem**: ParticlesBackground and FloatingEmojis on every page
**Impact**: Slows initial render, high CPU usage
**Solution**: Lazy load or disable on mobile

### 3. **Large Bundle Size** 📦
**Problem**: Loading all components at once
**Impact**: Slow initial page load
**Solution**: Code splitting and lazy loading

### 4. **Multiple API Calls on Mount** 🔄
**Problem**: Dashboard/Analytics fetch data immediately
**Impact**: Blocks rendering until all requests complete
**Solution**: Parallel loading, skeleton screens

### 5. **No Caching** 💾
**Problem**: Fetching same data repeatedly
**Impact**: Unnecessary network requests
**Solution**: Implement caching strategy

### 6. **Unoptimized Images** 🖼️
**Problem**: Large image files
**Impact**: Slow page load
**Solution**: Image optimization, lazy loading

---

## Quick Fixes (Immediate Impact)

### Fix 1: Disable Particles on Mobile

Update `ParticlesBackground.jsx`:

```javascript
import { useState, useEffect } from 'react'

const ParticlesBackground = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  // Don't render on mobile
  if (isMobile) return null

  return (
    // ... existing code
  )
}
```

### Fix 2: Lazy Load Heavy Components

Update `App.jsx`:

```javascript
import { lazy, Suspense } from 'react'

// Lazy load heavy pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Creator = lazy(() => import('./pages/Creator'))
const TeamCollaboration = lazy(() => import('./pages/TeamCollaboration'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const SocialAnalytics = lazy(() => import('./pages/SocialAnalytics'))

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
)

// Wrap routes with Suspense
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/analytics" element={<Analytics />} />
    {/* ... other routes */}
  </Routes>
</Suspense>
```

### Fix 3: Add Loading States

Update `Dashboard.jsx`:

```javascript
const [loading, setLoading] = useState(true)
const [data, setData] = useState(null)

useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await apiService.getContent()
      setData(result)
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])

if (loading) {
  return <SkeletonLoader />
}
```

### Fix 4: Implement Caching

Create `frontend/src/utils/cache.js`:

```javascript
class Cache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map()
    this.ttl = ttl
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    const age = Date.now() - item.timestamp
    if (age > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  clear() {
    this.cache.clear()
  }
}

export const apiCache = new Cache()
```

Update `api.js`:

```javascript
import { apiCache } from '../utils/cache'

async request(endpoint, options = {}) {
  // Check cache for GET requests
  if (!options.method || options.method === 'GET') {
    const cached = apiCache.get(endpoint)
    if (cached) {
      console.log('Cache hit:', endpoint)
      return cached
    }
  }

  // ... existing request code ...

  // Cache successful GET responses
  if ((!options.method || options.method === 'GET') && data) {
    apiCache.set(endpoint, data)
  }

  return data
}
```

### Fix 5: Optimize GSAP Animations

Reduce animation complexity:

```javascript
// Instead of complex timelines, use simple animations
useEffect(() => {
  gsap.to(titleRef.current, {
    y: 0,
    opacity: 1,
    duration: 0.6, // Reduced from 1
    ease: "power2.out" // Simpler easing
  })
}, [])
```

### Fix 6: Add Service Worker for Caching

Create `frontend/public/sw.js`:

```javascript
const CACHE_NAME = 'contentgenei-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  )
})
```

Register in `index.html`:

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
```

---

## Backend Optimizations

### Fix 1: Add Response Caching

Create `backend/utils/cache.py`:

```python
from functools import wraps
from flask import request
import time

cache = {}

def cache_response(ttl=300):  # 5 minutes
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Create cache key from endpoint and args
            cache_key = f"{request.path}:{request.args}"
            
            # Check cache
            if cache_key in cache:
                data, timestamp = cache[cache_key]
                if time.time() - timestamp < ttl:
                    return data
            
            # Call function
            result = f(*args, **kwargs)
            
            # Store in cache
            cache[cache_key] = (result, time.time())
            
            return result
        return wrapper
    return decorator
```

Use in routes:

```python
from utils.cache import cache_response

@content_bp.route('/content', methods=['GET'])
@jwt_required()
@cache_response(ttl=60)  # Cache for 1 minute
def get_content():
    # ... existing code ...
```

### Fix 2: Database Query Optimization

Add indexes to frequently queried fields:

```python
# In models.py
class ContentItem(db.Model):
    # ... existing fields ...
    
    __table_args__ = (
        db.Index('idx_user_created', 'user_id', 'created_at'),
        db.Index('idx_platform', 'platform'),
    )
```

### Fix 3: Pagination

Always paginate large datasets:

```python
@content_bp.route('/content', methods=['GET'])
@jwt_required()
def get_content():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = ContentItem.query.filter_by(user_id=user_id)
    
    # Paginate
    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    
    return jsonify({
        'items': [item.to_dict() for item in pagination.items],
        'total': pagination.total,
        'page': page,
        'pages': pagination.pages
    })
```

### Fix 4: Compress Responses

Add to `app.py`:

```python
from flask_compress import Compress

app = Flask(__name__)
Compress(app)  # Enable gzip compression
```

Install:
```bash
pip install flask-compress
```

---

## Render-Specific Optimizations

### Keep Backend Alive

Create `backend/keep_alive.py`:

```python
import requests
import time
import os

def keep_alive():
    """Ping backend every 10 minutes to prevent cold start"""
    url = os.environ.get('BACKEND_URL', 'https://contentgenei.onrender.com')
    
    while True:
        try:
            requests.get(f"{url}/api/health", timeout=5)
            print(f"Keep-alive ping sent at {time.strftime('%H:%M:%S')}")
        except Exception as e:
            print(f"Keep-alive failed: {e}")
        
        time.sleep(600)  # 10 minutes

if __name__ == '__main__':
    keep_alive()
```

Or use external service:
- UptimeRobot (free)
- Cron-job.org (free)
- Set to ping every 10 minutes

### Optimize Render Build

Update `render.yaml`:

```yaml
services:
  - type: web
    name: contentgenei-backend
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "gunicorn app:app --workers 2 --threads 2 --timeout 60"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.9
      - key: WEB_CONCURRENCY
        value: 2
```

---

## Vercel Optimizations

### Add vercel.json

Create `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Optimize Vite Build

Update `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['gsap', 'framer-motion'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

---

## Monitoring & Debugging

### Add Performance Monitoring

Create `frontend/src/utils/performance.js`:

```javascript
export const measurePageLoad = () => {
  window.addEventListener('load', () => {
    const perfData = window.performance.timing
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
    
    console.log(`Page load time: ${pageLoadTime}ms`)
    
    // Send to analytics if needed
  })
}
```

### Check Bundle Size

```bash
cd frontend
npm run build
npx vite-bundle-visualizer
```

---

## Quick Wins Checklist

- [ ] Lazy load heavy components
- [ ] Add loading skeletons
- [ ] Disable particles on mobile
- [ ] Implement API caching
- [ ] Add response compression
- [ ] Optimize GSAP animations
- [ ] Add database indexes
- [ ] Enable pagination
- [ ] Set up keep-alive for Render
- [ ] Optimize Vite build

---

## Expected Improvements

| Optimization | Impact | Time to Implement |
|--------------|--------|-------------------|
| Lazy loading | 40-50% faster initial load | 15 min |
| API caching | 60-70% faster subsequent loads | 20 min |
| Disable particles (mobile) | 30-40% faster on mobile | 5 min |
| Response compression | 20-30% faster | 5 min |
| Keep-alive service | Eliminates cold starts | 10 min |
| Code splitting | 30-40% smaller bundles | 15 min |

**Total time**: ~1.5 hours
**Expected result**: 2-3x faster loading

---

## Immediate Action

1. **Add lazy loading** (biggest impact, easiest fix)
2. **Set up keep-alive** (eliminates cold starts)
3. **Enable compression** (quick win)
4. **Add caching** (huge improvement for repeat visits)

These 4 changes will make the biggest difference!
