# Quick API Test
Write-Host "=== Quick API Test ===" -ForegroundColor Green

# Start API in background
Write-Host "Starting API..." -ForegroundColor Yellow
$apiProcess = Start-Process -FilePath "npx" -ArgumentList "tsx", "--no-warnings", "src/index.ts" -WorkingDirectory "C:\Users\eugen\romart\apps\api" -WindowStyle Hidden -PassThru

# Wait for API to start
Write-Host "Waiting for API to start..." -ForegroundColor Yellow
Start-Sleep 8

# Test health endpoint
Write-Host "Testing health endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/healthz" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Health: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test stats endpoint
Write-Host "Testing stats endpoint..." -ForegroundColor Cyan
try {
    $body = @{artworkId = "test-artwork-123"} | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/stats/view" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Stats: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Stats failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test collections endpoint
Write-Host "Testing collections endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/collections" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Collections: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Collections failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
Write-Host "API Process ID: $($apiProcess.Id)" -ForegroundColor Yellow

# Stop API
Write-Host "Stopping API..." -ForegroundColor Yellow
Stop-Process -Id $apiProcess.Id -Force
