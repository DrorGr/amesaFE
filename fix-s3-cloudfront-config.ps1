# S3 and CloudFront Configuration Script for Amesa Frontend
# This script helps configure S3 buckets and CloudFront distributions for proper deployment

Write-Host "🚀 Amesa Frontend - S3 & CloudFront Configuration Script" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Configuration
$buckets = @(
    @{ Name = "amesa-frontend-dev"; CloudFrontId = "E2XBDFAUZJTI59"; Environment = "Development" },
    @{ Name = "amesa-frontend-stage"; CloudFrontId = "E1D7XQHFF1469W"; Environment = "Staging" },
    @{ Name = "amesa-frontend-prod"; CloudFrontId = "E3GU3QXUR43ZOH"; Environment = "Production" }
)

$region = "eu-north-1"

Write-Host "`n📋 Configuration Summary:" -ForegroundColor Yellow
Write-Host "Region: $region" -ForegroundColor Cyan
Write-Host "Buckets to configure: $($buckets.Count)" -ForegroundColor Cyan

foreach ($bucket in $buckets) {
    Write-Host "`n🔧 Configuring $($bucket.Environment) Environment" -ForegroundColor Yellow
    Write-Host "Bucket: $($bucket.Name)" -ForegroundColor Cyan
    Write-Host "CloudFront ID: $($bucket.CloudFrontId)" -ForegroundColor Cyan
    
    # 1. Enable Static Website Hosting
    Write-Host "`n1️⃣ Enabling Static Website Hosting..." -ForegroundColor Green
    Write-Host "Run this AWS CLI command:" -ForegroundColor White
    Write-Host "aws s3 website s3://$($bucket.Name) --index-document index.html --error-document index.html" -ForegroundColor Gray
    
    # 2. Set Bucket Policy
    Write-Host "`n2️⃣ Setting Bucket Policy..." -ForegroundColor Green
    $bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$($bucket.Name)/*"
        }
    ]
}
"@
    
    Write-Host "Save this policy to a file and apply it:" -ForegroundColor White
    Write-Host "aws s3api put-bucket-policy --bucket $($bucket.Name) --policy file://bucket-policy-$($bucket.Name).json" -ForegroundColor Gray
    
    # Save policy to file
    $policyFile = "bucket-policy-$($bucket.Name).json"
    $bucketPolicy | Out-File -FilePath $policyFile -Encoding UTF8
    Write-Host "✅ Policy saved to: $policyFile" -ForegroundColor Green
    
    # 3. Block Public Access Settings
    Write-Host "`n3️⃣ Configuring Public Access..." -ForegroundColor Green
    Write-Host "Run this command to allow public read access:" -ForegroundColor White
    Write-Host "aws s3api put-public-access-block --bucket $($bucket.Name) --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" -ForegroundColor Gray
    
    # 4. CloudFront Configuration
    Write-Host "`n4️⃣ CloudFront Configuration..." -ForegroundColor Green
    Write-Host "Website endpoint: $($bucket.Name).s3-website.$region.amazonaws.com" -ForegroundColor Cyan
    Write-Host "CloudFront distribution: $($bucket.CloudFrontId)" -ForegroundColor Cyan
    
    Write-Host "`n📝 Manual CloudFront Steps:" -ForegroundColor Yellow
    Write-Host "1. Go to CloudFront Console" -ForegroundColor White
    Write-Host "2. Find distribution: $($bucket.CloudFrontId)" -ForegroundColor White
    Write-Host "3. Edit Origins and Origin Groups:" -ForegroundColor White
    Write-Host "   - Origin Domain: $($bucket.Name).s3-website.$region.amazonaws.com" -ForegroundColor Gray
    Write-Host "   - Origin Path: (leave empty)" -ForegroundColor Gray
    Write-Host "4. Create Error Pages:" -ForegroundColor White
    Write-Host "   - 403 → /index.html (200)" -ForegroundColor Gray
    Write-Host "   - 404 → /index.html (200)" -ForegroundColor Gray
    Write-Host "5. Deploy the changes" -ForegroundColor White
}

Write-Host "`n🎯 Quick Commands Summary:" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow

foreach ($bucket in $buckets) {
    Write-Host "`n$($bucket.Environment):" -ForegroundColor Cyan
    Write-Host "aws s3 website s3://$($bucket.Name) --index-document index.html --error-document index.html" -ForegroundColor Gray
    Write-Host "aws s3api put-bucket-policy --bucket $($bucket.Name) --policy file://bucket-policy-$($bucket.Name).json" -ForegroundColor Gray
    Write-Host "aws s3api put-public-access-block --bucket $($bucket.Name) --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" -ForegroundColor Gray
}

Write-Host "`n🔍 Verification Commands:" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow
Write-Host "Test website endpoints:" -ForegroundColor White
foreach ($bucket in $buckets) {
    Write-Host "curl -I http://$($bucket.Name).s3-website.$region.amazonaws.com" -ForegroundColor Gray
}

Write-Host "`n📚 Additional Resources:" -ForegroundColor Yellow
Write-Host "=======================" -ForegroundColor Yellow
Write-Host "• AWS S3 Console: https://s3.console.aws.amazon.com/" -ForegroundColor Cyan
Write-Host "• CloudFront Console: https://console.aws.amazon.com/cloudfront/" -ForegroundColor Cyan
Write-Host "• Your CloudFront URLs:" -ForegroundColor Cyan
Write-Host "  - Dev: https://d2rmamd755wq7j.cloudfront.net" -ForegroundColor Gray
Write-Host "  - Stage: https://d2ejqzjfslo5hs.cloudfront.net" -ForegroundColor Gray
Write-Host "  - Prod: https://dpqbvdgnen.cloudfront.net" -ForegroundColor Gray

Write-Host "`n✅ Script completed! Follow the steps above to configure your S3 buckets and CloudFront distributions." -ForegroundColor Green
Write-Host "After configuration, your deployments should work without 403 errors." -ForegroundColor Green
