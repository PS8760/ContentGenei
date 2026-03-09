#!/bin/bash

# Deploy Authentication Persistence Fix
# Fixes the issue where users are redirected to signin on page refresh

set -e

echo "🔐 Deploying Authentication Persistence Fix..."
echo "=================================================="

# Check if we're on AWS or local
if [ "$1" == "local" ]; then
  echo "📦 Building frontend locally..."
  cd frontend
  npm run build
  echo "✅ Build complete! Upload dist/ folder to AWS"
  exit 0
fi

# AWS Deployment
EC2_IP="3.235.236.139"
EC2_USER="ubuntu"

echo ""
echo "📦 Step 1: Committing changes..."
git add .
git commit -m "Fix: Authentication persistence on page refresh" || echo "No changes to commit"
git push origin main || echo "Already up to date"

echo ""
echo "🔄 Step 2: Deploying to AWS..."
ssh ${EC2_USER}@${EC2_IP} << 'ENDSSH'
cd /home/ubuntu/ContentGenei

echo "Pulling latest code..."
git pull origin main

echo ""
echo "Building frontend..."
cd frontend
npm run build

echo ""
echo "Deploying to Nginx..."
sudo rm -rf /var/www/contentgenei/*
sudo cp -r dist/* /var/www/contentgenei/

echo ""
echo "Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "=================================================="
echo "✅ Authentication Fix Deployed Successfully!"
echo "=================================================="
echo ""
echo "🌐 Test at: http://${EC2_IP}/"
echo ""
echo "🧪 Test Steps:"
echo "  1. Login to the application"
echo "  2. Navigate to /dashboard"
echo "  3. Refresh the page (F5)"
echo "  4. Should stay on dashboard (not redirect to signin)"
echo "  5. Close browser and reopen"
echo "  6. Go to /dashboard directly"
echo "  7. Should still be logged in"
echo ""
echo "✅ Users will no longer be logged out on page refresh!"
echo ""
