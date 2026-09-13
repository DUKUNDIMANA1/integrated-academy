# Integrated Academy - Setup Script (PowerShell)
Write-Host "=== Integrated Academy Setup ===" -ForegroundColor Cyan

# Install backend
Write-Host "`n[1/4] Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "Backend install failed" -ForegroundColor Red; exit 1 }

# Generate Prisma client
Write-Host "`n[2/4] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host "Prisma generate failed" -ForegroundColor Red; exit 1 }

# Run migrations
Write-Host "`n[3/4] Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) { Write-Host "Migration failed - ensure PostgreSQL is running" -ForegroundColor Red; exit 1 }

# Seed database
Write-Host "`n[4/4] Seeding database with demo data..." -ForegroundColor Yellow
npx ts-node prisma/seed.ts

Set-Location ..

# Install frontend
Write-Host "`n[5/5] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "To start the backend:  cd backend; npm run dev" -ForegroundColor Cyan
Write-Host "To start the frontend: cd frontend; npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:5000"
Write-Host "Frontend: http://localhost:3000"
Write-Host ""
Write-Host "Demo logins:" -ForegroundColor Yellow
Write-Host "  Admin   : admin@academy.rw    / Admin@1234"
Write-Host "  Finance : finance@academy.rw  / Finance@1234"
Write-Host "  Student : student@academy.rw  / Student@1234"
