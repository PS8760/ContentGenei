#!/bin/bash

# AWS Resources Setup Script
# Creates all necessary AWS resources for ContentGenie

set -e

echo "🔧 ContentGenie AWS Resources Setup"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "${RED}❌ AWS CLI is not installed${NC}"
    echo "Install it with: pip install awscli"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "${RED}❌ AWS CLI is not configured${NC}"
    echo "Configure it with: aws configure"
    exit 1
fi

echo "${GREEN}✅ AWS CLI is configured${NC}"
echo ""

# Get configuration
read -p "Enter project name (default: contentgenie): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-contentgenie}

read -p "Enter AWS region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

echo ""
echo "${BLUE}Creating AWS resources...${NC}"
echo ""

# 1. Create S3 Bucket for Frontend
echo "${YELLOW}1. Creating S3 bucket for frontend...${NC}"
S3_BUCKET="${PROJECT_NAME}-frontend-$(date +%s)"

aws s3 mb s3://$S3_BUCKET --region $AWS_REGION

# Enable static website hosting
aws s3 website s3://$S3_BUCKET \
    --index-document index.html \
    --error-document index.html

# Set bucket policy for public read
cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$S3_BUCKET/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket $S3_BUCKET \
    --policy file:///tmp/bucket-policy.json

echo "${GREEN}✅ S3 bucket created: $S3_BUCKET${NC}"
echo ""

# 2. Create IAM Role for Lambda
echo "${YELLOW}2. Creating IAM role for Lambda...${NC}"

# Create trust policy
cat > /tmp/trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

ROLE_NAME="${PROJECT_NAME}-lambda-role"

aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file:///tmp/trust-policy.json \
    2>/dev/null || echo "Role already exists"

# Attach policies
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/AmazonRDSFullAccess

aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)

echo "${GREEN}✅ IAM role created: $ROLE_NAME${NC}"
echo "   ARN: $ROLE_ARN"
echo ""

# Wait for role to propagate
echo "Waiting for IAM role to propagate..."
sleep 10

# 3. Create Lambda Function
echo "${YELLOW}3. Creating Lambda function...${NC}"

LAMBDA_NAME="${PROJECT_NAME}-api"

# Create a dummy deployment package
mkdir -p /tmp/lambda-init
cat > /tmp/lambda-init/lambda_function.py << 'EOF'
def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'body': 'ContentGenie API - Please deploy your code'
    }
EOF

cd /tmp/lambda-init
zip -q lambda_function.zip lambda_function.py

aws lambda create-function \
    --function-name $LAMBDA_NAME \
    --runtime python3.11 \
    --role $ROLE_ARN \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://lambda_function.zip \
    --timeout 30 \
    --memory-size 512 \
    --region $AWS_REGION \
    2>/dev/null || echo "Lambda function already exists"

echo "${GREEN}✅ Lambda function created: $LAMBDA_NAME${NC}"
echo ""

# 4. Create API Gateway
echo "${YELLOW}4. Creating API Gateway...${NC}"

API_NAME="${PROJECT_NAME}-api"

# Create REST API
API_ID=$(aws apigateway create-rest-api \
    --name $API_NAME \
    --description "ContentGenie REST API" \
    --region $AWS_REGION \
    --query 'id' \
    --output text 2>/dev/null || \
    aws apigateway get-rest-apis \
    --query "items[?name=='$API_NAME'].id" \
    --output text)

echo "${GREEN}✅ API Gateway created: $API_ID${NC}"
echo ""

# 5. Create RDS PostgreSQL (Free Tier)
echo "${YELLOW}5. Creating RDS PostgreSQL database...${NC}"
echo "${BLUE}Note: This will take 5-10 minutes${NC}"

DB_NAME="${PROJECT_NAME}-db"
DB_USERNAME="admin"
DB_PASSWORD=$(openssl rand -base64 12)

# Create security group
SG_NAME="${PROJECT_NAME}-db-sg"
VPC_ID=$(aws ec2 describe-vpcs --query 'Vpcs[0].VpcId' --output text)

