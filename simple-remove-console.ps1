# Simple script to remove/comment out console logs in production
Write-Host "🧹 Removing console logs from frontend files..." -ForegroundColor Yellow

# Get all TypeScript files
$files = Get-ChildItem -Path "src" -Filter "*.ts" -Recurse | Where-Object { 
    $_.Name -notlike "*.spec.ts" -and 
    $_.Name -notlike "*.test.ts" -and
    $_.Name -ne "logging.service.ts" -and
    $_.Name -ne "translation.service.ts"  # Already properly updated
}

$modifiedFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Skip if no console logs
    if ($content -notmatch "console\.") {
        continue
    }
    
    Write-Host "Processing: $($file.Name)" -ForegroundColor Cyan
    
    # Comment out console logs instead of replacing them
    $content = $content -replace "(\s+)console\.(log|info|warn|error|debug)\s*\([^)]*\);?", "`$1// console.`$2 removed for production"
    
    # Remove any imports that were added by the previous script
    $content = $content -replace "import { LoggingService } from '[^']*';\r?\n", ""
    $content = $content -replace "private logger = inject\(LoggingService\);\r?\n", ""
    $content = $content -replace "this\.logger\.(debug|info|warn|error)\([^)]*\);?", "// Logging removed for production"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modifiedFiles++
        Write-Host "✅ Modified: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n🎉 Console log removal completed!" -ForegroundColor Green
Write-Host "📝 Files modified: $modifiedFiles" -ForegroundColor Cyan
