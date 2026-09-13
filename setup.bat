@echo off
echo === Integrated Academy Setup ===

echo.
echo [1/5] Installing backend...
cd backend
call npm install
if errorlevel 1 goto error

echo.
echo [2/5] Generating Prisma client...
call npx prisma generate
if errorlevel 1 goto error

echo.
echo [3/5] Running migrations (ensure PostgreSQL is running)...
call npx prisma migrate dev --name init
if errorlevel 1 goto error

echo.
echo [4/5] Seeding database...
call npx ts-node prisma/seed.ts

cd ..

echo.
echo [5/5] Installing frontend...
cd frontend
call npm install
cd ..

echo.
echo === Setup Complete! ===
echo.
echo Start backend:  cd backend ^& npm run dev
echo Start frontend: cd frontend ^& npm run dev
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Demo logins:
echo   Admin   : admin@academy.rw    / Admin@1234
echo   Finance : finance@academy.rw  / Finance@1234
echo   Student : student@academy.rw  / Student@1234
goto end

:error
echo Setup failed. Check the error above.
exit /b 1

:end