SG_ID=$(aws ec2 create-security-group \
    --group-name $SG_NAME \
    --description "Security group for ContentGenie RDS" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$SG_NAME" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

# Allow PostgreSQL access
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0 \
    2>/dev/null || true

# Create RDS instance
aws rds create-db-instance \
    --db-instance-identifier $DB_NAME \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --backup-retention-period 7 \
    --publicly-accessible \
    --vpc-security-group-ids $SG_ID \
    --region $AWS_REGION \
    2>/dev/null || echo "RDS instance already exists"

echo "${GREEN}✅ RDS PostgreSQL creation initiated${NC}"
echo "   Instance: $DB_NAME"
echo "   Username: $DB_USERNAME"
echo "   Password: $DB_PASSWORD"
echo "   ${RED}⚠️  SAVE THIS PASSWORD!${NC}"
echo ""

# 6. Create Secrets Manager Secret
echo "${YELLOW}6. Creating Secrets Manager secret...${NC}"

SECRET_NAME="${PROJECT_NAME}/api-keys"

cat > /tmp/secret.json << EOF
{
    "SECRET_KEY": "$(openssl rand -base64 32)",
    "JWT_SECRET_KEY": "$(openssl rand -base64 32)",
    "DB_USERNAME": "$DB_USERNAME",
    "DB_PASSWORD": "$DB_PASSWORD"
}
EOF

aws secretsmanager create-secret \
    --name $SECRET_NAME \
    --secret-string file:///tmp/secret.json \
    --region $AWS_REGION \
    2>/dev/null || \
    aws secretsmanager update-secret \
    --secret-id $SECRET_NAME \
    --secret-string file:///tmp/secret.json

echo "${GREEN}✅ Secrets Manager secret created${NC}"
echo ""

# 7. Summary
echo ""
echo "${GREEN}🎉 AWS Resources Created Successfully!${NC}"
echo "========================================"
echo ""
echo "${BLUE}Frontend:${NC}"
echo "  S3 Bucket: $S3_BUCKET"
echo "  URL: http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
echo ""
echo "${BLUE}Backend:${NC}"
echo "  Lambda Function: $LAMBDA_NAME"
echo "  API Gateway ID: $API_ID"
echo "  IAM Role: $ROLE_NAME"
echo ""
echo "${BLUE}Database:${NC}"
echo "  RDS Instance: $DB_NAME"
echo "  Username: $DB_USERNAME"
echo "  Password: $DB_PASSWORD"
echo "  ${RED}⚠️  SAVE THIS PASSWORD!${NC}"
echo ""
echo "${BLUE}Secrets:${NC}"
echo "  Secret Name: $SECRET_NAME"
echo ""
echo "${YELLOW}Next Steps:${NC}"
echo "1. Wait for RDS instance to be available (5-10 minutes)"
echo "   Check status: aws rds describe-db-instances --db-instance-identifier $DB_NAME"
echo ""
echo "2. Get RDS endpoint:"
echo "   aws rds describe-db-instances --db-instance-identifier $DB_NAME --query 'DBInstances[0].Endpoint.Address' --output text"
echo ""
echo "3. Update Lambda environment variables with RDS endpoint"
echo ""
echo "4. Deploy your application:"
echo "   ./deploy-to-aws.sh"
echo ""
echo "5. Set up MongoDB Atlas (Free Tier):"
echo "   https://www.mongodb.com/cloud/atlas"
echo ""

# Save configuration
cat > aws-config.txt << EOF
# ContentGenie AWS Configuration
# Generated: $(date)

S3_BUCKET=$S3_BUCKET
LAMBDA_NAME=$LAMBDA_NAME
API_GATEWAY_ID=$API_ID
RDS_INSTANCE=$DB_NAME
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
SECRET_NAME=$SECRET_NAME
IAM_ROLE=$ROLE_NAME
REGION=$AWS_REGION

# Frontend URL
FRONTEND_URL=http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com

# Get RDS endpoint with:
# aws rds describe-db-instances --db-instance-identifier $DB_NAME --query 'DBInstances[0].Endpoint.Address' --output text
EOF

echo "${GREEN}Configuration saved to: aws-config.txt${NC}"
echo ""
