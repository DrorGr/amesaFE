# Update CloudFront Origin Path to fix MIME type issues
Write-Host "🔧 Updating CloudFront Origin Path" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

Write-Host "`n📋 The Problem:" -ForegroundColor Yellow
Write-Host "CloudFront OriginPath is set to '' (empty)" -ForegroundColor White
Write-Host "But our Angular build files are in the '/browser' subdirectory" -ForegroundColor White
Write-Host "This causes CloudFront to look for files in the wrong location" -ForegroundColor White

Write-Host "`n🔧 The Solution:" -ForegroundColor Yellow
Write-Host "Update CloudFront OriginPath to '/browser'" -ForegroundColor White

Write-Host "`n📝 Manual Steps:" -ForegroundColor Yellow
Write-Host "1. Go to CloudFront Console" -ForegroundColor Cyan
Write-Host "2. Find distribution: E2XBDFAUZJTI59" -ForegroundColor Cyan
Write-Host "3. Go to 'Origins and Origin Groups' tab" -ForegroundColor Cyan
Write-Host "4. Edit the origin 'S3-amesa-frontend-dev'" -ForegroundColor Cyan
Write-Host "5. Set 'Origin path' to: /browser" -ForegroundColor Cyan
Write-Host "6. Save changes and deploy" -ForegroundColor Cyan

Write-Host "`n🚀 AWS CLI Command:" -ForegroundColor Yellow
Write-Host "To update via CLI, you need to:" -ForegroundColor White
Write-Host "1. Get current config: aws cloudfront get-distribution-config --id E2XBDFAUZJTI59" -ForegroundColor Gray
Write-Host "2. Edit the config to change OriginPath from '' to '/browser'" -ForegroundColor Gray
Write-Host "3. Update distribution with the modified config" -ForegroundColor Gray

Write-Host "`n⏱️  After Update:" -ForegroundColor Yellow
Write-Host "1. CloudFront will take 5-15 minutes to deploy the changes" -ForegroundColor White
Write-Host "2. Invalidate cache: aws cloudfront create-invalidation --distribution-id E2XBDFAUZJTI59 --paths '/*'" -ForegroundColor White
Write-Host "3. Test the application again" -ForegroundColor White

Write-Host "`n✅ Expected Result:" -ForegroundColor Green
Write-Host "JavaScript files should load with correct MIME types" -ForegroundColor White
Write-Host "Angular application should work properly" -ForegroundColor White
Write-Host "No more 'Loading...' screen" -ForegroundColor White
