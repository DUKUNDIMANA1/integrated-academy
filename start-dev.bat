@echo off
echo ============================================
echo   Integrated Academy - Development Server
echo ============================================
echo.
echo Starting backend on http://localhost:5000
echo Starting frontend on http://localhost:3000
echo.
echo [INFO] Make sure PostgreSQL and Redis are running
echo [INFO] Run setup.bat first if this is your first time
echo.

:: Start backend in a new window
start "Academy Backend" cmd /k "cd /d %~dp0backend && npm run dev"

:: Wait a moment then start frontend
timeout /t 3 /nobreak >nul

:: Start frontend in a new window  
start "Academy Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers starting...
echo Backend:  http://localhost:5000/api/health
echo Frontend: http://localhost:3000
echo.
pause
