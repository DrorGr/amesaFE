# 🔐 GitHub Secrets Setup Guide for Amesa Frontend

This guide shows you how to configure GitHub Secrets for automatic deployment to AWS.

## 📋 Required GitHub Secrets

### **AWS Credentials (Required for both Frontend and Backend)**
```
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
```

### **Environment-Specific Frontend Secrets**

#### **Development Environment**
```
DEV_API_URL=http://localhost:5000
DEV_BACKEND_URL=http://localhost:5000
DEV_FRONTEND_URL=http://localhost:4200
DEV_S3_BUCKET=amesa-frontend-dev-bucket
DEV_CLOUDFRONT_ID=your-dev-cloudfront-distribution-id
```

#### **Staging Environment**
```
STAGE_API_URL=https://stage-api.amesa.com
STAGE_BACKEND_URL=https://stage-api.amesa.com
STAGE_FRONTEND_URL=https://stage.amesa.com
STAGE_S3_BUCKET=amesa-frontend-stage-bucket
STAGE_CLOUDFRONT_ID=your-stage-cloudfront-distribution-id
```

#### **Production Environment**
```
PROD_API_URL=https://api.amesa.com
PROD_BACKEND_URL=https://api.amesa.com
PROD_FRONTEND_URL=https://amesa.com
PROD_S3_BUCKET=amesa-frontend-prod-bucket
PROD_CLOUDFRONT_ID=your-prod-cloudfront-distribution-id
```

## 🚀 How to Add Secrets

### **Method 1: GitHub Web Interface**
1. Go to your repository: `https://github.com/DrorGr/amesaFE`
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the exact name and value from the list above

### **Method 2: GitHub CLI**
```bash
# Set AWS credentials
gh secret set AWS_ACCESS_KEY_ID --repo DrorGr/amesaFE
gh secret set AWS_SECRET_ACCESS_KEY --repo DrorGr/amesaFE

# Set development secrets
gh secret set DEV_API_URL --repo DrorGr/amesaFE
gh secret set DEV_BACKEND_URL --repo DrorGr/amesaFE
gh secret set DEV_FRONTEND_URL --repo DrorGr/amesaFE
gh secret set DEV_S3_BUCKET --repo DrorGr/amesaFE
gh secret set DEV_CLOUDFRONT_ID --repo DrorGr/amesaFE

# Set staging secrets
gh secret set STAGE_API_URL --repo DrorGr/amesaFE
gh secret set STAGE_BACKEND_URL --repo DrorGr/amesaFE
gh secret set STAGE_FRONTEND_URL --repo DrorGr/amesaFE
gh secret set STAGE_S3_BUCKET --repo DrorGr/amesaFE
gh secret set STAGE_CLOUDFRONT_ID --repo DrorGr/amesaFE

# Set production secrets
gh secret set PROD_API_URL --repo DrorGr/amesaFE
gh secret set PROD_BACKEND_URL --repo DrorGr/amesaFE
gh secret set PROD_FRONTEND_URL --repo DrorGr/amesaFE
gh secret set PROD_S3_BUCKET --repo DrorGr/amesaFE
gh secret set PROD_CLOUDFRONT_ID --repo DrorGr/amesaFE
```

## 🔧 AWS Setup Requirements

### **S3 Buckets**
Create three S3 buckets for static website hosting:
- `amesa-frontend-dev-bucket`
- `amesa-frontend-stage-bucket`
- `amesa-frontend-prod-bucket`

### **CloudFront Distributions**
Create CloudFront distributions for each environment pointing to the respective S3 buckets.

### **IAM Permissions**
Your AWS user/role needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::amesa-frontend-*",
        "arn:aws:s3:::amesa-frontend-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

## ✅ Verification

After setting up all secrets:

1. **Test the workflow**: Make a small change and push to the `dev` branch
2. **Check the Actions tab**: Verify the workflow runs successfully
3. **Verify deployment**: Check that your S3 bucket and CloudFront are updated

## 🚨 Security Notes

- Never commit secrets to your repository
- Use different AWS credentials for different environments
- Regularly rotate your AWS access keys
- Monitor your AWS CloudTrail logs for any suspicious activity

## 🆘 Troubleshooting

### **Common Issues:**
1. **403 Forbidden**: Check AWS credentials and permissions
2. **Bucket not found**: Verify S3 bucket names and regions
3. **CloudFront not updating**: Check distribution ID and permissions

### **Getting Help:**
- Check the GitHub Actions logs for detailed error messages
- Verify all secrets are set correctly
- Ensure AWS resources exist and are accessible
