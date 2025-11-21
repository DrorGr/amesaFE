# PowerShell script to remove console logs from production builds
# This script replaces console.log statements with proper logging service calls

Write-Host "🧹 Removing console logs from frontend..." -ForegroundColor Yellow

# Get all TypeScript files in src directory
$files = Get-ChildItem -Path "src" -Filter "*.ts" -Recurse | Where-Object { 
    $_.Name -notlike "*.spec.ts" -and 
    $_.Name -notlike "*.test.ts" -and
    $_.Name -ne "logging.service.ts" -and
    $_.Name -ne "translation.service.ts"  # Already updated
}

$totalFiles = $files.Count
$processedFiles = 0
$modifiedFiles = 0

foreach ($file in $files) {
    $processedFiles++
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Skip if file doesn't contain console logs
    if ($content -notmatch "console\.") {
        Write-Progress -Activity "Processing files" -Status "Skipping $($file.Name)" -PercentComplete (($processedFiles / $totalFiles) * 100)
        continue
    }
    
    Write-Progress -Activity "Processing files" -Status "Processing $($file.Name)" -PercentComplete (($processedFiles / $totalFiles) * 100)
    
    # Check if LoggingService is already imported
    $hasLoggingImport = $content -match "import.*LoggingService"
    $hasInjectImport = $content -match "import.*inject"
    
    # Add imports if needed
    if (-not $hasLoggingImport -and $content -match "console\.") {
        # Find the last import statement
        $lines = $content -split "`n"
        $lastImportIndex = -1
        
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -match "^import.*from") {
                $lastImportIndex = $i
            }
        }
        
        if ($lastImportIndex -ge 0) {
            # Add LoggingService import after the last import
            $newImport = "import { LoggingService } from './logging.service';"
            if ($lines[$lastImportIndex] -match "from '\.\./") {
                $newImport = "import { LoggingService } from '../logging.service';"
            } elseif ($lines[$lastImportIndex] -match "from '\.\./\.\./") {
                $newImport = "import { LoggingService } from '../../logging.service';"
            }
            
            $lines = $lines[0..$lastImportIndex] + $newImport + $lines[($lastImportIndex + 1)..($lines.Length - 1)]
            $content = $lines -join "`n"
        }
        
        # Add inject import if needed
        if (-not $hasInjectImport -and $content -match "@Injectable") {
            $content = $content -replace "(import { [^}]+) }", "`$1, inject }"
            if ($content -notmatch "inject") {
                $content = $content -replace "import { Injectable }", "import { Injectable, inject }"
            }
        }
    }
    
    # Add logger injection to services/components
    if ($content -match "@Injectable" -and $content -notmatch "private logger.*LoggingService") {
        # Find constructor or add logger injection
        if ($content -match "constructor\s*\([^)]*\)\s*{") {
            # Add logger to existing constructor
            $content = $content -replace "(constructor\s*\([^)]*)\)", "`$1private logger = inject(LoggingService))"
        } elseif ($content -match "private \w+.*= inject\(") {
            # Add logger injection with other injections
            $content = $content -replace "(private \w+.*= inject\([^)]+\);)", "`$1`n  private logger = inject(LoggingService);"
        }
    }
    
    # Replace console.log statements
    $content = $content -replace "console\.log\s*\(\s*[`'`"]([^`'`"]+)[`'`"]\s*,?\s*([^)]*)\)", "this.logger.debug('`$1', `$2)"
    $content = $content -replace "console\.log\s*\(\s*[`'`"]([^`'`"]+)[`'`"]\s*\)", "this.logger.debug('`$1')"
    
    # Replace console.info statements
    $content = $content -replace "console\.info\s*\(\s*[`'`"]([^`'`"]+)[`'`"]\s*,?\s*([^)]*)\)", "this.logger.info('`$1', `$2)"
    $content = $content -replace "console\.info\s*\(\s*[`'`"]([^`'`"]+)[`'`"]\s*\)", "this.logger.info('`$1')"
    
    # Replace console.warn statements
    $content = $content -replace "console\.warn\s*\(\s*[`'`"]([^`'`"]+)[`'`"]\s*,?\s*([^)]*)\)", "this.logger.warn('`$1', `$2)"
    $content = $content -replace "console\.warn\s*\(\s*[`'`"]([^`'`"]+)[`'`"]\s*\)", "this.logger.warn('`$1')"
    
    # Replace console.error statements
    $content = $content -replace "console\.error\s*\(\s*[`'`"]([^`'`"]+)[`'`"]\s*,?\s*([^)]*)\)", "this.logger.error('`$1', `$2)"
    $content = $content -replace "console\.error\s*\(\s*[`'`"]([^`'`"]+)[`'`"]\s*\)", "this.logger.error('`$1')"
    
    # Replace console.debug statements
    $content = $content -replace "console\.debug\s*\(\s*[`'`"]([^`'`"]+)[`'`"]\s*,?\s*([^)]*)\)", "this.logger.debug('`$1', `$2)"
    $content = $content -replace "console\.debug\s*\(\s*[`'`"]([^`'`"]+)[`'`"]\s*\)", "this.logger.debug('`$1')"
    
    # Save file if modified
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modifiedFiles++
        Write-Host "✅ Modified: $($file.Name)" -ForegroundColor Green
    }
}

Write-Progress -Activity "Processing files" -Completed

Write-Host "`n🎉 Console log removal completed!" -ForegroundColor Green
Write-Host "📊 Files processed: $processedFiles" -ForegroundColor Cyan
Write-Host "📝 Files modified: $modifiedFiles" -ForegroundColor Cyan

if ($modifiedFiles -gt 0) {
    Write-Host "`n⚠️  Please review the changes and test the application!" -ForegroundColor Yellow
    Write-Host "💡 The LoggingService will automatically suppress logs in production builds." -ForegroundColor Blue
}
