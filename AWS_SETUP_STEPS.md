# 🚀 AWS Setup - Step by Step Guide

## Prerequisites Checklist

Before deploying to AWS, you need:

- [ ] AWS Account created
- [ ] AWS CLI installed
- [ ] AWS credentials configured
- [ ] MongoDB Atlas account (free)

---

## Step 1: Install AWS CLI (5 minutes)

### For macOS (your system):

```bash
# Install using Homebrew (recommended)
brew install awscli

# Or download installer
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Verify installation
aws --version
```

Expected output: `aws-cli/2.x.x Python/3.x.x Darwin/xx.x.x`

---

## Step 2: Get AWS Credentials (10 minutes)

### 2.1 Login to AWS Console
1. Go to https://console.aws.amazon.com/
2. Sign in with your AWS account

### 2.2 Create IAM User
1. Go to IAM service: https://console.aws.amazon.com/iam/
2. Click "Users" → "Add users"
3. User name: `contentgenie-deployer`
4. Select: "Access key - Programmatic access"
5. Click "Next: Permissions"

### 2.3 Set Permissions
1. Click "Attach existing policies directly"
2. Search and select these policies:
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
   - `AWSLambda_FullAccess`
   - `AmazonAPIGatewayAdministrator`
   - `AmazonRDSFullAccess`
   - `SecretsManagerReadWrite`
   - `CloudWatchFullAccess`
3. Click "Next: Tags" (skip)
4. Click "Next: Review"
5. Click "Create user"

