# AWS Deployment Instructions

## Current Configuration

**Frontend URL:** `http://3.235.236.139/`  
**Backend URL:** `http://3.235.236.139/api`  
**Frontend connects to:** `http://3.235.236.139` (configured in frontend/.env)

## Deployment Steps

### 1. SSH to AWS Instance

```bash
ssh -i ~/Downloads/contentgenie-key.pem ec2-user@3.235.236.139
```

If that doesn't work, try:
```bash
ssh -i ~/Downloads/contentgenie-key.pem ubuntu@3.235.236.139
```

### 2. Pull Latest Code

```bash
cd ContentGenei
git pull origin main
```

### 3. Deploy Backend

```bash
cd backend

# Install/update dependencies
pip install -r requirements.txt

# Check if backend is running
ps aux | grep python

# If running, stop it
pkill -f "python.*app.py"

# Start backend (production mode)
nohup python app.py > backend.log 2>&1 &

# Check if it started
tail -f backend.log
# Press Ctrl+C to exit log view

# Test backend
curl http://localhost:5001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "ContentGenie API is running",
  "version": "1.0.0"
}
```

### 4. Deploy Frontend

```bash
cd ../frontend

# Install dependencies (if needed)
npm install

# Build frontend
npm run build

# The dist folder is now ready to serve
```

### 5. Configure Nginx (if using)

If you're using Nginx as a reverse proxy:

```bash
sudo nano /etc/nginx/sites-available/contentgenei
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name 3.235.236.139;

    # Frontend
    location / {
        root /home/ec2-user/ContentGenei/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/contentgenei /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Verify Deployment

From your local machine:

```bash
# Test backend
curl http://3.235.236.139/api/health

# Test frontend (should return HTML)
curl http://3.235.236.139/
```

Open in browser:
```
http://3.235.236.139/
```

## Troubleshooting

### Frontend shows loading screen

**Check 1: Is backend running?**
```bash
ssh -i ~/Downloads/contentgenie-key.pem ec2-user@3.235.236.139
ps aux | grep python
```

**Check 2: Can backend be reached?**
```bash
curl http://3.235.236.139/api/health
```

**Check 3: Check backend logs**
```bash
cd ~/ContentGenei/backend
tail -100 backend.log
```

**Check 4: Browser console errors**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab to see if API calls are failing

### Backend not responding

**Restart backend:**
```bash
cd ~/ContentGenei/backend
pkill -f "python.*app.py"
nohup python app.py > backend.log 2>&1 &
tail -f backend.log
```

### CORS errors

Backend is already configured to allow all origins. If you still see CORS errors:

```bash
cd ~/ContentGenei/backend
nano .env
```

Add:
```
CORS_ORIGINS=http://3.235.236.139,http://localhost:5173
```

Restart backend.

## Quick Deploy Script

Save this as `deploy.sh` on your AWS instance:

```bash
#!/bin/bash
cd ~/ContentGenei

echo "Pulling latest code..."
git pull origin main

echo "Stopping backend..."
pkill -f "python.*app.py"

echo "Starting backend..."
cd backend
nohup python app.py > backend.log 2>&1 &
sleep 2

echo "Building frontend..."
cd ../frontend
npm run build

echo "Deployment complete!"
echo ""
echo "Backend log:"
tail -20 ~/ContentGenei/backend/backend.log
echo ""
echo "Test backend: curl http://localhost:5001/api/health"
echo "Open frontend: http://3.235.236.139/"
```

Make it executable:
```bash
chmod +x deploy.sh
```

Run it:
```bash
./deploy.sh
```

## Security Notes

1. **Use HTTPS in production** - Set up SSL certificate with Let's Encrypt
2. **Set strong SECRET_KEY** in backend/.env
3. **Configure firewall** - Only allow ports 80, 443, and 22
4. **Use environment variables** - Never commit .env files

## Next Steps After Deployment

1. Test login functionality
2. Test LinkoGenei extension with new backend
3. Generate token from: `http://3.235.236.139/linkogenei`
4. Update extension to use AWS backend (already configured)
