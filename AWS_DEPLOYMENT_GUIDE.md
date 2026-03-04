# AWS Deployment Guide - Cost-Optimized (219 Credits)

## 📊 Project Analysis

### Your Application Stack:
- **Frontend**: React + Vite (Static files)
- **Backend**: Flask/Python (REST API)
- **Databases**: 
  - SQLite/PostgreSQL (relational data)
  - MongoDB (profiles, notifications)
  - Firebase (authentication)
- **External APIs**: Groq AI, Firebase Auth
- **Chrome Extension**: Static files

### Current Resource Usage:
- Backend: ~512MB RAM, 1 vCPU
- Frontend: Static files (~50MB)
- Database: ~100MB data
- MongoDB: ~50MB data

---

## 💰 Cost-Optimized AWS Architecture

### Recommended Services (Total: ~$15-20/month = ~15-20 credits)

```
┌─────────────────────────────────────────────────────────┐
│                    AWS Architecture                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Users → CloudFront (CDN) → S3 (Frontend)              │
│           ↓                                              │
│  Users → API Gateway → Lambda (Backend)                 │
│           ↓                                              │
│  Lambda → RDS (PostgreSQL) + DocumentDB (MongoDB)       │
│           ↓                                              │
│  Lambda → Secrets Manager (API Keys)                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Deployment Strategy (3 Options)

### Option 1: SERVERLESS (Most Cost-Effective) ⭐ RECOMMENDED
**Monthly Cost: ~$5-10 (5-10 credits)**

**Services:**
1. **S3** - Frontend hosting ($0.50/month)
2. **CloudFront** - CDN ($1-2/month)
3. **Lambda** - Backend API ($0-5/month with free tier)
4. **API Gateway** - REST API ($1-3/month)
5. **RDS Free Tier** - PostgreSQL (FREE for 12 months)
6. **DocumentDB** - Skip, use MongoDB Atlas Free Tier (FREE)
7. **Secrets Manager** - API keys ($0.40/month)

**Pros:**
- Pay only for what you use
- Auto-scaling
- No server management
- Free tier eligible

**Cons:**
- Cold start latency (~1-2 seconds)
- Lambda timeout (15 min max)

---

### Option 2: LIGHTSAIL (Simplest) 💡
**Monthly Cost: ~$10-15 (10-15 credits)**

**Services:**
1. **Lightsail Instance** - $5/month (512MB RAM, 1 vCPU)
2. **Lightsail Static IP** - FREE
3. **Lightsail CDN** - $0.50/month
4. **MongoDB Atlas** - FREE tier
5. **S3** - Backups ($0.50/month)

**Pros:**
- Fixed pricing
- Easy to manage
- No cold starts
- Simple setup

**Cons:**
- Fixed resources
- Manual scaling
- Less flexible

---

### Option 3: EC2 + RDS (Traditional)
**Monthly Cost: ~$20-30 (20-30 credits)**

**Not recommended** - Uses more credits than available budget.

---

## 🚀 RECOMMENDED: Serverless Deployment

### Step-by-Step Implementation

---

## Phase 1: Frontend Deployment (S3 + CloudFront)

### 1.1 Build Frontend
```bash
cd ContentGenei-01/frontend
npm run build
# Creates dist/ folder with static files
```

### 1.2 Create S3 Bucket
```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)

# Create S3 bucket (replace with unique name)
aws s3 mb s3://contentgenie-frontend-prod

# Enable static website hosting
aws s3 website s3://contentgenie-frontend-prod \
  --index-document index.html \
  --error-document index.html

# Upload frontend files
aws s3 sync dist/ s3://contentgenie-frontend-prod/ \
  --acl public-read \
  --cache-control "max-age=31536000"
```

### 1.3 Create CloudFront Distribution
```bash
# Create distribution (via AWS Console or CLI)
# Point origin to S3 bucket
# Enable HTTPS
# Set default root object: index.html
# Custom error response: 404 → /index.html (for React Router)
```

**Cost**: $1-2/month

---

## Phase 2: Backend Deployment (Lambda + API Gateway)

### 2.1 Prepare Backend for Lambda

**Create**: `ContentGenei-01/backend/lambda_handler.py`
```python
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app import app
import awsgi

def lambda_handler(event, context):
    return awsgi.response(app, event, context)
```

**Update**: `ContentGenei-01/backend/requirements.txt`
```
# Add these lines
awsgi==0.2.7
mangum==0.17.0
```

### 2.2 Create Deployment Package
```bash
cd ContentGenei-01/backend

# Create deployment directory
mkdir lambda_package
cd lambda_package

# Install dependencies
pip install -r ../requirements.txt -t .

# Copy application files
cp -r ../app.py ../models.py ../config.py ../routes ../services ../utils .
cp ../lambda_handler.py .

