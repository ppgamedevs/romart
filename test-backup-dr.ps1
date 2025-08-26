# Test Backup & Disaster Recovery Setup - Prompt 26
Write-Host "Testing Backup & Disaster Recovery Pack (Prompt 26)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Test 1: Backup Scripts Exist
Write-Host "`n1. Testing Backup Scripts..." -ForegroundColor Yellow
$backupScripts = @(
    "ops/backup/backup_db.sh",
    "ops/backup/restore_db_from_dump.sh",
    "ops/backup/meili_dump.sh",
    "ops/backup/verify_restore.sh"
)

foreach ($script in $backupScripts) {
    if (Test-Path $script) {
        Write-Host "   ✅ $script exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $script missing" -ForegroundColor Red
    }
}

# Test 2: GitHub Actions Workflow
Write-Host "`n2. Testing GitHub Actions Workflow..." -ForegroundColor Yellow
if (Test-Path ".github/workflows/db-backup.yml") {
    Write-Host "   ✅ db-backup.yml exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ db-backup.yml missing" -ForegroundColor Red
}

# Test 3: R2 Lifecycle Documentation
Write-Host "`n3. Testing R2 Lifecycle Documentation..." -ForegroundColor Yellow
if (Test-Path ".github/workflows/r2-lifecycle-note.md") {
    Write-Host "   ✅ r2-lifecycle-note.md exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ r2-lifecycle-note.md missing" -ForegroundColor Red
}

# Test 4: Disaster Recovery Runbook
Write-Host "`n4. Testing Disaster Recovery Runbook..." -ForegroundColor Yellow
if (Test-Path "docs/RUNBOOK_DR.md") {
    Write-Host "   ✅ RUNBOOK_DR.md exists" -ForegroundColor Green
    $content = Get-Content "docs/RUNBOOK_DR.md" -Raw
    if ($content -match "RPO.*30 minutes" -and $content -match "RTO.*4 hours") {
        Write-Host "   ✅ RPO/RTO targets documented" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  RPO/RTO targets not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ RUNBOOK_DR.md missing" -ForegroundColor Red
}

# Test 5: Environment Variables
Write-Host "`n5. Testing Environment Variables..." -ForegroundColor Yellow
$envVars = @(
    "BACKUP_BUCKET",
    "BACKUP_PREFIX",
    "BACKUP_RETENTION_DAYS",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_ENDPOINT",
    "AGE_RECIPIENT"
)

foreach ($var in $envVars) {
    if (Get-Variable -Name $var -ErrorAction SilentlyContinue) {
        Write-Host "   ✅ $var is set" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $var is not set" -ForegroundColor Yellow
    }
}

# Test 6: Script Permissions (Unix-like check)
Write-Host "`n6. Testing Script Permissions..." -ForegroundColor Yellow
$scripts = @("ops/backup/backup_db.sh", "ops/backup/restore_db_from_dump.sh")
foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "   ✅ $script exists (check permissions on Unix)" -ForegroundColor Green
    }
}

# Test 7: Backup Script Content Validation
Write-Host "`n7. Testing Backup Script Content..." -ForegroundColor Yellow
if (Test-Path "ops/backup/backup_db.sh") {
    $content = Get-Content "ops/backup/backup_db.sh" -Raw
    if ($content -match "pg_dump" -and $content -match "aws s3 cp") {
        Write-Host "   ✅ backup_db.sh contains pg_dump and aws s3 commands" -ForegroundColor Green
    } else {
        Write-Host "   ❌ backup_db.sh missing required commands" -ForegroundColor Red
    }
}

# Test 8: Restore Script Content Validation
Write-Host "`n8. Testing Restore Script Content..." -ForegroundColor Yellow
if (Test-Path "ops/backup/restore_db_from_dump.sh") {
    $content = Get-Content "ops/backup/restore_db_from_dump.sh" -Raw
    if ($content -match "pg_restore" -and $content -match "age -d") {
        Write-Host "   ✅ restore_db_from_dump.sh contains pg_restore and age commands" -ForegroundColor Green
    } else {
        Write-Host "   ❌ restore_db_from_dump.sh missing required commands" -ForegroundColor Red
    }
}

# Test 9: GitHub Actions Content Validation
Write-Host "`n9. Testing GitHub Actions Content..." -ForegroundColor Yellow
if (Test-Path ".github/workflows/db-backup.yml") {
    $content = Get-Content ".github/workflows/db-backup.yml" -Raw
    if ($content -match "cron.*15 2" -and $content -match "postgresql-client") {
        Write-Host "   ✅ db-backup.yml contains cron schedule and PostgreSQL client" -ForegroundColor Green
    } else {
        Write-Host "   ❌ db-backup.yml missing required configuration" -ForegroundColor Red
    }
}

Write-Host "`nBackup & Disaster Recovery Testing Complete!" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Gray
Write-Host "1. Configure R2 bucket with lifecycle rules" -ForegroundColor Gray
Write-Host "2. Set up GitHub secrets for automated backups" -ForegroundColor Gray
Write-Host "3. Test backup and restore procedures" -ForegroundColor Gray
Write-Host "4. Schedule quarterly fire drills" -ForegroundColor Gray
