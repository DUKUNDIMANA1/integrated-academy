# Integrated Academy - Dev Startup Script
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Integrated Academy - Development Server" -ForegroundColor Cyan  
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting backend on http://localhost:5000" -ForegroundColor Green
Write-Host "Starting frontend on http://localhost:3000" -ForegroundColor Green
Write-Host ""

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start frontend  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal

Write-Host "Both servers are starting in separate windows." -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend:  http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo logins:" -ForegroundColor Yellow
Write-Host "  Admin:   admin@academy.rw / Admin@1234"
Write-Host "  Finance: finance@academy.rw / Finance@1234"
Write-Host "  Student: student@academy.rw / Student@1234"