# Create ZIP file
zip -r ../lambda_function.zip .
cd ..
```

### 2.3 Create Lambda Function
```bash
# Create Lambda function
aws lambda create-function \
  --function-name contentgenie-api \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler lambda_handler.lambda_handler \
  --zip-file fileb://lambda_function.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{
    SECRET_KEY=your-secret-key,
    JWT_SECRET_KEY=your-jwt-secret,
    GROQ_API_KEY=your-groq-key,
    DATABASE_URL=your-rds-url,
    MONGODB_URI=your-mongodb-atlas-url
  }"
```

### 2.4 Create API Gateway
```bash
# Create REST API
aws apigateway create-rest-api \
  --name contentgenie-api \
  --description "ContentGenie API"

# Create resource and methods
# Link to Lambda function
# Deploy to stage (prod)
```

**Cost**: $1-5/month (with free tier)

---

## Phase 3: Database Setup

### 3.1 PostgreSQL (RDS Free Tier)
```bash
# Create RDS instance (Free Tier eligible)
aws rds create-db-instance \
  --db-instance-identifier contentgenie-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword123! \
  --allocated-storage 20 \
  --backup-retention-period 7 \
  --publicly-accessible \
  --vpc-security-group-ids sg-xxxxx
```

**Free Tier**: 750 hours/month for 12 months
**Cost**: FREE (first year), then $15/month

### 3.2 MongoDB (Atlas Free Tier)
```bash
# Use MongoDB Atlas instead of DocumentDB
# DocumentDB costs $200+/month
# Atlas M0 (Free Tier): 512MB storage, FREE forever

# Sign up at: https://www.mongodb.com/cloud/atlas
# Create free cluster
# Get connection string
# Add to Lambda environment variables
```

**Cost**: FREE

---

## Phase 4: Secrets Management

### 4.1 Store API Keys in Secrets Manager
```bash
# Create secret
aws secretsmanager create-secret \
  --name contentgenie/api-keys \
  --secret-string '{
    "GROQ_API_KEY": "your-groq-key",
    "JWT_SECRET_KEY": "your-jwt-secret",
    "SECRET_KEY": "your-secret-key",
    "FIREBASE_CREDENTIALS": "your-firebase-json"
  }'
```

### 4.2 Update Lambda to Use Secrets
```python
import boto3
import json

def get_secret(secret_name):
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

# In lambda_handler.py
secrets = get_secret('contentgenie/api-keys')
os.environ['GROQ_API_KEY'] = secrets['GROQ_API_KEY']
```

**Cost**: $0.40/month

---

## Phase 5: Chrome Extension Deployment

### 5.1 Update Extension API URL
```javascript
// extension/background.js
const API_URL = 'https://your-api-gateway-url.amazonaws.com/prod'
```

### 5.2 Package Extension
```bash
cd ContentGenei-01/extension
zip -r contentgenie-extension.zip .
```

### 5.3 Upload to Chrome Web Store
- Go to: https://chrome.google.com/webstore/devconsole
- Pay one-time fee: $5
- Upload ZIP file
- Publish

---

## 📊 Cost Breakdown (Monthly)

### Serverless Architecture:
| Service | Cost | Credits |
|---------|------|---------|
| S3 (Frontend) | $0.50 | 0.5 |
| CloudFront | $1.50 | 1.5 |
| Lambda (Backend) | $2.00 | 2.0 |
| API Gateway | $1.50 | 1.5 |
| RDS (PostgreSQL) | FREE* | 0 |
| MongoDB Atlas | FREE | 0 |
| Secrets Manager | $0.40 | 0.4 |
| **TOTAL** | **$5.90** | **5.9** |

*FREE for first 12 months, then $15/month

### After 12 Months:
| Service | Cost | Credits |
|---------|------|---------|
| All above | $5.90 | 5.9 |
| RDS (PostgreSQL) | $15.00 | 15.0 |
| **TOTAL** | **$20.90** | **20.9** |

---

## 🎯 Alternative: Lightsail (Simpler)

### Lightsail Deployment:
```bash
# Create Lightsail instance
aws lightsail create-instances \
  --instance-names contentgenie-server \
  --availability-zone us-east-1a \
  --blueprint-id ubuntu_22_04 \
  --bundle-id nano_2_0

# SSH into instance
ssh ubuntu@your-instance-ip

# Install dependencies
sudo apt update
sudo apt install python3-pip nginx

# Clone repository
git clone your-repo-url
cd ContentGenei-01

# Setup backend
cd backend
pip3 install -r requirements.txt
gunicorn -w 4 -b 0.0.0.0:5000 run:app

# Setup frontend
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/html/

# Configure Nginx
sudo nano /etc/nginx/sites-available/default
# Add proxy pass to backend
```

**Cost**: $5/month (512MB instance)

---

## 🔧 Environment Variables

### Lambda Environment Variables:
```bash
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
GROQ_API_KEY=your-groq-api-key
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/contentgenie
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/contentgenie
FIREBASE_CREDENTIALS_PATH=/tmp/firebase-credentials.json
```

### Frontend Environment Variables:
```bash
# .env.production
VITE_API_URL=https://your-api-gateway-url.amazonaws.com/prod
VITE_FIREBASE_API_KEY=your-firebase-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

