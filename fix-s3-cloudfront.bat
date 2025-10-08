@echo off
echo 🚀 Amesa Frontend - S3 & CloudFront Configuration
echo ================================================

echo.
echo 📋 Quick Configuration Commands:
echo.

echo 🔧 Development Environment:
echo aws s3 website s3://amesa-frontend-dev --index-document index.html --error-document index.html
echo aws s3api put-bucket-policy --bucket amesa-frontend-dev --policy file://bucket-policy-dev.json
echo aws s3api put-public-access-block --bucket amesa-frontend-dev --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

echo.
echo 🔧 Staging Environment:
echo aws s3 website s3://amesa-frontend-stage --index-document index.html --error-document index.html
echo aws s3api put-bucket-policy --bucket amesa-frontend-stage --policy file://bucket-policy-stage.json
echo aws s3api put-public-access-block --bucket amesa-frontend-stage --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

echo.
echo 🔧 Production Environment:
echo aws s3 website s3://amesa-frontend-prod --index-document index.html --error-document index.html
echo aws s3api put-bucket-policy --bucket amesa-frontend-prod --policy file://bucket-policy-prod.json
echo aws s3api put-public-access-block --bucket amesa-frontend-prod --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

echo.
echo 📝 CloudFront Configuration:
echo 1. Go to CloudFront Console
echo 2. Update Origins to use S3 website endpoints:
echo    - Dev: amesa-frontend-dev.s3-website.eu-north-1.amazonaws.com
echo    - Stage: amesa-frontend-stage.s3-website.eu-north-1.amazonaws.com
echo    - Prod: amesa-frontend-prod.s3-website.eu-north-1.amazonaws.com
echo 3. Add Error Pages: 403 and 404 → /index.html (200)

echo.
echo 🔍 Test URLs:
echo Dev: https://d2rmamd755wq7j.cloudfront.net
echo Stage: https://d2ejqzjfslo5hs.cloudfront.net
echo Prod: https://dpqbvdgnen.cloudfront.net

pause
