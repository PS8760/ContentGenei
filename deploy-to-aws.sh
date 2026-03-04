#!/bin/bash

# ContentGenie AWS Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 ContentGenie AWS Deployment"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
read -p "Enter your S3 bucket name (e.g., contentgenie-frontend-prod): " S3_BUCKET
read -p "Enter your CloudFront distribution ID (leave empty if not created yet): " CF_DIST_ID
read -p "Enter your Lambda function name (e.g., contentgenie-api): " LAMBDA_NAME

echo ""
echo "${YELLOW}Starting deployment...${NC}"
echo ""

# Step 1: Deploy Frontend
echo "${GREEN}Step 1: Building and deploying frontend...${NC}"
cd frontend

# Build frontend
echo "Building frontend..."
npm run build

# Upload to S3
echo "Uploading to S3..."
aws s3 sync dist/ s3://$S3_BUCKET/ --delete --acl public-read

# Invalidate CloudFront cache
if [ ! -z "$CF_DIST_ID" ]; then
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"
fi

echo "${GREEN}✅ Frontend deployed successfully!${NC}"
echo ""

# Step 2: Deploy Backend
echo "${GREEN}Step 2: Building and deploying backend...${NC}"
cd ../backend

# Clean previous build
rm -rf lambda_package lambda_function.zip

# Create package directory
mkdir lambda_package

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt -t lambda_package/

# Copy application files
echo "Copying application files..."
cp -r *.py lambda_package/ 2>/dev/null || true
cp -r routes lambda_package/ 2>/dev/null || true
cp -r services lambda_package/ 2>/dev/null || true
cp -r utils lambda_package/ 2>/dev/null || true
cp -r migrations lambda_package/ 2>/dev/null || true

# Create lambda handler if it doesn't exist
if [ ! -f lambda_package/lambda_handler.py ]; then
    cat > lambda_package/lambda_handler.py << 'EOF'
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import app
import awsgi

def lambda_handler(event, context):
    return awsgi.response(app, event, context)
EOF
fi

# Create ZIP file
echo "Creating deployment package..."
cd lambda_package
zip -r ../lambda_function.zip . -q
cd ..

# Upload to Lambda
echo "Uploading to Lambda..."
aws lambda update-function-code \
    --function-name $LAMBDA_NAME \
    --zip-file fileb://lambda_function.zip

echo "${GREEN}✅ Backend deployed successfully!${NC}"
echo ""

# Cleanup
rm -rf lambda_package lambda_function.zip

cd ..

echo ""
echo "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "Frontend URL: https://$S3_BUCKET.s3.amazonaws.com/index.html"
if [ ! -z "$CF_DIST_ID" ]; then
    echo "CloudFront URL: Check your CloudFront distribution"
fi
echo "Backend: Check your API Gateway URL"
echo ""
echo "Next steps:"
echo "1. Test your frontend URL"
echo "2. Test your API endpoints"
echo "3. Check CloudWatch logs for any errors"
echo ""
