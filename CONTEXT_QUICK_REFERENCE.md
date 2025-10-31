# Quick Reference for New Chat Sessions - Frontend

## Essential Information
- **Project**: AmesaBase (Lottery Management System)
- **Business Model**: Property lotteries with 4Wins Model (community support)
- **Workspace**: AmesaBase-Monorepo at `C:\Users\dror0\Curser-Repos\AmesaBase-Monorepo\`
- **This Repository**: FE/ (Frontend) → https://github.com/DrorGr/amesaFE
- **Backend Repository**: BE/ → https://github.com/DrorGr/amesaBE
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
- **Working tree**: Tiers 1-3 completed (43/54 non-blocked tasks = 80%) + OAuth ✅ COMPLETE
- **Last activity**: 2025-10-31 - OAuth fully integrated into AuthService and deployed to dev
- **Backend Admin Panel**: ✅ Live on dev, stage, and production
- **OAuth Authentication**: ✅ Frontend COMPLETE (Google, Facebook, Apple) - Integrated into AuthService
  - ✅ OAuth methods in AuthService (`auth.service.ts`)
  - ✅ Popup-based flow with secure message passing
  - ✅ Token storage and session management
  - ✅ Backend controller ready (`BE/AmesaBackend/Controllers/OAuthController.cs`)
  - ⏳ Provider configuration pending (Google Cloud Console, Facebook Developers)
  - 📚 Setup guide: `MetaData/Documentation/OAUTH_SETUP_GUIDE.md`
- **UI/UX Progress**: 
  - ✅ Tier 1 complete (15/15 tasks) - Translations, styling, content cleanup
  - ✅ Tier 2 complete (18/18 tasks) - Layout adjustments, icons, gold gradients
  - ✅ Tier 3 complete (10/16 core features) - Carousel video support, stats bar verified
  - ⏳ Tier 4 pending (12 tasks) - Complex components & animations
  - ⏳ Tier 5 blocked (18 tasks) - Integrations requiring auth/payment setup
- **Current focus**: Tier 4 tasks (animations & components)
- **Environment**: All environments (dev/stage/prod) fully operational with API + Admin Panel

## AWS Infrastructure
- **Frontend**: S3 + CloudFront (All environments operational ✅)
- **Backend**: ECS + ALB (All environments with API routing ✅)
- **Admin Panel**: Blazor Server deployed to all backend environments ✅ NEW (2025-10-12)
  - Dev/Stage: http://amesa-backend-stage-alb-467028641.eu-north-1.elb.amazonaws.com/admin
  - Production: http://amesa-backend-alb-509078867.eu-north-1.elb.amazonaws.com/admin
- **Database**: Aurora PostgreSQL (3 separate clusters with proper authentication ✅)
- **Environments**: dev, stage, prod (All working with full API support + Admin Panel ✅)
- **Secrets**: GitHub repository secrets per environment
- **Recent Deployment**: Admin panel to all environments (2025-10-12)

## When Starting New Chat
1. **Mention monorepo structure** - This is FE/ in AmesaBase-Monorepo
2. Share `FE/.cursorrules` - Frontend context (updated with Tiers 1-3 completion)
3. Share `FE/CONTEXT_QUICK_REFERENCE.md` - This file
4. Share `FINAL_PROGRESS_REPORT.md` - Comprehensive progress summary
5. Share `TIER_1_COMPLETION_SUMMARY.md` + `TIER_2_3_COMPLETION_SUMMARY.md` for details
6. Reference `../MetaData/Documentation/` for cross-cutting docs
7. Reference `../MetaData/Reference/ENVIRONMENT_URLS_GRID.csv` for URLs
8. Mention current branch (dev - UI improvements feature branch)
9. Current status: Tiers 1-3 complete (43/54 tasks = 80%), ready for deployment
10. **NEW**: OAuth authentication frontend complete (Google & Facebook)

## OAuth Authentication Implementation ✅
**Status**: Frontend Complete | Backend Pending  
**Date**: 2025-10-31

### Frontend Components
- ✅ `oauth-callback.component.ts` - OAuth redirect handler
- ✅ `auth.service.oauth.ts` - OAuth methods (Google, Facebook, Apple)
- ✅ `app.routes.ts` - `/auth/callback` route added
- ✅ Translations added (EN/HE) - 10 English, 17 Hebrew keys

### Key Files
- `FE/OAUTH_IMPLEMENTATION_PLAN.md` - Comprehensive backend guide (400+ lines)
- `FE/OAUTH_IMPLEMENTATION_SUMMARY.md` - Status & testing checklist

### Integration Required
1. Copy OAuth methods from `auth.service.oauth.ts` → `auth.service.ts`
2. Implement backend OAuth controller (.NET)
3. Set up Google OAuth app credentials
4. Set up Facebook OAuth app credentials
5. Test end-to-end

### Technical Features
- Popup-based OAuth flow with 5-min timeout
- Secure message passing (postMessage API)
- Origin verification (XSS protection)
- Popup blocker detection
- Multi-language support (EN/HE)
- Dark mode compatible

## Monorepo Navigation
- **Frontend work**: You're here in `FE/`
- **Backend work**: Switch to `../BE/`
- **Documentation**: Check `../MetaData/Documentation/`
- **Scripts**: Check `../MetaData/Scripts/`
- **Configs**: Check `../MetaData/Configs/`
