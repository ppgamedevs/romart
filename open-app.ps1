# Open Art from Romania Application
Write-Host "Opening Art from Romania..." -ForegroundColor Green

# Check if the application is running
$port = 3001
$url = "http://localhost:$port/en"

try {
    $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "Application is running on $url" -ForegroundColor Green
        Write-Host "Opening in browser..." -ForegroundColor Cyan
        
        # Open in default browser
        Start-Process $url
        
        Write-Host "`nApplication URLs:" -ForegroundColor Yellow
        Write-Host "   Home Page: $url" -ForegroundColor Cyan
        Write-Host "   Discover: http://localhost:$port/en/discover" -ForegroundColor Cyan
        Write-Host "   Collections: http://localhost:$port/en/collections" -ForegroundColor Cyan
        Write-Host "   API: http://localhost:$port/api/home-feed" -ForegroundColor Cyan
        
    } else {
        Write-Host "Application returned status code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "Application is not running on port $port" -ForegroundColor Red
    Write-Host "Start the application with: pnpm run dev --filter=@artfromromania/web" -ForegroundColor Yellow
}
