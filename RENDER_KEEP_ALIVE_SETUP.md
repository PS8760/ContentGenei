# Render Keep-Alive Setup

## Problem
Render free tier spins down after 15 minutes of inactivity, causing 30-60 second cold starts on the first request.

## Solution
Use a free external service to ping your backend every 10 minutes.

---

## Option 1: UptimeRobot (Recommended)

### Setup (5 minutes):

1. **Go to**: https://uptimerobot.com/
2. **Sign up** for free account
3. **Add New Monitor**:
   - Monitor Type: HTTP(s)
   - Friendly Name: ContentGenei Backend
   - URL: `https://contentgenei.onrender.com/api/health`
   - Monitoring Interval: 5 minutes (free tier)
4. **Save**

That's it! Your backend will stay warm.

---

## Option 2: Cron-job.org

### Setup:

1. **Go to**: https://cron-job.org/
2. **Sign up** for free
3. **Create New Cronjob**:
   - Title: ContentGenei Keep-Alive
   - URL: `https://contentgenei.onrender.com/api/health`
   - Schedule: Every 10 minutes
4. **Save**

---

## Option 3: GitHub Actions (Free)

Create `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Backend Alive

on:
  schedule:
    # Run every 10 minutes
    - cron: '*/10 * * * *'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: |
          curl -f https://contentgenei.onrender.com/api/health || exit 0
```

Commit and push. GitHub will ping your backend automatically.

---

## Option 4: Render Paid Plan

**Cost**: $7/month
**Benefit**: Always-on, no cold starts, better performance

Upgrade at: https://dashboard.render.com/

---

## Verify It's Working

1. Wait 20 minutes without accessing your app
2. Visit: https://contentgenei.onrender.com/api/health
3. Should load instantly (not 30-60 seconds)

---

## Recommended: UptimeRobot

- Free forever
- 5-minute intervals
- Email alerts if backend goes down
- Simple setup
- No code changes needed

**Setup time**: 5 minutes
**Cost**: Free
**Impact**: Eliminates cold starts completely

---

## Additional Benefits

With keep-alive service:
- ✅ No more 30-60 second waits
- ✅ Consistent performance
- ✅ Better user experience
- ✅ Uptime monitoring included
- ✅ Email alerts for downtime

---

## Quick Start

1. Go to https://uptimerobot.com/
2. Sign up (free)
3. Add monitor for: `https://contentgenei.onrender.com/api/health`
4. Set interval to 5 minutes
5. Done!

Your backend will now stay warm 24/7.