### 2.4 Save Credentials
**IMPORTANT**: Copy these immediately (you won't see them again!)
- Access Key ID: `AKIA...`
- Secret Access Key: `wJalr...`

---

## Step 3: Configure AWS CLI (2 minutes)

```bash
# Run configuration
aws configure

# Enter your credentials:
AWS Access Key ID [None]: AKIA... (paste your key)
AWS Secret Access Key [None]: wJalr... (paste your secret)
Default region name [None]: us-east-1
Default output format [None]: json
```

### Verify Configuration

```bash
# Test AWS CLI
aws sts get-caller-identity

# Should show:
# {
#     "UserId": "AIDA...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/contentgenie-deployer"
# }
```

---

## Step 4: Setup MongoDB Atlas (10 minutes)

### 4.1 Create Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free, no credit card required)
3. Choose "Shared" (free tier)

### 4.2 Create Cluster
1. Click "Build a Database"
2. Choose "M0 FREE" tier
3. Select region: `us-east-1` (same as AWS)
4. Cluster name: `contentgenie`
5. Click "Create"

### 4.3 Create Database User
1. Click "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Username: `contentgenie_user`
4. Password: Generate secure password (save it!)
5. Database User Privileges: "Read and write to any database"
6. Click "Add User"

### 4.4 Whitelist IP
1. Click "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is needed for Lambda functions
4. Click "Confirm"

### 4.5 Get Connection String
1. Click "Database" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy connection string:
   ```
   mongodb+srv://contentgenie_user:<password>@contentgenie.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Save this connection string!

---

## Step 5: Prepare Environment Variables

Create a file to store your credentials temporarily:

```bash
cd ContentGenei-01

# Create credentials file
cat > aws-credentials.txt << 'EOF'
# AWS Credentials
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your-account-id

# MongoDB Atlas
MONGODB_URI=mongodb+srv://contentgenie_user:YOUR_PASSWORD@contentgenie.xxxxx.mongodb.net/?retryWrites=true&w=majority

# Firebase (from your existing .env)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Groq API (from your existing .env)
GROQ_API_KEY=your-groq-api-key

# JWT Secret (generate new one)
JWT_SECRET_KEY=$(openssl rand -hex 32)
EOF

# Edit the file with your actual values
nano aws-credentials.txt
```

---

## Step 6: Run AWS Setup Script

Now you're ready to deploy!

```bash
cd ContentGenei-01

# Make scripts executable (already done)
chmod +x setup-aws-resources.sh deploy-to-aws.sh

# Run setup script
./setup-aws-resources.sh

# This will create:
# ✓ S3 bucket for frontend
# ✓ CloudFront distribution
# ✓ Lambda function for backend
# ✓ API Gateway
# ✓ RDS PostgreSQL instance (free tier)
# ✓ Secrets Manager entries
# ✓ CloudWatch log groups
```

**Note**: RDS creation takes 5-10 minutes. The script will wait.

---

## Step 7: Deploy Your Application

```bash
# Deploy backend to Lambda
./deploy-to-aws.sh

# The script will:
# 1. Package backend code
# 2. Upload to Lambda
# 3. Build frontend
# 4. Upload to S3
# 5. Invalidate CloudFront cache
# 6. Show you the URLs
```

---

## Step 8: Update Frontend Configuration

After deployment, update your frontend to use the API Gateway URL:

```bash
# Get API Gateway URL from script output
# It will look like: https://xxxxx.execute-api.us-east-1.amazonaws.com/prod

# Update frontend/.env.production
echo "VITE_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod" > frontend/.env.production

# Rebuild and redeploy frontend
cd frontend
npm run build
cd ..
./deploy-to-aws.sh
```

---

## Step 9: Test Your Deployment

```bash
# Get CloudFront URL from script output
# Open in browser: https://xxxxx.cloudfront.net

# Test:
# 1. Register new user
# 2. Login
# 3. Generate content
# 4. Check admin panel
```

---

## 🎯 Quick Commands Reference

```bash
# Check AWS CLI
aws --version
aws sts get-caller-identity

# Check S3 buckets
aws s3 ls

# Check Lambda functions
aws lambda list-functions

# Check RDS instances
aws rds describe-db-instances

# Check CloudFront distributions
aws cloudfront list-distributions

# View CloudWatch logs
aws logs tail /aws/lambda/contentgenie-backend --follow

# Check costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-12-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

---

## 🆘 Troubleshooting

### AWS CLI not found
```bash
# Install via Homebrew
brew install awscli

# Or download installer
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

### Permission denied on scripts
```bash
chmod +x setup-aws-resources.sh deploy-to-aws.sh
```

### AWS credentials not configured
```bash
aws configure
# Enter your Access Key ID and Secret Access Key
```

### RDS creation timeout
```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier contentgenie-db

# Wait until Status = "available"
```

### Lambda deployment fails
```bash
# Check Lambda logs
aws logs tail /aws/lambda/contentgenie-backend --follow

# Common issues:
# - Missing dependencies in requirements.txt
# - Environment variables not set
# - Database connection issues
```

### Frontend not loading
```bash
# Check CloudFront distribution status
aws cloudfront list-distributions

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## 💰 Cost Monitoring

### Set up billing alerts:

```bash
# Create SNS topic for alerts
aws sns create-topic --name billing-alerts

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "BillingAlert-10USD" \
  --alarm-description "Alert when bill exceeds $10" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:billing-alerts
```

### Check current costs:

```bash
# View current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] CloudFront URL loads your frontend
- [ ] User registration works
- [ ] Login works
- [ ] Content generation works
- [ ] Admin panel accessible
- [ ] Team collaboration works
- [ ] MongoDB connection works
- [ ] RDS connection works
- [ ] No errors in CloudWatch logs
- [ ] Billing alert configured

---

## 📞 Next Steps

1. **Domain Setup** (optional):
   - Buy domain from Route 53 or external provider
   - Point to CloudFront distribution
   - Add SSL certificate (free with AWS Certificate Manager)

2. **CI/CD Setup** (optional):
   - Connect GitHub to AWS CodePipeline
   - Automatic deployments on push

3. **Monitoring**:
   - Set up CloudWatch dashboards
   - Configure error alerts
   - Monitor Lambda performance

4. **Optimization**:
   - Enable CloudFront caching
   - Optimize Lambda memory
   - Add Redis for session caching (if needed)

---

**Ready to deploy? Start with Step 1!** 🚀
