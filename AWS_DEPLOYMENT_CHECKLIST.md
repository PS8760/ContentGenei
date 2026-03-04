# AWS Deployment Checklist

## 📋 Pre-Deployment Checklist

### 1. Prerequisites
- [ ] AWS Account created
- [ ] AWS CLI installed (`aws --version`)
- [ ] AWS CLI configured (`aws configure`)
- [ ] MongoDB Atlas account created (free tier)
- [ ] All environment variables documented

### 2. Local Testing
- [ ] Backend runs without errors (`python run.py`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Database migrations completed
- [ ] Admin account created
- [ ] All features tested locally

### 3. Environment Configuration
- [ ] `.env.production` files created for backend and frontend
- [ ] Firebase credentials configured
- [ ] Groq API key added
- [ ] MongoDB connection string ready
- [ ] All secrets documented securely

## 🚀 Deployment Steps

### Phase 1: Database Setup (15 minutes)

#### MongoDB Atlas (Free Tier)
1. [ ] Sign up at https://www.mongodb.com/cloud/atlas
2. [ ] Create a free M0 cluster (512MB storage)
3. [ ] Create database user with password
4. [ ] Whitelist IP addresses (0.0.0.0/0 for Lambda)
5. [ ] Get connection string
6. [ ] Test connection locally

#### AWS RDS PostgreSQL (Optional - Free Tier)
1. [ ] Run `./setup-aws-resources.sh` (creates RDS instance)
2. [ ] Wait 5-10 minutes for RDS to be ready
3. [ ] Note down RDS endpoint
4. [ ] Update security group for Lambda access

### Phase 2: Backend Deployment (20 minutes)

#### Option A: AWS Lambda (Recommended - Serverless)
1. [ ] Install dependencies: `pip install -r requirements.txt -t package/`
2. [ ] Create deployment package with Lambda handler
3. [ ] Upload to Lambda or use deployment script
4. [ ] Configure environment variables in Lambda
5. [ ] Set up API Gateway
6. [ ] Test Lambda function

#### Option B: AWS Elastic Beanstalk (Alternative)
1. [ ] Install EB CLI: `pip install awsebcli`
2. [ ] Initialize: `eb init -p python-3.11 contentgenie-backend`
3. [ ] Create environment: `eb create contentgenie-prod`
4. [ ] Configure environment variables
5. [ ] Deploy: `eb deploy`

### Phase 3: Frontend Deployment (15 minutes)

1. [ ] Update `VITE_API_URL` in `.env.production`
2. [ ] Build frontend: `npm run build`
3. [ ] Run deployment script: `./deploy-to-aws.sh`
4. [ ] Script will:
   - Create S3 bucket
   - Upload build files
   - Configure CloudFront CDN
   - Set up SSL certificate
5. [ ] Note CloudFront URL

### Phase 4: Configuration & Testing (10 minutes)

1. [ ] Update Firebase authorized domains
2. [ ] Test user registration
3. [ ] Test login/logout
4. [ ] Test content generation
5. [ ] Test admin panel access
6. [ ] Test team collaboration features
7. [ ] Verify MongoDB connections
8. [ ] Check CloudWatch logs

## 💰 Cost Estimation (219 Credits Available)

### Recommended Architecture (Serverless)
- **S3 + CloudFront**: ~$1-2/month
- **Lambda**: ~$0-1/month (1M requests free)
- **API Gateway**: ~$1-2/month
- **RDS Free Tier**: $0 (first 12 months)
- **MongoDB Atlas Free**: $0 (forever)
- **Total**: ~$3-6/month = 3-6 credits

### Runtime with 219 Credits
- At $6/month: **36+ months** (3 years!)
- At $3/month: **73+ months** (6 years!)

## 🔧 Post-Deployment Tasks

### Immediate
- [ ] Set up CloudWatch alarms for errors
- [ ] Configure backup strategy
- [ ] Document all endpoints
- [ ] Update README with production URLs
- [ ] Share credentials with team (securely)

### Within 24 Hours
- [ ] Monitor error logs
- [ ] Test all features in production
- [ ] Set up monitoring dashboard
- [ ] Configure auto-scaling (if needed)
- [ ] Test mobile responsiveness

### Within 1 Week
- [ ] Optimize Lambda cold starts
- [ ] Set up CI/CD pipeline
- [ ] Configure automated backups
- [ ] Implement rate limiting
- [ ] Add analytics tracking

## 📊 Monitoring & Maintenance

### Daily
- [ ] Check CloudWatch logs for errors
- [ ] Monitor Lambda execution times
- [ ] Review user activity

### Weekly
- [ ] Review cost dashboard
- [ ] Check database performance
- [ ] Update dependencies if needed
- [ ] Backup database

### Monthly
- [ ] Review AWS bill
- [ ] Optimize unused resources
- [ ] Update security patches
- [ ] Review user feedback

## 🆘 Troubleshooting

### Backend Issues
- **Lambda timeout**: Increase timeout in Lambda settings (max 15 min)
- **Cold start slow**: Use Lambda provisioned concurrency
- **Database connection**: Check security groups and IP whitelist
- **CORS errors**: Verify API Gateway CORS settings

### Frontend Issues
- **404 errors**: Check S3 bucket policy and CloudFront settings
- **API not connecting**: Verify VITE_API_URL in build
- **SSL issues**: Wait for CloudFront certificate propagation (20-30 min)

### Database Issues
- **MongoDB connection**: Check IP whitelist and credentials
- **RDS connection**: Verify security group allows Lambda access
- **Slow queries**: Add indexes to frequently queried fields

## 📞 Support Resources

- AWS Documentation: https://docs.aws.amazon.com/
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Firebase Docs: https://firebase.google.com/docs
- Groq API Docs: https://console.groq.com/docs

## 🎯 Success Criteria

Deployment is successful when:
- [ ] Users can register and login
- [ ] Content generation works
- [ ] Admin panel accessible
- [ ] Team collaboration functional
- [ ] All API endpoints responding
- [ ] No errors in CloudWatch logs
- [ ] Monthly cost under $10
- [ ] Response times under 2 seconds

---

**Estimated Total Time**: 1-2 hours
**Estimated Monthly Cost**: $3-6 (3-6 credits)
**Expected Runtime**: 36+ months with 219 credits

Good luck with your deployment! 🚀
