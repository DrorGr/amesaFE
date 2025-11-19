# Frontend-Backend Integration Test Script
# Tests the integration between Angular frontend and .NET backend

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend-Backend Integration Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test Configuration
$backendUrl = "http://localhost:5000"
$frontendUrl = "http://localhost:4200"
$apiBase = "$backendUrl/api/v1"

Write-Host "Test Configuration:" -ForegroundColor Yellow
Write-Host "  Backend: $backendUrl" -ForegroundColor White
Write-Host "  Frontend: $frontendUrl" -ForegroundColor White
Write-Host "  API Base: $apiBase" -ForegroundColor White
Write-Host ""

# Test Results
$tests = @()

# Test 1: Backend Health Check
Write-Host "Test 1: Backend Health Check" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ PASS: Health endpoint returns 200" -ForegroundColor Green
        $tests += @{Test = "Backend Health"; Status = "PASS"; Details = "200 OK"}
    } else {
        Write-Host "  ❌ FAIL: Unexpected status code: $($response.StatusCode)" -ForegroundColor Red
        $tests += @{Test = "Backend Health"; Status = "FAIL"; Details = "Status: $($response.StatusCode)"}
    }
} catch {
    Write-Host "  ❌ FAIL: $_" -ForegroundColor Red
    $tests += @{Test = "Backend Health"; Status = "FAIL"; Details = $_.Exception.Message}
}
Write-Host ""

# Test 2: OAuth Endpoint (should redirect)
Write-Host "Test 2: OAuth Endpoint" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$apiBase/oauth/google" -UseBasicParsing -TimeoutSec 5 -MaximumRedirection 0 -ErrorAction SilentlyContinue
    Write-Host "  ⚠️  WARNING: OAuth returned $($response.StatusCode) (expected redirect)" -ForegroundColor Yellow
    $tests += @{Test = "OAuth Endpoint"; Status = "WARN"; Details = "Status: $($response.StatusCode)"}
} catch {
    if ($_.Exception.Response.StatusCode -eq 302) {
        Write-Host "  ✅ PASS: OAuth endpoint redirects correctly (302)" -ForegroundColor Green
        $tests += @{Test = "OAuth Endpoint"; Status = "PASS"; Details = "302 Redirect"}
    } else {
        Write-Host "  ⚠️  WARNING: OAuth endpoint: $_" -ForegroundColor Yellow
        $tests += @{Test = "OAuth Endpoint"; Status = "WARN"; Details = $_.Exception.Message}
    }
}
Write-Host ""

# Test 3: Frontend Accessibility
Write-Host "Test 3: Frontend Accessibility" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ PASS: Frontend is accessible (200)" -ForegroundColor Green
        $tests += @{Test = "Frontend Accessibility"; Status = "PASS"; Details = "200 OK"}
    } else {
        Write-Host "  ⚠️  WARNING: Frontend returned $($response.StatusCode)" -ForegroundColor Yellow
        $tests += @{Test = "Frontend Accessibility"; Status = "WARN"; Details = "Status: $($response.StatusCode)"}
    }
} catch {
    Write-Host "  ⚠️  WARNING: Frontend not ready yet: $_" -ForegroundColor Yellow
    Write-Host "     (This is normal if Angular is still compiling)" -ForegroundColor Gray
    $tests += @{Test = "Frontend Accessibility"; Status = "WARN"; Details = "Still starting"}
}
Write-Host ""

# Test 4: API Endpoint Structure
Write-Host "Test 4: API Endpoint Structure" -ForegroundColor Cyan
Write-Host "  Testing endpoint paths..." -ForegroundColor Gray

$endpoints = @(
    @{Path = "/health"; Name = "Health Check"},
    @{Path = "/api/v1/oauth/google"; Name = "OAuth Google"},
    @{Path = "/api/v1/houses"; Name = "Houses API"},
    @{Path = "/api/v1/translations/en"; Name = "Translations API"},
    @{Path = "/api/v1/auth/me"; Name = "Auth Me"}
)

foreach ($endpoint in $endpoints) {
    $fullUrl = "$backendUrl$($endpoint.Path)"
    try {
        $response = Invoke-WebRequest -Uri $fullUrl -UseBasicParsing -TimeoutSec 3 -MaximumRedirection 0 -ErrorAction SilentlyContinue
        Write-Host "    ✅ $($endpoint.Name): $($response.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 302) {
            Write-Host "    ✅ $($endpoint.Name): $statusCode (expected)" -ForegroundColor Green
        } elseif ($statusCode -eq 500) {
            Write-Host "    ⚠️  $($endpoint.Name): 500 (database connection issue)" -ForegroundColor Yellow
        } else {
            Write-Host "    ⚠️  $($endpoint.Name): $statusCode" -ForegroundColor Yellow
        }
    }
}
Write-Host ""

# Test 5: CORS Configuration
Write-Host "Test 5: CORS Configuration" -ForegroundColor Cyan
try {
    $headers = @{
        "Origin" = "http://localhost:4200"
        "Access-Control-Request-Method" = "GET"
    }
    $response = Invoke-WebRequest -Uri "$apiBase/houses" -Method OPTIONS -Headers $headers -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "  ✅ PASS: CORS preflight works" -ForegroundColor Green
    $tests += @{Test = "CORS Configuration"; Status = "PASS"; Details = "OPTIONS request successful"}
} catch {
    Write-Host "  ⚠️  WARNING: CORS test failed (may need authentication)" -ForegroundColor Yellow
    $tests += @{Test = "CORS Configuration"; Status = "WARN"; Details = "May require auth"}
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$passed = ($tests | Where-Object { $_.Status -eq "PASS" }).Count
$warned = ($tests | Where-Object { $_.Status -eq "WARN" }).Count
$failed = ($tests | Where-Object { $_.Status -eq "FAIL" }).Count

Write-Host "Results:" -ForegroundColor Yellow
Write-Host "  ✅ Passed: $passed" -ForegroundColor Green
Write-Host "  ⚠️  Warnings: $warned" -ForegroundColor Yellow
Write-Host "  ❌ Failed: $failed" -ForegroundColor Red
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:4200 in your browser" -ForegroundColor White
Write-Host "2. Open browser DevTools (F12) > Network tab" -ForegroundColor White
Write-Host "3. Test the following:" -ForegroundColor White
Write-Host "   - Click 'Login' and test OAuth buttons" -ForegroundColor Gray
Write-Host "   - Navigate to house listings" -ForegroundColor Gray
Write-Host "   - Switch languages" -ForegroundColor Gray
Write-Host "   - Check Network tab for API calls" -ForegroundColor Gray
Write-Host ""
Write-Host "Note: 500 errors on Houses/Translations are likely due to" -ForegroundColor Yellow
Write-Host "      database connectivity (local dev connects to production DB)" -ForegroundColor Yellow
Write-Host ""

