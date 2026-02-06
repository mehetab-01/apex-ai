<# 
    APEX AI E-Learning Platform - Development Server
    ================================================
    Starts both Django backend and Next.js frontend.
    Press Ctrl+C to stop BOTH servers gracefully.
#>

$Host.UI.RawUI.WindowTitle = "APEX Learning Platform"

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "     APEX AI E-LEARNING PLATFORM"          -ForegroundColor Cyan
Write-Host "     Starting Development Servers..."       -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Activate virtualenv if present
$venvActivate = Join-Path $root ".venv\Scripts\Activate.ps1"
if (Test-Path $venvActivate) {
    & $venvActivate
}

# --- Start Django Backend ---
Write-Host "  [1/2] Starting Django Backend..." -ForegroundColor Yellow
$backend = Start-Process -NoNewWindow -PassThru -FilePath "python" `
    -ArgumentList "manage.py runserver 0.0.0.0:8000" `
    -WorkingDirectory (Join-Path $root "apex_backend")

Start-Sleep -Seconds 3
Write-Host "        Backend ready  ->  http://localhost:8000" -ForegroundColor Green

# --- Start Next.js Frontend ---
Write-Host "  [2/2] Starting Next.js Frontend..." -ForegroundColor Yellow
$frontend = Start-Process -NoNewWindow -PassThru -FilePath "npm" `
    -ArgumentList "run dev" `
    -WorkingDirectory (Join-Path $root "apex_frontend")

Start-Sleep -Seconds 3
Write-Host "        Frontend ready ->  http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Green
Write-Host "     Both servers are running!" -ForegroundColor Green
Write-Host ""
Write-Host "     Backend:  " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Cyan
Write-Host "     Frontend: " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "     Press Ctrl+C to stop both servers." -ForegroundColor Gray
Write-Host "  ========================================" -ForegroundColor Green
Write-Host ""

# --- Cleanup function ---
function Stop-Servers {
    Write-Host ""
    Write-Host "  Shutting down servers..." -ForegroundColor Yellow

    # Kill backend
    if ($backend -and !$backend.HasExited) {
        Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
        # Also kill any child python processes
        Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
            $_.StartInfo.WorkingDirectory -like "*apex_backend*"
        } | Stop-Process -Force -ErrorAction SilentlyContinue
    }

    # Kill frontend
    if ($frontend -and !$frontend.HasExited) {
        Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
        # Kill the node tree spawned by npm
        Get-CimInstance Win32_Process | Where-Object {
            $_.ParentProcessId -eq $frontend.Id
        } | ForEach-Object {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        }
    }

    Write-Host "  Both servers stopped." -ForegroundColor Green
    Write-Host ""
}

# Register cleanup on Ctrl+C and on exit
Register-EngineEvent PowerShell.Exiting -Action { Stop-Servers } | Out-Null

try {
    # Keep script alive until Ctrl+C
    while ($true) {
        # Check if either process died unexpectedly
        if ($backend.HasExited) {
            Write-Host "  [!] Backend crashed. Exit code: $($backend.ExitCode)" -ForegroundColor Red
            break
        }
        if ($frontend.HasExited) {
            Write-Host "  [!] Frontend crashed. Exit code: $($frontend.ExitCode)" -ForegroundColor Red
            break
        }
        Start-Sleep -Seconds 2
    }
} finally {
    Stop-Servers
}
