#!/bin/bash

# ContentGenei AWS Deployment Script
# This script deploys the latest code to AWS with Groq API key configured

echo "🚀 Starting ContentGenei Deployment to AWS..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
AWS_IP="3.235.236.139"
AWS_USER="ubuntu"
KEY_FILE="~/Downloads/contentgenie-key.pem"

echo -e "${BLUE}Step 1: Connecting to AWS...${NC}"
ssh -i $KEY_FILE $AWS_USER@$AWS_IP << 'ENDSSH'

echo "✅ Connected to AWS instance"
echo ""

echo "📥 Step 2: Pulling latest code..."
cd ~/ContentGenei
git pull origin main
echo "✅ Code updated"
echo ""

echo "🔧 Step 3: Updating backend .env..."
cd backend

# Prompt for Groq API key
echo "Please enter your Groq API key:"
read -s GROQ_KEY

# Create .env file
cat > .env << EOF
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=contentgenei-production-secret-key-2026
JWT_SECRET_KEY=contentgenei-jwt-secret-key-2026

# Database Configuration
DATABASE_URL=sqlite:///contentgenie.db

# Groq API Configuration (for AI content generation)
GROQ_API_KEY=$GROQ_KEY

# Apify Configuration (for social analytics)
APIFY_API_KEY=your-apify-api-key-here

# CORS Configuration
CORS_ORIGINS=http://3.235.236.139,http://localhost:5173
EOF

echo "✅ .env file updated"
echo ""

echo "🔄 Step 4: Restarting backend..."
# Stop existing backend
pkill -f "python.*app.py" 2>/dev/null || true
sleep 2

# Start backend
source venv/bin/activate
nohup python app.py > backend.log 2>&1 &
sleep 3

# Check if backend started
if ps aux | grep -v grep | grep "python.*app.py" > /dev/null; then
    echo "✅ Backend started successfully"
else
    echo "❌ Backend failed to start. Check logs:"
    tail -20 backend.log
    exit 1
fi
echo ""

echo "🏗️  Step 5: Building frontend..."
cd ../frontend
npm run build
echo "✅ Frontend built"
echo ""

echo "🔄 Step 6: Reloading Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

echo "🧪 Step 7: Testing deployment..."
# Test backend
HEALTH_CHECK=$(curl -s http://localhost:5001/api/health)
if echo "$HEALTH_CHECK" | grep -q "healthy"; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    echo "Response: $HEALTH_CHECK"
fi

# Test frontend
if curl -s http://localhost/ | grep -q "ContentGenei"; then
    echo "✅ Frontend is serving"
else
    echo "⚠️  Frontend check inconclusive"
fi
echo ""

echo "📊 Step 8: Checking backend logs..."
echo "Last 10 lines of backend log:"
tail -10 ~/ContentGenei/backend/backend.log
echo ""

echo "✅ Deployment Complete!"
echo ""
echo "🌐 Your application is now live at:"
echo "   Frontend: http://3.235.236.139/"
echo "   Backend:  http://3.235.236.139/api/health"
echo ""
echo "📝 Next steps:"
echo "   1. Test AI content generation in Creator tab"
echo "   2. Get Apify API key from: https://console.apify.com/"
echo "   3. Add Apify key to .env for social analytics"
echo ""

ENDSSH

echo -e "${GREEN}🎉 Deployment script completed!${NC}"
echo ""
echo "Test your deployment:"
echo "  curl http://3.235.236.139/api/health"
echo "  open http://3.235.236.139/"
