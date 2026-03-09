# AWS Connection & Deployment Guide

## 🔑 Your AWS Key File

**Location:** `~/Downloads/contentgenie-key.pem`  
**Permissions:** ✅ Correct (400)

---

## 🔍 Troubleshooting SSH Connection

### Issue: Connection Timeout

The SSH connection to `52.71.190.153` is timing out. Here's how to fix it:

### Step 1: Check EC2 Instance Status

1. **Login to AWS Console:**
   - Go to: https://console.aws.amazon.com/
   - Navigate to: EC2 → Instances

2. **Check Instance State:**
   - Find your instance (IP: 52.71.190.153)
   - Status should be: **Running** (green)
   - If stopped: Click "Instance State" → "Start Instance"

### Step 2: Verify Security Group

1. **In AWS Console:**
   - Select your EC2 instance
   - Click "Security" tab
   - Click on the Security Group link

2. **Check Inbound Rules:**
   - Should have SSH rule (Port 22)
   - Source: Your IP or 0.0.0.0/0

3. **Add SSH Rule if Missing:**
   ```
   Type: SSH
   Protocol: TCP
   Port: 22
   Source: My IP (or 0.0.0.0/0 for testing)
   ```

### Step 3: Verify Username

Try different usernames:

```bash
# Try ec2-user (Amazon Linux)
ssh -i ~/Downloads/contentgenie-key.pem ec2-user@52.71.190.153

# Try ubuntu (Ubuntu)
ssh -i ~/Downloads/contentgenie-key.pem ubuntu@52.71.190.153

# Try admin (Debian)
ssh -i ~/Downloads/contentgenie-key.pem admin@52.71.190.153
```

### Step 4: Test Connection

```bash
# Test if port 22 is open
nc -zv 52.71.190.153 22

# Or use telnet
telnet 52.71.190.153 22
```

---

## 🚀 Once Connected - Deployment Steps

### Find Your Application

```bash
# After SSH connection succeeds
cd ~
find . -name "ContentGenei" -type d 2>/dev/null

# Or check common locations
ls -la /home/ec2-user/
ls -la /var/www/
ls -la /opt/
```

### Deploy Backend

```bash
# Navigate to backend directory
cd /path/to/ContentGenei/backend

# Pull latest code
git pull origin main

# Check if using PM2
pm2 list

# Restart with PM2
pm2 restart contentgenei-backend
pm2 logs contentgenei-backend

# OR if using systemd
sudo systemctl restart contentgenei-backend
sudo systemctl status contentgenei-backend

# OR if running manually
# Stop current process (Ctrl+C)
source venv/bin/activate
python app.py
```

### Deploy Frontend

```bash
# Navigate to frontend directory
cd /path/to/ContentGenei/frontend

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Check where frontend is served from
# Common locations:
# - /var/www/html/
# - /var/www/contentgenei/
# - /usr/share/nginx/html/

# Copy build files
sudo cp -r dist/* /var/www/contentgenei/

# Restart web server
sudo systemctl restart nginx
# OR
sudo systemctl restart apache2
```

---

## 🔧 Alternative: Deploy Without SSH

If you can't SSH, you can deploy through AWS Console:

### Option 1: AWS Systems Manager (Session Manager)

1. Go to AWS Console → Systems Manager → Session Manager
2. Click "Start Session"
3. Select your instance
4. Run commands in browser terminal

### Option 2: EC2 Instance Connect

1. Go to AWS Console → EC2 → Instances
2. Select your instance
3. Click "Connect" button
4. Choose "EC2 Instance Connect"
5. Click "Connect" (opens browser terminal)

### Option 3: AWS CodeDeploy

Set up automated deployment from GitHub

---

## 🧪 Test Backend Without SSH

### Check if Backend is Running

```bash
# From your local machine
curl http://52.71.190.153/api/health

# Expected response:
# {"status": "healthy", "message": "ContentGenie API is running", ...}
```

### Check Frontend

```bash
# Open in browser
open http://52.71.190.153/

# Or test with curl
curl -I http://52.71.190.153/
```

---

## 📝 Manual Deployment Checklist

If backend is already running and you just need to update code:

### Backend Update (via AWS Console):

1. **Connect via EC2 Instance Connect**
2. **Run these commands:**
   ```bash
   cd /path/to/ContentGenei/backend
   git pull origin main
   pm2 restart contentgenei-backend
   ```

### Frontend Update (via AWS Console):

1. **Connect via EC2 Instance Connect**
2. **Run these commands:**
   ```bash
   cd /path/to/ContentGenei/frontend
   git pull origin main
   npm install
   npm run build
   sudo cp -r dist/* /var/www/contentgenei/
   sudo systemctl restart nginx
   ```

---

## 🔍 Find Application Path

If you don't know where ContentGenei is installed:

```bash
# After connecting to EC2
# Search for ContentGenei directory
find / -name "ContentGenei" -type d 2>/dev/null

# Search for app.py
find / -name "app.py" -path "*/ContentGenei/*" 2>/dev/null

# Check PM2 processes
pm2 list
pm2 info contentgenei-backend

# Check systemd services
systemctl list-units | grep contentgenei

# Check nginx config
cat /etc/nginx/sites-enabled/default
cat /etc/nginx/nginx.conf
```

---

## 🎯 Quick Test - Is Update Needed?

### Check Current Version

```bash
# Test backend
curl http://52.71.190.153/api/linkogenei/test

# If this works, backend is running
# If it returns 404 or error, backend needs update
```

### Check Frontend

```bash
# Open in browser
http://52.71.190.153/linkogenei

# Check if:
# - Page loads
# - Can generate token
# - Analytics tab has Content/Social tabs
```

---

## 💡 If Backend is Already Updated

If your backend is already running the latest code:

### Just Update Extension

1. **Load Extension in Chrome:**
   ```
   chrome://extensions/
   → Load unpacked
   → Select: ContentGenei/extension/
   ```

2. **Activate Extension:**
   ```
   → Go to: http://52.71.190.153/linkogenei
   → Generate token
   → Click extension icon
   → Paste token
   → Activate
   ```

3. **Test:**
   ```
   → Go to Instagram
   → Click "Save to Genei" button
   → Check dashboard for saved post
   ```

---

## 📞 Next Steps

1. **Fix SSH Connection:**
   - Check EC2 instance is running
   - Verify security group allows SSH
   - Try different usernames

2. **Or Use AWS Console:**
   - EC2 Instance Connect
   - Systems Manager Session Manager

3. **Or Test Current Deployment:**
   - Check if backend already has updates
   - Just load extension and test

4. **Contact AWS Support:**
   - If still can't connect
   - They can help with SSH access

---

## 🔑 SSH Command Reference

```bash
# Correct command with your key
ssh -i ~/Downloads/contentgenie-key.pem ec2-user@52.71.190.153

# With verbose output (for debugging)
ssh -v -i ~/Downloads/contentgenie-key.pem ec2-user@52.71.190.153

# Test connection only
ssh -i ~/Downloads/contentgenie-key.pem ec2-user@52.71.190.153 "echo 'Connected!'"
```

---

## ✅ Success Indicators

You'll know deployment worked when:

- [ ] Backend responds: `curl http://52.71.190.153/api/health`
- [ ] Frontend loads: `http://52.71.190.153/`
- [ ] LinkoGenei page works
- [ ] Can generate token
- [ ] Extension activates
- [ ] Can save posts
- [ ] Posts appear in dashboard

---

**Need Help?**

1. Check EC2 instance status in AWS Console
2. Try EC2 Instance Connect (browser-based)
3. Test if backend is already updated
4. Load extension and test functionality
