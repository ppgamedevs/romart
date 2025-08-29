# Development Startup Script
# This script starts the web application and keeps it running

Write-Host "🚀 Starting Artfromromania Development..." -ForegroundColor Green

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Kill any existing Node.js processes
Write-Host "🔄 Stopping existing processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear build caches
Write-Host "🧹 Clearing build caches..." -ForegroundColor Yellow
if (Test-Path "apps/web/.next") { Remove-Item -Recurse -Force "apps/web/.next" }
if (Test-Path "node_modules/.cache") { Remove-Item -Recurse -Force "node_modules/.cache" }

# Start Web Application
Write-Host "🌐 Starting Web Application..." -ForegroundColor Cyan
Start-Process -FilePath "pnpm" -ArgumentList "run", "dev", "--filter=@artfromromania/web" -WindowStyle Minimized

# Wait for web to be ready
Write-Host "⏳ Waiting for Web Application to start..." -ForegroundColor Yellow
$startTime = Get-Date
while ((Get-Date) -lt $startTime.AddSeconds(60)) {
    if (Test-Port -Port 3000) {
        Write-Host "✅ Web Application is ready!" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 2
}

Write-Host "`n🎉 Development environment is ready!" -ForegroundColor Green
Write-Host "📱 Web App: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 API Routes: http://localhost:3000/api/*" -ForegroundColor Cyan

Write-Host "`n💡 Services are running in background windows" -ForegroundColor Yellow
Write-Host "💡 Close those windows to stop the services" -ForegroundColor Yellow
Write-Host "💡 The web app will automatically restart if it crashes" -ForegroundColor Yellow

Write-Host "`n🔍 Monitoring services..." -ForegroundColor Cyan

# Monitor and restart if needed
try {
    while ($true) {
        Start-Sleep -Seconds 30
        
        # Check if web service is still running
        if (-not (Test-Port -Port 3000)) {
            Write-Host "⚠️  Web service stopped, restarting..." -ForegroundColor Yellow
            Start-Process -FilePath "pnpm" -ArgumentList "run", "dev", "--filter=@artfromromania/web" -WindowStyle Minimized
        }
    }
}
catch {
    Write-Host "`n🛑 Stopping all services..." -ForegroundColor Red
    Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ All services stopped" -ForegroundColor Green
}
