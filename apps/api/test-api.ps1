# Test API endpoints
Write-Host "Starting API test..."

# Start API in background
Start-Process -FilePath "npx" -ArgumentList "tsx", "src/index.ts" -WorkingDirectory "C:\Users\eugen\romart\apps\api" -WindowStyle Hidden

# Wait for API to start
Write-Host "Waiting for API to start..."
Start-Sleep 5

# Test health endpoint
Write-Host "Testing health endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/healthz" -UseBasicParsing
    Write-Host "Health endpoint: $($response.StatusCode) - $($response.Content)"
} catch {
    Write-Host "Health endpoint failed: $($_.Exception.Message)"
}

# Test stats endpoint
Write-Host "Testing stats endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/stats/view" -Method POST -ContentType "application/json" -Body '{"artworkId":"test"}' -UseBasicParsing
    Write-Host "Stats endpoint: $($response.StatusCode) - $($response.Content)"
} catch {
    Write-Host "Stats endpoint failed: $($_.Exception.Message)"
}

# Test collections endpoint
Write-Host "Testing collections endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/collections" -UseBasicParsing
    Write-Host "Collections endpoint: $($response.StatusCode) - $($response.Content)"
} catch {
    Write-Host "Collections endpoint failed: $($_.Exception.Message)"
}

# Test inquiries endpoint
Write-Host "Testing inquiries endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/inquiries" -UseBasicParsing
    Write-Host "Inquiries endpoint: $($response.StatusCode) - $($response.Content)"
} catch {
    Write-Host "Inquiries endpoint failed: $($_.Exception.Message)"
}

Write-Host "API test completed!"