---

## 🚀 Deployment Commands

### Deploy Frontend:
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://contentgenie-frontend-prod/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Deploy Backend:
```bash
cd backend
./deploy-lambda.sh  # Create this script
```

**Create**: `backend/deploy-lambda.sh`
```bash
#!/bin/bash
rm -rf lambda_package lambda_function.zip
mkdir lambda_package
pip install -r requirements.txt -t lambda_package/
cp -r *.py routes services utils lambda_package/
cd lambda_package && zip -r ../lambda_function.zip . && cd ..
aws lambda update-function-code \
  --function-name contentgenie-api \
  --zip-file fileb://lambda_function.zip
```

---

## 📈 Scaling Strategy

### Current (219 credits):
- Use Serverless architecture
- RDS Free Tier (12 months)
- MongoDB Atlas Free Tier
- **Budget**: ~6 credits/month
- **Remaining**: 213 credits for 35+ months

### When You Grow:
1. **100 users**: Stay on free tier
2. **1,000 users**: Upgrade Lambda memory ($10/month)
3. **10,000 users**: Add RDS read replica ($15/month)
4. **100,000 users**: Move to ECS/Fargate ($50/month)

---

## 🔒 Security Checklist

- [ ] Enable HTTPS on CloudFront
- [ ] Use Secrets Manager for API keys
- [ ] Enable RDS encryption
- [ ] Set up VPC for Lambda
- [ ] Enable CloudWatch logging
- [ ] Set up IAM roles with least privilege
- [ ] Enable AWS WAF for API Gateway
- [ ] Set up backup policies

---

## 📊 Monitoring

### CloudWatch Dashboards:
```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name ContentGenie \
  --dashboard-body file://dashboard.json
```

### Alarms:
```bash
# Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name lambda-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

---

## 🎯 Quick Start (Recommended Path)

### Day 1: Frontend
1. Build frontend: `npm run build`
2. Create S3 bucket
3. Upload to S3
4. Create CloudFront distribution
5. Test: https://your-cloudfront-url.com

### Day 2: Database
1. Create RDS PostgreSQL (Free Tier)
2. Sign up for MongoDB Atlas (Free)
3. Run migrations
4. Test connections

### Day 3: Backend
1. Create Lambda function
2. Create API Gateway
3. Deploy backend code
4. Test API endpoints

### Day 4: Integration
1. Update frontend API URL
2. Redeploy frontend
3. Test full application
4. Deploy Chrome extension

### Day 5: Monitoring
1. Set up CloudWatch
2. Create alarms
3. Test error handling
4. Document everything

---

## 💡 Cost Optimization Tips

1. **Use Free Tiers**:
   - RDS: 750 hours/month (12 months)
   - Lambda: 1M requests/month (forever)
   - S3: 5GB storage (12 months)
   - CloudFront: 1TB transfer (12 months)

2. **Optimize Lambda**:
   - Use smaller memory (512MB)
   - Reduce timeout (30s)
   - Use Lambda layers for dependencies

3. **Optimize S3**:
   - Enable compression
   - Use CloudFront caching
   - Set lifecycle policies

4. **Optimize Database**:
   - Use connection pooling
   - Enable query caching
   - Regular vacuum/analyze

5. **Monitor Costs**:
   - Set up billing alerts
   - Use AWS Cost Explorer
   - Review monthly reports

---

## 🆘 Troubleshooting

### Lambda Cold Starts:
```python
# Add warmup function
def warmup_handler(event, context):
    return {'statusCode': 200, 'body': 'warm'}

# Create CloudWatch rule to ping every 5 minutes
```

### CORS Issues:
```python
# In app.py
from flask_cors import CORS
CORS(app, origins=['https://your-cloudfront-url.com'])
```

### Database Connection:
```python
# Use connection pooling
from sqlalchemy.pool import QueuePool
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10
)
```

---

## 📞 Support Resources

- AWS Free Tier: https://aws.amazon.com/free/
- AWS Documentation: https://docs.aws.amazon.com/
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- AWS Cost Calculator: https://calculator.aws/

---

## ✅ Final Checklist

- [ ] AWS account created
- [ ] AWS CLI configured
- [ ] Frontend built and deployed to S3
- [ ] CloudFront distribution created
- [ ] RDS PostgreSQL created (Free Tier)
- [ ] MongoDB Atlas cluster created (Free)
- [ ] Lambda function deployed
- [ ] API Gateway configured
- [ ] Secrets Manager set up
- [ ] Environment variables configured
- [ ] Domain name configured (optional)
- [ ] SSL certificate installed
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Documentation updated

---

**Total Monthly Cost**: ~$6/month (6 credits)
**Credits Remaining**: 213 credits
**Estimated Runtime**: 35+ months

🎉 **You can run your application for almost 3 years with your current credits!**
