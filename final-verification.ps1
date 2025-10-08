# Final Verification - Test Both Dev and Prod Environments
Write-Host "FINAL VERIFICATION - AMESA FRONTEND DEPLOYMENTS" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# URLs to test
$DevURL = "https://d2rmamd755wq7j.cloudfront.net"
$ProdURL = "https://d3bkt41uo2lxir.cloudfront.net"

Write-Host "Testing environments after GitHub Secrets configuration..." -ForegroundColor Yellow
Write-Host ""

# Function to test URL
function Test-URL {
    param($URL, $Environment)
    
    Write-Host "Testing $Environment..." -ForegroundColor Yellow
    Write-Host "URL: $URL" -ForegroundColor White
    
    try {
        $response = Invoke-WebRequest -Uri $URL -TimeoutSec 30 -UseBasicParsing
        $statusCode = $response.StatusCode
        $contentLength = $response.Content.Length
        
        if ($statusCode -eq 200) {
            Write-Host "$Environment is ALIVE!" -ForegroundColor Green
            Write-Host "   Status: $statusCode" -ForegroundColor Green
            Write-Host "   Content Length: $contentLength bytes" -ForegroundColor Green
            
            # Check if it's Angular content
            if ($response.Content -match "ng-version|angular|app-root") {
                Write-Host "   Angular application detected" -ForegroundColor Green
            } else {
                Write-Host "   Angular content not detected" -ForegroundColor Yellow
            }
            
            return $true
        } else {
            Write-Host "$Environment returned status: $statusCode" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "$Environment is NOT accessible" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    Write-Host ""
}

# Test Development Environment
Write-Host "DEVELOPMENT ENVIRONMENT" -ForegroundColor Yellow
Write-Host "=======================" -ForegroundColor Yellow
$devStatus = Test-URL -URL $DevURL -Environment "Development"

Write-Host ""
Write-Host "PRODUCTION ENVIRONMENT" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow
$prodStatus = Test-URL -URL $ProdURL -Environment "Production"

Write-Host ""
Write-Host "FINAL DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

if ($devStatus) {
    Write-Host "Development: ALIVE at $DevURL" -ForegroundColor Green
} else {
    Write-Host "Development: NOT ACCESSIBLE" -ForegroundColor Red
}

if ($prodStatus) {
    Write-Host "Production: ALIVE at $ProdURL" -ForegroundColor Green
} else {
    Write-Host "Production: NOT ACCESSIBLE" -ForegroundColor Red
}

Write-Host ""
if ($devStatus -and $prodStatus) {
    Write-Host "ALL ENVIRONMENTS ARE WORKING!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your Amesa Lottery deployment system is COMPLETE!" -ForegroundColor Green
} else {
    Write-Host "Some environments need attention:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Check GitHub Actions workflow status:" -ForegroundColor White
    Write-Host "   https://github.com/DrorGr/amesaFE/actions" -ForegroundColor White
    Write-Host ""
    Write-Host "2. CloudFront distributions can take 10-15 minutes to fully deploy" -ForegroundColor White
}

Write-Host ""
Write-Host "QUICK ACCESS LINKS:" -ForegroundColor Cyan
Write-Host "Development:  $DevURL" -ForegroundColor White
Write-Host "Production:   $ProdURL" -ForegroundColor White
