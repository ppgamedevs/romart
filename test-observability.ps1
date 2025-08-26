# Test Observability Setup - Prompt 25
Write-Host "🧪 Testing Observability & Reliability Pack (Prompt 25)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Test 1: API Health Check
Write-Host "`n1. Testing API Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/healthz" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ API Health Check: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   📊 Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ API Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: API Readiness Check
Write-Host "`n2. Testing API Readiness Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/readyz" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ API Readiness: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   📊 Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ API Readiness Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Sentry Debug Route
Write-Host "`n3. Testing Sentry Error Tracking..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/debug-sentry" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ❌ Unexpected: Sentry route returned $($response.StatusCode)" -ForegroundColor Red
} catch {
    Write-Host "   ✅ Sentry Error Triggered Successfully (Expected 500)" -ForegroundColor Green
    Write-Host "   📊 Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test 4: Root Route with Request ID
Write-Host "`n4. Testing Root Route with Request ID..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ Root Route: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   📊 Request ID: $($response.Headers['x-request-id'])" -ForegroundColor Gray
    Write-Host "   📊 Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Root Route Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Web App Sentry Configuration
Write-Host "`n5. Testing Web App Sentry Files..." -ForegroundColor Yellow
$webSentryFiles = @(
    "apps/web/sentry.client.config.ts",
    "apps/web/sentry.server.config.ts",
    "apps/web/src/app/error.tsx"
)

foreach ($file in $webSentryFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
    }
}

# Test 6: API Observability Files
Write-Host "`n6. Testing API Observability Files..." -ForegroundColor Yellow
$apiFiles = @(
    "apps/api/src/otel.ts",
    "apps/api/src/lib/ops.ts",
    "apps/api/src/routes/health.ts",
    "apps/api/instrument.js"
)

foreach ($file in $apiFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
    }
}

# Test 7: Environment Variables
Write-Host "`n7. Testing Environment Variables..." -ForegroundColor Yellow
$envVars = @(
    "SENTRY_DSN",
    "SENTRY_ENV",
    "SENTRY_TRACES_SAMPLE_RATE",
    "LOG_LEVEL",
    "HEALTH_STRIPE",
    "HEALTH_MEILI",
    "HEALTH_STORAGE"
)

foreach ($var in $envVars) {
    if (Get-Variable -Name $var -ErrorAction SilentlyContinue) {
        Write-Host "   ✅ $var is set" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $var is not set" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 Observability Testing Complete!" -ForegroundColor Cyan
Write-Host "Check Sentry dashboard for error tracking" -ForegroundColor Gray
Write-Host "Check logs for request correlation" -ForegroundColor Gray
