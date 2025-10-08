# Amesa Frontend

This is the frontend application for the Amesa Lottery system, built with Angular.

## Environment Configuration

The application supports multiple environments: development, dev, stage, and production. Environment-specific configurations are managed through GitHub Secrets and environment files.

### Required GitHub Secrets

To set up the CI/CD pipeline, you need to configure the following secrets in your GitHub repository:

#### AWS Configuration
- `AWS_ACCESS_KEY_ID` - AWS access key for deployment
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for deployment

#### Development Environment
- `DEV_API_URL` - Development API URL (e.g., https://dev-api.amesa.com)
- `DEV_BACKEND_URL` - Development backend URL (e.g., https://dev-api.amesa.com)
- `DEV_FRONTEND_URL` - Development frontend URL (e.g., https://dev.amesa.com)
- `DEV_S3_BUCKET` - Development S3 bucket name
- `DEV_CLOUDFRONT_ID` - Development CloudFront distribution ID

#### Staging Environment
- `STAGE_API_URL` - Staging API URL (e.g., https://stage-api.amesa.com)
- `STAGE_BACKEND_URL` - Staging backend URL (e.g., https://stage-api.amesa.com)
- `STAGE_FRONTEND_URL` - Staging frontend URL (e.g., https://stage.amesa.com)
- `STAGE_S3_BUCKET` - Staging S3 bucket name
- `STAGE_CLOUDFRONT_ID` - Staging CloudFront distribution ID

#### Production Environment
- `PROD_API_URL` - Production API URL (e.g., https://api.amesa.com)
- `PROD_BACKEND_URL` - Production backend URL (e.g., https://api.amesa.com)
- `PROD_FRONTEND_URL` - Production frontend URL (e.g., https://amesa.com)
- `PROD_S3_BUCKET` - Production S3 bucket name
- `PROD_CLOUDFRONT_ID` - Production CloudFront distribution ID

### Setting up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret with the appropriate value

### Local Development

For local development, you can use the development environment:

```bash
npm install
ng serve --configuration=development
```

### Build Commands

- `npm run build` - Build for development
- `npm run build:prod` - Build for production
- `npm run build:stage` - Build for staging

### Deployment

The application automatically deploys based on the branch:

- `dev` branch → Development environment
- `stage` branch → Staging environment
- `main` branch → Production environment

### Environment Files

Environment configurations are located in `src/environments/`:
- `environment.ts` - Base environment (not used in production)
- `environment.dev.ts` - Development environment
- `environment.stage.ts` - Staging environment
- `environment.prod.ts` - Production environment

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Angular CLI

### Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `ng serve`
4. Open browser to `http://localhost:4200`

### Testing

- Run unit tests: `npm run test`
- Run e2e tests: `npm run e2e`
- Run linting: `npm run lint`

## Architecture

This is an Angular standalone application with:
- Modern Angular features (signals, standalone components)
- Tailwind CSS for styling
- Comprehensive service layer
- Multi-language support
- Real-time features via SignalR
- Responsive design
- Accessibility features
