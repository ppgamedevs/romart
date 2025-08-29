# Simple Development Startup Script
# This script starts the essential services for development

Write-Host "🚀 Starting Artfromromania Development..." -ForegroundColor Green

# Kill any existing Node.js processes
Write-Host "🔄 Stopping existing processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear build caches
Write-Host "🧹 Clearing build caches..." -ForegroundColor Yellow
if (Test-Path "apps/web/.next") { Remove-Item -Recurse -Force "apps/web/.next" }
if (Test-Path "node_modules/.cache") { Remove-Item -Recurse -Force "node_modules/.cache" }

# Start API Server in background
Write-Host "🔧 Starting API Server..." -ForegroundColor Cyan
Start-Process -FilePath "pnpm" -ArgumentList "run", "dev", "--filter=@artfromromania/api" -WindowStyle Minimized

# Wait a moment for API to start
Start-Sleep -Seconds 5

# Start Web Application in background
Write-Host "🌐 Starting Web Application..." -ForegroundColor Cyan
Start-Process -FilePath "pnpm" -ArgumentList "run", "dev", "--filter=@artfromromania/web" -WindowStyle Minimized

Write-Host "`n🎉 Development services started!" -ForegroundColor Green
Write-Host "📱 Web App: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 API: http://localhost:3001" -ForegroundColor Cyan

Write-Host "`n💡 Services are running in background windows" -ForegroundColor Yellow
Write-Host "💡 Close those windows to stop the services" -ForegroundColor Yellow
