@echo off
setlocal enabledelayedexpansion
title BharatChain Platform Launcher

cls
color 0B
echo.
echo  ============================================
echo  ^|  BharatChain Digital Identity Platform  ^|
echo  ^|          One-Click Startup System       ^|  
echo  ============================================
echo.

REM Set project root
set "PROJECT_ROOT=%~dp0"
set "PYTHON_PATH=python"
set "ERROR_COUNT=0"

echo [1/7] Checking system requirements...

REM Check Node.js
echo    Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    ERROR: Node.js not found
    set /a ERROR_COUNT+=1
) else (
    echo    OK: Node.js found
)

REM Check Python
echo    Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    ERROR: Python not found
    set /a ERROR_COUNT+=1
) else (
    echo    OK: Python found
)

if %ERROR_COUNT% gtr 0 (
    echo.
    echo ERROR: %ERROR_COUNT% dependencies missing
    echo Please install missing dependencies first
    pause
    exit /b 1
)

echo [2/7] Cleaning up existing services...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
timeout /t 2 >nul

echo [3/7] Installing dependencies (if needed)...
REM Server dependencies
if not exist "%PROJECT_ROOT%server\node_modules" (
    echo    Installing backend dependencies...
    cd /d "%PROJECT_ROOT%server"
    call npm install --silent
    if %errorlevel% neq 0 (
        echo    ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
)

REM Client dependencies  
if not exist "%PROJECT_ROOT%client\node_modules" (
    echo    Installing frontend dependencies...
    cd /d "%PROJECT_ROOT%client"
    call npm install --silent
    if %errorlevel% neq 0 (
        echo    ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

REM Python dependencies
echo    Installing AI service dependencies...
cd /d "%PROJECT_ROOT%ai-service"
if exist requirements.txt (
    "%PYTHON_PATH%" -m pip install -r requirements.txt --quiet --no-warn-script-location >nul 2>&1
)

echo [4/7] Starting blockchain network...
cd /d "%PROJECT_ROOT%"
start "Blockchain Network" /MIN cmd /k "echo Starting Hardhat Blockchain... && npx hardhat --config blockchain\hardhat.config.js node"
timeout /t 8 >nul

echo [5/7] Starting AI service...
cd /d "%PROJECT_ROOT%ai-service"
if exist "simple_ai_service.py" (
    start "AI Service" cmd /k "echo Starting AI Service... && "%PYTHON_PATH%" simple_ai_service.py"
) else if exist "app.py" (
    start "AI Service" cmd /k "echo Starting AI Service... && "%PYTHON_PATH%" app.py"
)
timeout /t 3 >nul

echo [6/7] Starting backend API...
cd /d "%PROJECT_ROOT%server"
if exist "server.js" (
    start "Backend API" cmd /k "echo Starting Backend API... && node server.js"
)
timeout /t 5 >nul

echo [7/7] Starting frontend...
cd /d "%PROJECT_ROOT%client"
if exist "package.json" (
    start "Frontend" cmd /k "echo Starting React Frontend... && npm start"
)

echo.
echo All services starting...
echo Waiting for frontend to be ready...
timeout /t 15 >nul

echo Opening browser...
start http://localhost:3000

echo.
echo ============================================
echo ^| BharatChain Platform is now running! ^|
echo ^|                                        ^|
echo ^| Frontend:  http://localhost:3000      ^|
echo ^| Backend:   http://localhost:3001      ^|
echo ^| AI Service: http://localhost:5001     ^|
echo ^| Blockchain: http://localhost:8545     ^|
echo ============================================
echo.
echo Press any key to open browser again, or Ctrl+C to exit
pause >nul
start http://localhost:3000
