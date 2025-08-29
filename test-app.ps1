# Test Application in Incognito Mode
Write-Host "Testing Art from Romania Application..." -ForegroundColor Green

# Check if the application is running
$port = 3000
$url = "http://localhost:$port/en"

try {
    $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "Application is running on $url" -ForegroundColor Green
        
        # Test API
        $apiResponse = Invoke-WebRequest -Uri "http://localhost:$port/api/home-feed" -Method Get -TimeoutSec 5
        if ($apiResponse.StatusCode -eq 200) {
            Write-Host "API is working correctly" -ForegroundColor Green
        } else {
            Write-Host "API returned status: $($apiResponse.StatusCode)" -ForegroundColor Red
        }
        
        Write-Host "Opening application in Chrome Incognito mode..." -ForegroundColor Cyan
        Write-Host "(This disables browser extensions that cause hydration errors)" -ForegroundColor Yellow
        
        # Open in Chrome incognito mode
        Start-Process "chrome.exe" -ArgumentList "--incognito", $url
        
        Write-Host "Test URLs:" -ForegroundColor Yellow
        Write-Host "   Home Page: $url" -ForegroundColor Cyan
        Write-Host "   API: http://localhost:$port/api/home-feed" -ForegroundColor Cyan
        Write-Host "   Discover: http://localhost:$port/en/discover" -ForegroundColor Cyan
        
        Write-Host "If you still see hydration errors:" -ForegroundColor Yellow
        Write-Host "   1. Disable browser extensions in chrome://extensions/" -ForegroundColor White
        Write-Host "   2. Try a different browser (Edge, Firefox)" -ForegroundColor White
        Write-Host "   3. Clear browser cache and cookies" -ForegroundColor White
        
    } else {
        Write-Host "Application returned status code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "Application is not running on port $port" -ForegroundColor Red
    Write-Host "Start the application with: pnpm run dev --filter=@artfromromania/web" -ForegroundColor Yellow
}
