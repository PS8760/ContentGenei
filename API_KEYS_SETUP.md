# API Keys Setup Guide

## Required API Keys

Your ContentGenei application needs two API keys to function fully:

1. **Groq API** - For AI content generation
2. **Apify API** - For social media analytics

---

## 1. Get Groq API Key (Free)

### Step 1: Sign Up
1. Go to: https://console.groq.com/
2. Click "Sign Up" or "Get Started"
3. Create account with email

### Step 2: Get API Key
1. After login, go to: https://console.groq.com/keys
2. Click "Create API Key"
3. Give it a name: "ContentGenei Production"
4. Copy the API key (starts with `gsk_...`)

### Step 3: Add to AWS Backend
```bash
# SSH to AWS
ssh -i ~/Downloads/contentgenie-key.pem ubuntu@3.235.236.139

# Edit .env file
cd ~/ContentGenei/backend
nano .env
```

Update this line:
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
```

Save: `Ctrl+X`, `Y`, `Enter`

---

## 2. Get Apify API Key (Free Tier Available)

### Step 1: Sign Up
1. Go to: https://apify.com/
2. Click "Sign Up Free"
3. Create account

### Step 2: Get API Key
1. After login, go to: https://console.apify.com/account/integrations
2. Under "API tokens", you'll see your token
3. Or click "Create new token"
4. Copy the API key

### Step 3: Add to AWS Backend
```bash
# Edit .env file (if not already open)
cd ~/ContentGenei/backend
nano .env
```

Update this line:
```env
APIFY_API_KEY=apify_api_your_actual_apify_key_here
```

Save: `Ctrl+X`, `Y`, `Enter`

---

## 3. Complete .env Configuration

Your `/home/ubuntu/ContentGenei/backend/.env` should look like this:

```env
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=contentgenei-production-secret-key-2026
JWT_SECRET_KEY=contentgenei-jwt-secret-key-2026

# Database Configuration
DATABASE_URL=sqlite:///contentgenie.db

# Groq API Configuration (for AI content generation)
GROQ_API_KEY=gsk_your_actual_groq_api_key_here

# Apify Configuration (for social analytics)
APIFY_API_KEY=apify_api_your_actual_apify_key_here

# CORS Configuration
CORS_ORIGINS=http://3.235.236.139,http://localhost:5173

# Firebase Configuration (optional)
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
```

---

## 4. Restart Backend

After adding the API keys:

```bash
# Stop current backend
pkill -f "python.*app.py"

# Restart backend
cd ~/ContentGenei/backend
source venv/bin/activate
nohup python app.py > backend.log 2>&1 &

# Check if it started
tail -20 backend.log

# Test
curl http://localhost:5001/api/health
```

---

## 5. Test AI Content Generation

### From Browser Console (F12):
```javascript
fetch('http://3.235.236.139/api/content/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  },
  body: JSON.stringify({
    prompt: 'Write a blog post about AI',
    content_type: 'blog_post',
    tone: 'professional'
  })
})
.then(r => r.json())
.then(console.log)
```

### Expected Response:
```json
{
  "success": true,
  "content": "Generated content here...",
  "model_used": "openai/gpt-oss-120b",
  "generation_time": 2.5,
  "word_count": 250
}
```

---

## 6. Test Social Analytics

### From Browser:
1. Go to: http://3.235.236.139/analytics
2. Click on "Social Analytics" tab
3. Enter a social media URL
4. Click "Analyze"

If Apify is configured correctly, you'll see:
- Engagement metrics
- Follower stats
- Post performance data

---

## Troubleshooting

### AI Generation Not Working

**Check 1: Is Groq API key set?**
```bash
cd ~/ContentGenei/backend
grep GROQ_API_KEY .env
```

**Check 2: Check backend logs**
```bash
tail -50 backend.log | grep -i groq
```

**Check 3: Test Groq API directly**
```bash
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer YOUR_GROQ_API_KEY"
```

### Social Analytics Not Working

**Check 1: Is Apify API key set?**
```bash
cd ~/ContentGenei/backend
grep APIFY_API_KEY .env
```

**Check 2: Test Apify API**
```bash
curl https://api.apify.com/v2/acts \
  -H "Authorization: Bearer YOUR_APIFY_API_KEY"
```

### Backend Not Restarting

```bash
# Check if process is running
ps aux | grep python

# Force kill if needed
pkill -9 -f "python.*app.py"

# Check for errors
cd ~/ContentGenei/backend
cat backend.log
```

---

## API Key Limits

### Groq Free Tier:
- 14,400 requests per day
- 30 requests per minute
- Sufficient for development and small production use

### Apify Free Tier:
- $5 free credit per month
- Good for testing and light usage
- Upgrade for production use

---

## Security Best Practices

1. **Never commit .env files to git**
   ```bash
   # Already in .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use strong secret keys**
   ```bash
   # Generate random secret
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```

3. **Rotate API keys regularly**
   - Change keys every 3-6 months
   - Immediately if compromised

4. **Monitor API usage**
   - Check Groq dashboard: https://console.groq.com/
   - Check Apify dashboard: https://console.apify.com/

---

## Quick Setup Commands

```bash
# SSH to AWS
ssh -i ~/Downloads/contentgenie-key.pem ubuntu@3.235.236.139

# Edit .env
cd ~/ContentGenei/backend
nano .env

# Add your keys:
# GROQ_API_KEY=gsk_...
# APIFY_API_KEY=apify_api_...

# Save and restart
pkill -f "python.*app.py"
source venv/bin/activate
nohup python app.py > backend.log 2>&1 &

# Test
curl http://localhost:5001/api/health
```

---

## Next Steps

After setting up API keys:

1. ✅ Test AI content generation in Creator tab
2. ✅ Test social analytics in Analytics tab
3. ✅ Verify all CRUD operations work
4. ✅ Test LinkoGenei extension
5. ✅ Create sample content

---

## Support

If you encounter issues:
1. Check backend logs: `tail -100 ~/ContentGenei/backend/backend.log`
2. Check browser console (F12)
3. Verify API keys are correct
4. Ensure backend is running: `ps aux | grep python`
