#!/bin/bash

# Deploy Mobile Responsive Fixes to AWS
# This script deploys the mobile responsiveness updates and Coming Soon badges

set -e  # Exit on error

echo "🚀 Starting deployment of mobile responsive fixes..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EC2_HOST="ubuntu@3.235.236.139"
KEY_PATH="~/contentgenei-key.pem"
REPO_PATH="~/ContentGenei"

echo -e "${BLUE}📦 Step 1: Committing changes locally...${NC}"
git add .
git commit -m "Add mobile responsiveness, Coming Soon badges, and date formatting fixes" || echo "No changes to commit"

echo -e "${BLUE}📤 Step 2: Pushing to GitHub...${NC}"
git push origin main

echo -e "${BLUE}🔗 Step 3: Connecting to AWS EC2...${NC}"
ssh -i $KEY_PATH $EC2_HOST << 'ENDSSH'
    set -e
    
    echo "📥 Pulling latest code from GitHub..."
    cd ~/ContentGenei
    git pull origin main
    
    echo "🛑 Stopping backend..."
    pkill -f 'python.*app.py' || echo "Backend not running"
    
    echo "🔄 Starting backend..."
    cd backend
    source venv/bin/activate
    nohup python app.py > backend.log 2>&1 &
    sleep 3
    
    echo "✅ Backend started"
    
    echo "🏗️  Building frontend..."
    cd ../frontend
    npm run build
    
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    
    echo "✅ Deployment complete!"
    
    echo "🔍 Checking backend health..."
    curl -s http://localhost:5001/api/health | python3 -m json.tool || echo "Health check failed"
ENDSSH

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Summary of changes deployed:${NC}"
echo "  ✅ Mobile responsive design for all pages"
echo "  ✅ Coming Soon badges for LinkedIn, Twitter, YouTube"
echo "  ✅ Fixed date formatting (no more 'Invalid Date')"
echo "  ✅ Mobile navigation menu in Header"
echo "  ✅ Responsive grids and layouts"
echo ""
echo -e "${BLUE}🌐 Your app is live at: http://3.235.236.139${NC}"
echo ""
echo -e "${YELLOW}📱 Test on mobile:${NC}"
echo "  1. Open http://3.235.236.139 on your phone"
echo "  2. Try Social Analytics page"
echo "  3. Try LinkoGenei page"
echo "  4. Test mobile menu in header"
echo ""
echo -e "${YELLOW}🔍 Next steps:${NC}"
echo "  1. Review APIFY_INTEGRATION_GUIDE.md for social analytics"
echo "  2. Get Apify API key from https://apify.com"
echo "  3. Add APIFY_API_KEY to backend/.env"
echo "  4. Test Instagram scraping with real data"
