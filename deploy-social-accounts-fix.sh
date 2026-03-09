#!/bin/bash

# Deploy Social Accounts Persistence Fix to AWS
# This script deploys the fixes for social account persistence and LinkoGenei

set -e

echo "🚀 Deploying Social Accounts Persistence Fix to AWS..."
echo "=================================================="

# AWS EC2 details
EC2_IP="3.235.236.139"
EC2_USER="ubuntu"
PROJECT_DIR="/home/ubuntu/ContentGenei"

echo ""
echo "📦 Step 1: Committing changes to git..."
git add .
git commit -m "Fix: Add social account persistence, delete functionality, and enhanced Instagram analytics" || echo "No changes to commit"
git push origin main || echo "Already up to date"

echo ""
echo "🔄 Step 2: Connecting to AWS and pulling latest code..."
ssh ${EC2_USER}@${EC2_IP} << 'ENDSSH'
cd /home/ubuntu/ContentGenei
echo "Pulling latest code..."
git pull origin main

echo ""
echo "🗄️  Step 3: Running database migration..."
cd backend
source venv/bin/activate
python3 migrate_add_social_accounts.py

echo ""
echo "🔄 Step 4: Restarting backend service..."
sudo systemctl restart contentgenei-backend
sleep 3
sudo systemctl status contentgenei-backend --no-pager

echo ""
echo "🎨 Step 5: Rebuilding frontend..."
cd ../frontend
npm run build

echo ""
echo "📋 Step 6: Copying frontend build to Nginx..."
sudo rm -rf /var/www/contentgenei/*
sudo cp -r dist/* /var/www/contentgenei/

echo ""
echo "🔄 Step 7: Reloading Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "=================================================="
echo "✅ Social Accounts Fix Deployed Successfully!"
echo "=================================================="
echo ""
echo "🌐 Application URL: http://${EC2_IP}/"
echo ""
echo "📝 Changes deployed:"
echo "  ✓ Added SocialAccount model to database"
echo "  ✓ Social accounts now persist across page refreshes"
echo "  ✓ Added delete functionality for connected accounts"
echo "  ✓ Enhanced Instagram analytics with more parameters:"
echo "    - Average likes and comments per post"
echo "    - Total engagement metrics"
echo "    - Business account detection"
echo "    - Account category information"
echo "  ✓ Fixed refresh functionality to update account data"
echo "  ✓ Improved error handling and user feedback"
echo ""
echo "🧪 Test the following:"
echo "  1. Connect an Instagram account"
echo "  2. Refresh the page - account should still be there"
echo "  3. Click the X button to delete an account"
echo "  4. Click Refresh button to update account metrics"
echo "  5. View enhanced analytics with more parameters"
echo ""
echo "📊 Database Migration:"
echo "  - New table: social_accounts"
echo "  - Stores: platform, username, metrics, profile data"
echo "  - Unique constraint: user_id + platform + username"
echo ""
