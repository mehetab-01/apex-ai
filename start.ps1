# APEX Learning - Development Server Startup Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   APEX LEARNING - Starting Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "Starting Django Backend..." -ForegroundColor Yellow
$backendPath = Join-Path $projectRoot "apex_backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; python manage.py runserver" -WindowStyle Normal

# Wait for backend to initialize
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Next.js Frontend..." -ForegroundColor Yellow
$frontendPath = Join-Path $projectRoot "apex_frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Servers Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "   Backend:  " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Cyan
Write-Host "   Frontend: " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Press any key to exit this window..." -ForegroundColor Gray
Write-Host "   (Servers will continue running)" -ForegroundColor Gray
Write-Host ""

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
