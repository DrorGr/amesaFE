# Quick Reference for New Chat Sessions

## Essential Information
- **Project**: AmesaBase (Lottery Management System)
- **Business Model**: Property lotteries with 4Wins Model (community support)
- **Repositories**: AmesaFE, AmesaBE, AmesaDevOps
- **Current Repo**: AmesaFE (Frontend)
- **Current Branch**: dev (synced with stage and main)
- **Architecture**: Angular 20.2.1 + .NET 8.0 + Aurora PostgreSQL
- **Deployment**: AWS (S3 + CloudFront + ECS + ALB)

## Repository Overview
- **AmesaFE**: Angular frontend → S3 + CloudFront
- **AmesaBE**: .NET backend → Docker + ECS
- **AmesaDevOps**: Infrastructure as Code
- **Database**: Aurora PostgreSQL (separate clusters: prod/test/dev)
- **Secrets**: GitHub repository secrets for AWS credentials
- **Configuration**: Single codebase with external environment config
- **CLI Tools**: AWS CLI, Angular CLI, GitHub CLI

## Key Files to Check
### Frontend (AmesaFE):
- `package.json` - Dependencies
- `angular.json` - Angular config
- `src/environments/` - Environment configs
- `.github/workflows/` - CI/CD

### Backend (AmesaBE):
- `Dockerfile` - Container config
- ECS task definitions
- .NET project files

### DevOps (AmesaDevOps):
- Terraform/CloudFormation templates
- Deployment scripts

## Common Commands
```bash
# Frontend (AmesaFE)
npm install
ng serve
ng build --configuration=production
ng build --configuration=development
ng build --configuration=test

# Backend (AmesaBE)
dotnet build
dotnet run
docker build -t amesa-backend .
docker build --build-arg ENV=dev -t amesa-backend:dev .

# DevOps (AmesaDevOps)
terraform apply
./deploy.sh [environment]
aws ssm get-parameter --name "/amesa/dev/database-url"

# GitHub CLI
gh secret list
gh secret set SECRET_NAME --body "value"

# Git (all repos)
git status
git log --oneline -5
```

## Current Status
- **Working tree**: Clean, all changes committed and pushed
- **Last activity**: 2025-10-10 - Fixed MIME type errors, API routing, and database authentication
- **Current focus**: System maintenance and team enablement
- **Environment**: All environments (dev/stage/prod) fully operational with complete API support

## AWS Infrastructure
- **Frontend**: S3 + CloudFront (All environments operational ✅)
- **Backend**: ECS + ALB (All environments with API routing ✅)
- **Database**: Aurora PostgreSQL (3 separate clusters with proper authentication ✅)
- **Environments**: dev, stage, prod (All working with full API support ✅)
- **Secrets**: GitHub repository secrets per environment
- **Recent Fixes**: CloudFront MIME type errors, API routing, database authentication (2025-10-10)

## When Starting New Chat
1. Share `PROJECT_OVERVIEW.md`
2. Share `CURRENT_WORK.md`
3. Share `TECH_STACK.md`
4. Share `REPO_STRUCTURE.md`
5. Share `SECRETS_MANAGEMENT.md`
6. Share `ENVIRONMENT_CONFIG.md`
7. Share `ACTUAL_IMPLEMENTATION_DETAILS.md`
8. Share `AWS_INFRASTRUCTURE_DETAILS.md`
9. Mention current repo, branch, and recent changes
10. Describe what you need help with
