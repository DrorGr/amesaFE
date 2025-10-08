# 🚀 Amesa GitHub → AWS Deployment Flow

## 📊 Complete Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GITHUB REPOSITORIES                                │
├─────────────────────────────────┬───────────────────────────────────────────────┤
│         amesaFE                 │                    amesaBE                     │
│    (Frontend Repository)        │              (Backend Repository)             │
│                                 │                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────┐ │ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │
│  │   dev   │ │  stage  │ │main │ │ │   dev   │ │  stage  │ │      main       │ │
│  │ branch  │ │ branch  │ │branch│ │ │ branch  │ │ branch  │ │     branch      │ │
│  └─────────┘ └─────────┘ └─────┘ │ └─────────┘ └─────────┘ └─────────────────┘ │
└─────────────────────────────────┴───────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           GITHUB ACTIONS WORKFLOWS                              │
├─────────────────────────────────┬───────────────────────────────────────────────┤
│        Frontend Workflow        │               Backend Workflow                │
│                                 │                                               │
│  1. Checkout Code               │  1. Checkout Code                             │
│  2. Setup Node.js 20            │  2. Setup .NET 8.0                           │
│  3. Install Dependencies        │  3. Restore Dependencies                      │
│  4. Run Linting & Tests         │  4. Build Application                        │
│  5. Build Angular App           │  5. Run Tests                                │
│  6. Deploy to S3                │  6. Publish Application                      │
│  7. Invalidate CloudFront       │  7. Build Docker Image                       │
│                                 │  8. Push to ECR                              │
│                                 │  9. Update ECS Service                       │
└─────────────────────────────────┴───────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               AWS INFRASTRUCTURE                                │
├─────────────────────────────────┬───────────────────────────────────────────────┤
│         Frontend (S3/CF)        │              Backend (ECS/ECR)                │
│                                 │                                               │
│  ┌─────────────────────────┐   │  ┌─────────────────────────────────────────┐ │
│  │     S3 Buckets          │   │  │         ECR Repository                  │ │
│  │                         │   │  │                                         │ │
│  │ • amesa-frontend-dev    │   │  │ • amesabe (eu-north-1)                 │ │
│  │ • amesa-frontend-stage  │   │  │   - dev-{sha}                          │ │
│  │ • amesa-frontend-prod   │   │  │   - stage-{sha}                        │ │
│  └─────────────────────────┘   │  │   - prod-{sha}                         │ │
│                                 │  │   - latest                             │ │
│  ┌─────────────────────────┐   │  └─────────────────────────────────────────┘ │
│  │   CloudFront CDN        │   │                                             │
│  │                         │   │  ┌─────────────────────────────────────────┐ │
│  │ • Dev Distribution      │   │  │         ECS Clusters                   │ │
│  │ • Stage Distribution    │   │  │                                         │ │
│  │ • Prod Distribution     │   │  │ • amesa-dev-cluster                    │ │
│  └─────────────────────────┘   │  │ • amesa-stage-cluster                  │ │
│                                 │  │ • amesa-prod-cluster                   │ │
│                                 │  └─────────────────────────────────────────┘ │
└─────────────────────────────────┴───────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ENVIRONMENT FLOW                                   │
├─────────────────────────────────┬───────────────────────────────────────────────┤
│           Frontend              │                    Backend                     │
│                                 │                                               │
│  dev branch → S3 Dev Bucket     │  dev branch → ECR dev-{sha} → ECS Dev        │
│  stage branch → S3 Stage Bucket │  stage branch → ECR stage-{sha} → ECS Stage  │
│  main branch → S3 Prod Bucket   │  main branch → ECR prod-{sha} → ECS Prod     │
└─────────────────────────────────┴───────────────────────────────────────────────┘
```

## 🔄 Deployment Triggers

### **Automatic Triggers:**
- **Push to `dev` branch** → Deploy to Development environment
- **Push to `stage` branch** → Deploy to Staging environment  
- **Push to `main` branch** → Deploy to Production environment

### **Manual Triggers:**
- **Workflow Dispatch** → Manual deployment from GitHub Actions UI

## 🔐 Security & Secrets

### **GitHub Secrets Required:**
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
DEV_S3_BUCKET, DEV_CLOUDFRONT_ID
STAGE_S3_BUCKET, STAGE_CLOUDFRONT_ID
PROD_S3_BUCKET, PROD_CLOUDFRONT_ID
DEV_ECS_CLUSTER, DEV_ECS_SERVICE
STAGE_ECS_CLUSTER, STAGE_ECS_SERVICE
PROD_ECS_CLUSTER, PROD_ECS_SERVICE
```

## 📈 Benefits of This Setup

### **🚀 Automation:**
- Zero-touch deployments
- Consistent deployment process
- Reduced human error

### **🛡️ Security:**
- No secrets in code
- Environment isolation
- AWS IAM permissions

### **📊 Monitoring:**
- GitHub Actions logs
- AWS CloudWatch metrics
- ECS service health checks

### **🔄 Flexibility:**
- Easy rollbacks
- Environment-specific configurations
- Manual deployment options

## 🎯 Next Steps

1. **Set up GitHub Secrets** using the provided guides
2. **Test with dev branch** to verify the flow
3. **Configure monitoring** and alerts
4. **Set up staging environment** for testing
5. **Deploy to production** when ready

This setup provides a professional, scalable, and secure deployment pipeline for your Amesa Lottery application! 🎉
