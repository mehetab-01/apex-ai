@echo off
title APEX Learning - Development Server

echo.
echo ========================================
echo    APEX LEARNING - Starting Servers
echo ========================================
echo.

:: Start Backend in a new window
echo Starting Django Backend...
start "APEX Backend" cmd /k "cd /d %~dp0apex_backend && python manage.py runserver"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

:: Start Frontend in a new window
echo Starting Next.js Frontend...
start "APEX Frontend" cmd /k "cd /d %~dp0apex_frontend && npm run dev"

echo.
echo ========================================
echo    Servers Starting...
echo ========================================
echo.
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:3000
echo.
echo    Close this window to stop all servers
echo ========================================
echo.

pause
