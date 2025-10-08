# Configure GitHub Secrets for Amesa Frontend Repository
Write-Host "🔐 Configuring GitHub Secrets for Amesa Frontend Repository" -ForegroundColor Cyan
Write-Host "Repository: https://github.com/DrorGr/amesaFE" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 Required Secrets:" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔑 AWS Credentials:" -ForegroundColor Yellow
Write-Host "   AWS_ACCESS_KEY_ID = YOUR_AWS_ACCESS_KEY_ID" -ForegroundColor White
Write-Host "   AWS_SECRET_ACCESS_KEY = YOUR_AWS_SECRET_ACCESS_KEY" -ForegroundColor White
Write-Host ""

Write-Host "🛠️  Development Environment:" -ForegroundColor Yellow
Write-Host "   DEV_API_URL = http://localhost:5000" -ForegroundColor White
Write-Host "   DEV_BACKEND_URL = http://localhost:5000" -ForegroundColor White
Write-Host "   DEV_FRONTEND_URL = http://localhost:4200" -ForegroundColor White
Write-Host "   DEV_S3_BUCKET = amesa-frontend-dev" -ForegroundColor White
Write-Host "   DEV_CLOUDFRONT_ID = E2XBDFAUZJTI59" -ForegroundColor White
Write-Host ""

Write-Host "🧪 Staging Environment:" -ForegroundColor Yellow
Write-Host "   STAGE_API_URL = https://stage-api.amesa.com" -ForegroundColor White
Write-Host "   STAGE_BACKEND_URL = https://stage-api.amesa.com" -ForegroundColor White
Write-Host "   STAGE_FRONTEND_URL = https://stage.amesa.com" -ForegroundColor White
Write-Host "   STAGE_S3_BUCKET = amesa-frontend-stage" -ForegroundColor White
Write-Host "   STAGE_CLOUDFRONT_ID = E1D7XQHFF1469W" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Production Environment:" -ForegroundColor Yellow
Write-Host "   PROD_API_URL = https://api.amesa.com" -ForegroundColor White
Write-Host "   PROD_BACKEND_URL = https://api.amesa.com" -ForegroundColor White
Write-Host "   PROD_FRONTEND_URL = https://amesa.com" -ForegroundColor White
Write-Host "   PROD_S3_BUCKET = amesa-frontend-prod" -ForegroundColor White
Write-Host "   PROD_CLOUDFRONT_ID = E3GU3QXUR43ZOH" -ForegroundColor White
Write-Host ""

Write-Host "📝 Configuration Steps:" -ForegroundColor Yellow
Write-Host "1. Go to: https://github.com/DrorGr/amesaFE/settings/secrets/actions" -ForegroundColor White
Write-Host "2. Click New repository secret for each secret above" -ForegroundColor White
Write-Host "3. Copy the values from the list above" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important: Replace AWS credentials with your actual values!" -ForegroundColor Red
Write-Host ""
Write-Host "🌐 CloudFront URLs:" -ForegroundColor Cyan
Write-Host "   Dev: https://d2rmamd755wq7j.cloudfront.net" -ForegroundColor White
Write-Host "   Stage: https://d2ejqzjfslo5hs.cloudfront.net" -ForegroundColor White
Write-Host "   Prod: https://dpqbvdgnenckf.cloudfront.net" -ForegroundColor White
Write-Host ""
Write-Host "⏰ Note: CloudFront distributions take 10-15 minutes to fully deploy" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Next Step: Test deployment by pushing to dev branch!" -ForegroundColor Green
