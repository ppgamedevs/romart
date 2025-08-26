# Test Email & Notification System
Write-Host "Testing Email & Notification System" -ForegroundColor Green

# Set environment variables for testing
$env:EMAIL_PROVIDER = "RESEND"
$env:EMAIL_FROM = "RomArt <no-reply@artfromromania.com>"
$env:EMAIL_REPLY_TO = "curator@artfromromania.com"
$env:RESEND_API_KEY = "re_9snVxsSG_7iPTXsu9hwTKbFbvBhmCmpiH"
$env:NOTIF_SIGNED_URL_TTL = "900"

Write-Host "Environment variables set" -ForegroundColor Green

# Test notification system database
Write-Host "`nTesting notification system database..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/admin/test-notifications" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Notification system working:" -ForegroundColor Green
    Write-Host "   - User preferences: $($data.counts.userNotifPrefs)" -ForegroundColor Cyan
    Write-Host "   - Notifications: $($data.counts.notifications)" -ForegroundColor Cyan
    Write-Host "   - Email logs: $($data.counts.emailLogs)" -ForegroundColor Cyan
} catch {
    Write-Host "Notification system test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test API health
Write-Host "`nTesting API health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/healthz" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    Write-Host "API health check passed:" -ForegroundColor Green
    Write-Host "   - Database: $($data.db.ok)" -ForegroundColor Cyan
    Write-Host "   - Artists: $($data.db.artists)" -ForegroundColor Cyan
    Write-Host "   - Artworks: $($data.db.artworks)" -ForegroundColor Cyan
    Write-Host "   - Orders: $($data.db.orders)" -ForegroundColor Cyan
} catch {
    Write-Host "API health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nEmail & Notification System Test Complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Re-enable email routes in the API" -ForegroundColor White
Write-Host "2. Test order confirmation emails" -ForegroundColor White
Write-Host "3. Test shipping status emails" -ForegroundColor White
