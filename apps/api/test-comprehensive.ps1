# Comprehensive API Test
Write-Host "=== Artfromromania API Comprehensive Test ===" -ForegroundColor Green

# Kill any existing processes on port 3001
Write-Host "Cleaning up port 3001..." -ForegroundColor Yellow
$processes = netstat -ano | findstr :3001
if ($processes) {
    $processes | ForEach-Object {
        $processId = ($_ -split '\s+')[-1]
        taskkill /F /PID $processId 2>$null
    }
}

# Start API
Write-Host "Starting API..." -ForegroundColor Yellow
$apiProcess = Start-Process -FilePath "npx" -ArgumentList "tsx", "src/index.ts" -WorkingDirectory "C:\Users\eugen\romart\apps\api" -WindowStyle Hidden -PassThru

# Wait for API to start
Write-Host "Waiting for API to start..." -ForegroundColor Yellow
Start-Sleep 8

# Test 1: Health endpoint
Write-Host "`n1. Testing health endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/healthz" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Health endpoint: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Stats endpoint (POST)
Write-Host "`n2. Testing stats endpoint..." -ForegroundColor Cyan
try {
    $body = @{artworkId = "test-artwork-123"} | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/stats/view" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Stats endpoint: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Stats endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Collections endpoint (GET)
Write-Host "`n3. Testing collections endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/collections" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Collections endpoint: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Collections endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Inquiries endpoint (GET)
Write-Host "`n4. Testing inquiries endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/inquiries" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Inquiries endpoint: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Inquiries endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Favorites endpoint (POST)
Write-Host "`n5. Testing favorites endpoint..." -ForegroundColor Cyan
try {
    $body = @{artworkId = "test-artwork-123"} | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/favorites" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Favorites endpoint: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Favorites endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Social proof endpoint
Write-Host "`n6. Testing social proof endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/artworks/test-artwork-123/social-proof" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Social proof endpoint: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Social proof endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Summary ===" -ForegroundColor Green
Write-Host "API Process ID: $($apiProcess.Id)" -ForegroundColor Yellow
Write-Host "All tests completed!" -ForegroundColor Green

# Keep API running for manual testing
Write-Host "`nAPI is still running. Press Ctrl+C to stop." -ForegroundColor Yellow
try {
    while ($true) {
        Start-Sleep 1
        if ($apiProcess.HasExited) {
            Write-Host "API process has stopped." -ForegroundColor Red
            break
        }
    }
} catch {
    Write-Host "Stopping API..." -ForegroundColor Yellow
    Stop-Process -Id $apiProcess.Id -Force
}
