# Quick Deploy - ContentGenei AWS

## 🚀 Deploy in 5 Minutes

### 1️⃣ Backend (2 min)
```bash
ssh -i your-key.pem ec2-user@52.71.190.153
cd /path/to/ContentGenei/backend
git pull origin main
pm2 restart contentgenei-backend
```

### 2️⃣ Frontend (2 min)
```bash
cd /path/to/ContentGenei/frontend
git pull origin main
npm install && npm run build
sudo cp -r dist/* /var/www/contentgenei/
```

### 3️⃣ Extension (1 min)
1. Chrome: `chrome://extensions/`
2. Load unpacked: `ContentGenei/extension/`
3. Done!

---

## ✅ Test (1 min)

```bash
# Backend
curl http://52.71.190.153/api/health

# Frontend
open http://52.71.190.153/

# Extension
# 1. Go to http://52.71.190.153/linkogenei
# 2. Generate token
# 3. Activate extension
# 4. Save a post from Instagram
```

---

## 🔑 Key URLs

- **Backend:** `http://52.71.190.153/api`
- **Frontend:** `http://52.71.190.153/`
- **LinkoGenei:** `http://52.71.190.153/linkogenei`
- **Analytics:** `http://52.71.190.153/analytics`

---

## 📝 What Changed

- ✅ Fixed LinkoGenei posts display bug
- ✅ Added Content Analytics with detailed analysis
- ✅ Enhanced Analytics with tabs
- ✅ Extension configured for AWS
- ✅ Comprehensive logging added

---

## 🐛 Quick Fixes

**CORS Error?**
```bash
# Add to backend .env
CORS_ORIGINS=http://52.71.190.153,https://52.71.190.153
pm2 restart contentgenei-backend
```

**Token Invalid?**
- Generate new token from dashboard
- Re-activate extension

**Posts Not Showing?**
- Already fixed! Just deploy latest code

---

## 📚 Full Guides

- `AWS_DEPLOYMENT_GUIDE.md` - Detailed steps
- `EXTENSION_UPDATE_GUIDE.md` - Extension setup
- `FINAL_DEPLOYMENT_STATUS.md` - Complete status

---

**Ready to deploy!** 🎉
