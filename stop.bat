@echo off
title APEX Learning - Stop Servers

echo.
echo ========================================
echo    APEX LEARNING - Stopping Servers
echo ========================================
echo.

:: Kill Python processes (Django backend)
echo Stopping Django Backend...
taskkill /F /IM python.exe 2>nul
if %errorlevel%==0 (
    echo    Backend stopped.
) else (
    echo    No backend process found.
)

:: Kill Node processes (Next.js frontend)
echo Stopping Next.js Frontend...
taskkill /F /IM node.exe 2>nul
if %errorlevel%==0 (
    echo    Frontend stopped.
) else (
    echo    No frontend process found.
)

echo.
echo ========================================
echo    All servers stopped.
echo ========================================
echo.

timeout /t 3
