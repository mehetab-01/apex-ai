@echo off
REM APEX AI E-Learning Platform - Development Server
REM =================================================
REM Starts both Django backend and Next.js frontend.
REM Press Ctrl+C to stop BOTH servers gracefully.
REM =================================================

title APEX AI E-Learning Platform

echo.
echo   ========================================
echo      APEX AI E-LEARNING PLATFORM
echo      Starting Development Servers...
echo   ========================================
echo.

REM Resolve the project root (where this script lives)
set "ROOT=%~dp0"

REM Activate virtualenv
if exist "%ROOT%.venv\Scripts\activate.bat" (
    call "%ROOT%.venv\Scripts\activate.bat"
)

REM Start Django backend in the background
echo   [1/2] Starting Django Backend...
start /b cmd /c "cd /d "%ROOT%apex_backend" && python manage.py runserver 0.0.0.0:8000"
timeout /t 3 /nobreak >nul
echo         Backend ready  -^>  http://localhost:8000

REM Start Next.js frontend in the background
echo   [2/2] Starting Next.js Frontend...
start /b cmd /c "cd /d "%ROOT%apex_frontend" && npm run dev"
timeout /t 3 /nobreak >nul
echo         Frontend ready -^>  http://localhost:3000

echo.
echo   ========================================
echo      Both servers are running!
echo.
echo      Backend:  http://localhost:8000
echo      Frontend: http://localhost:3000
echo.
echo      Press Ctrl+C to stop both servers.
echo   ========================================
echo.

REM Wait in a loop - when the user presses Ctrl+C, the "call" below will end
:loop
timeout /t 2 /nobreak >nul
goto loop

REM This label never runs during normal operation -
REM cleanup happens via the CMD window closing (which kills child processes).
REM But we add an explicit cleanup on any exit just in case.
:cleanup
echo.
echo   Shutting down servers...
taskkill /F /FI "WINDOWTITLE eq APEX*" >nul 2>&1
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq python.exe" /fo list ^| find "PID:"') do (
    wmic process where "ProcessId=%%a" get CommandLine 2>nul | find "manage.py" >nul && taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fo list ^| find "PID:"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo   Done.
