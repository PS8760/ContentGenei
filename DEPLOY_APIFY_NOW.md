# Deploy Apify Integration - Quick Guide

## ✅ What's Been Done

1. ✅ Added Apify API key to `backend/.env`
2. ✅ Created `backend/services/apify_service.py` with Instagram scraping
3. ✅ Updated `backend/routes/analytics.py` to use Apify
4. ✅ Added username extraction from URLs
5. ✅ Added AI-powered insights generation
6. ✅ Mobile responsive design complete
7. ✅ Coming Soon badges added

## 🚀 Deploy to AWS

### Option 1: Use the Deployment Script

```bash
cd ContentGenei
./deploy-mobile-fixes.sh
```

### Option 2: Manual Deployment

```bash
# 1. Commit changes
git add .
git commit -m "Add Apify integration for real Instagram data"
git push origin main

# 2. Deploy to AWS
ssh -i ~/contentgenei-key.pem ubuntu@3.235.236.139 << 'EOF'
cd ~/ContentGenei
git pull origin main

# Stop backend
pkill -f 'python.*app.py'

# Start backend with new Apify service
cd backend
source venv/bin/activate
nohup python app.py > backend.log 2>&1 &
sleep 3

# Rebuild frontend
cd ../frontend
npm run build

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Deployment complete!"
EOF
```

## 🧪 Test Instagram Scraping

### Test 1: Connect Instagram Account

1. Go to http://3.235.236.139
2. Login to your account
3. Navigate to Social Analytics
4. Click Instagram platform
5. Enter: `https://instagram.com/instagram`
6. Click "Connect & Analyze"
7. Wait 30-60 seconds for scraping
8. View real Instagram data!

### Test 2: Check Backend Logs

```bash
ssh -i ~/contentgenei-key.pem ubuntu@3.235.236.139
cd ~/ContentGenei/backend
tail -f backend.log
```

Look for:
- "Starting Apify scrape for Instagram user: ..."
- "Apify run started: ..."
- "Apify run status: SUCCEEDED"

### Test 3: API Health Check

```bash
curl http://3.235.236.139/api/health
```

Should return:
```json
{
  "status": "healthy",
  "message": "ContentGenie API is running",
  "version": "1.0.0",
  "environment": "production"
}
```

## 📊 What You'll See

### Real Instagram Data
- ✅ Follower count
- ✅ Following count
- ✅ Post count
- ✅ Engagement rate
- ✅ Profile picture
- ✅ Verification status
- ✅ Bio and full name

### AI-Powered Insights
- 🎯 Follower-to-following ratio analysis
- 📈 Posting frequency recommendations
- 🔥 Engagement rate feedback
- 🌟 Milestone achievements
- 📸 Content strategy tips

## 🐛 Troubleshooting

### Issue: "Apify API key not configured"
**Solution**: Check that `.env` file has the correct key
```bash
ssh -i ~/contentgenei-key.pem ubuntu@3.235.236.139
cd ~/ContentGenei/backend
grep APIFY_API_KEY .env
```

### Issue: "Timeout waiting for scraper results"
**Solution**: Instagram profile might be private or rate limited
- Try a different public profile
- Wait a few minutes and try again
- Check Apify dashboard for usage limits

### Issue: "Profile may be private or not found"
**Solution**: 
- Verify the Instagram username is correct
- Make sure the profile is public
- Try with a well-known public profile (e.g., @instagram)

### Issue: Backend not starting
**Solution**: Check logs
```bash
ssh -i ~/contentgenei-key.pem ubuntu@3.235.236.139
cd ~/ContentGenei/backend
cat backend.log
```

## 💰 Apify Usage & Costs

### Current Plan
- Free tier: 5 actor runs per month
- After free tier: ~$0.25 per 1000 profiles

### Monitor Usage
1. Go to https://console.apify.com
2. Login with your account
3. Check "Usage" tab
4. View actor runs and costs

### Optimize Costs
1. ✅ Cache results for 24 hours (implement later)
2. ✅ Limit refreshes to once per day
3. ✅ Show cached data when available
4. ✅ Add rate limiting per user

## 🎯 Next Steps

### Immediate
1. Deploy the changes
2. Test with real Instagram profile
3. Verify data accuracy
4. Check Apify usage

### Short Term
1. Add data caching to reduce API calls
2. Implement refresh rate limiting
3. Add more detailed analytics
4. Create analytics charts

### Long Term
1. Add LinkedIn scraping (requires LinkedIn auth)
2. Add Twitter/X scraping
3. Add YouTube scraping
4. Add historical data tracking
5. Add comparison features
6. Add export functionality

## 📱 Mobile Testing

After deployment, test on mobile:

1. Open http://3.235.236.139 on your phone
2. Navigate to Social Analytics
3. Verify:
   - ✅ Platform cards are responsive
   - ✅ "Coming Soon" badges visible
   - ✅ Instagram is clickable
   - ✅ Other platforms show error
   - ✅ Data displays correctly
   - ✅ Dates format properly
   - ✅ Mobile menu works

## 🎉 Success Criteria

You'll know it's working when:
- ✅ Instagram profile connects successfully
- ✅ Real follower/following counts display
- ✅ Engagement rate shows
- ✅ AI insights appear
- ✅ Profile picture loads
- ✅ No "Invalid Date" errors
- ✅ Mobile layout looks good
- ✅ Coming Soon badges show for other platforms

## 📞 Support

If you encounter issues:
1. Check backend logs: `tail -f ~/ContentGenei/backend/backend.log`
2. Check Apify console: https://console.apify.com
3. Review error messages in browser console
4. Verify API key is correct in `.env`

## 🌐 Live URLs

- **Frontend**: http://3.235.236.139
- **Backend API**: http://3.235.236.139/api
- **Health Check**: http://3.235.236.139/api/health
- **Apify Console**: https://console.apify.com

---

**Ready to deploy?** Run `./deploy-mobile-fixes.sh` and test with a real Instagram profile!
