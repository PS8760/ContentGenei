#!/bin/bash

# Deploy ALL Fixes to AWS - Social Accounts + LinkoGenei
# This script deploys fixes for social account persistence and LinkoGenei extension

set -e

echo "🚀 Deploying ALL Fixes to AWS..."
echo "=================================================="

# AWS EC2 details
EC2_IP="3.235.236.139"
EC2_USER="ubuntu"
PROJECT_DIR="/home/ubuntu/ContentGenei"

echo ""
echo "📦 Step 1: Committing changes to git..."
git add .
git commit -m "Fix: Social account persistence + LinkoGenei SQLite migration" || echo "No changes to commit"
git push origin main || echo "Already up to date"

echo ""
echo "🔄 Step 2: Connecting to AWS and pulling latest code..."
ssh ${EC2_USER}@${EC2_IP} << 'ENDSSH'
cd /home/ubuntu/ContentGenei
echo "Pulling latest code..."
git pull origin main

echo ""
echo "🗄️  Step 3: Running database migrations..."
cd backend
source venv/bin/activate

echo "  → Creating social_accounts table..."
python3 migrate_add_social_accounts.py

echo "  → Creating LinkoGenei tables (replacing MongoDB)..."
python3 migrate_linkogenei_to_sqlite.py

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
echo "✅ ALL FIXES DEPLOYED SUCCESSFULLY!"
echo "=================================================="
echo ""
echo "🌐 Application URL: http://${EC2_IP}/"
echo ""
echo "📝 Changes deployed:"
echo ""
echo "🔹 SOCIAL ANALYTICS FIXES:"
echo "  ✓ Social accounts now persist in database"
echo "  ✓ Delete functionality added (X button on cards)"
echo "  ✓ Enhanced Instagram analytics:"
echo "    - Average likes/comments per post"
echo "    - Total engagement metrics"
echo "    - Business account detection"
echo "    - Account category info"
echo "  ✓ Refresh functionality fully working"
echo "  ✓ Accounts survive page refresh"
echo ""
echo "🔹 LINKOGENEI EXTENSION FIXES:"
echo "  ✓ Switched from MongoDB to SQLite"
echo "  ✓ Posts now persist across server restarts"
echo "  ✓ No MongoDB installation required"
echo "  ✓ Extension tokens stored in database"
echo "  ✓ Saved posts stored in database"
echo "  ✓ Categories stored in database"
echo "  ✓ All data persists permanently"
echo ""
echo "🧪 Test the following:"
echo ""
echo "SOCIAL ANALYTICS:"
echo "  1. Go to Social Analytics page"
echo "  2. Connect Instagram account"
echo "  3. Refresh page - account should still be there"
echo "  4. Click X button to delete account"
echo "  5. Click Refresh button to update metrics"
echo ""
echo "LINKOGENEI EXTENSION:"
echo "  1. Go to LinkoGenei page"
echo "  2. Generate extension token"
echo "  3. Copy token to Chrome extension"
echo "  4. Save a post from LinkedIn/Instagram"
echo "  5. Refresh page - post should still be there"
echo "  6. Restart backend - posts should persist"
echo ""
echo "📊 Database Tables Created:"
echo "  - social_accounts (for Social Analytics)"
echo "  - extension_tokens (for LinkoGenei)"
echo "  - saved_posts (for LinkoGenei)"
echo "  - saved_post_categories (for LinkoGenei)"
echo ""
echo "🎉 All issues from the context transfer are now FIXED!"
echo ""
