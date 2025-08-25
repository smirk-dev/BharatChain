@echo off
cls
echo ========================================
echo 🇮🇳 BharatChain Launcher 🇮🇳
echo Starting all services...
echo ========================================
echo.

REM Kill existing processes
echo Stopping existing services...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
timeout /t 2 >nul

REM Start AI Service
echo Starting AI Service...
cd /d "%~dp0\ai-service"
if exist "enhanced_app.py" (
    start "AI Service" cmd /k "echo AI Service Starting... && python enhanced_app.py"
) else (
    echo Warning: AI service file not found
)
cd /d "%~dp0"
timeout /t 3 >nul

REM Start Backend
echo Starting Backend...
cd /d "%~dp0\server"
if exist "server.js" (
    start "Backend" cmd /k "echo Backend Starting... && npm start"
) else (
    echo Warning: Backend file not found
)
cd /d "%~dp0"
timeout /t 3 >nul

REM Start Frontend
echo Starting Frontend...
cd /d "%~dp0\client"
if exist "package.json" (
    start "Frontend" cmd /k "echo Frontend Starting... && npm start"
) else (
    echo Warning: Frontend package.json not found
)
cd /d "%~dp0"

echo.
echo ========================================
echo All services are starting up!
echo.
echo Services will open in separate windows.
echo Please wait a moment for them to load...
echo.
echo Frontend will be available at:
echo http://localhost:3000
echo.
echo Backend API will be available at:
echo http://localhost:3001
echo.
echo AI Service will be available at:
echo http://localhost:5001
echo ========================================
echo.

REM Wait a bit then try to open browser
timeout /t 10 >nul
echo Opening browser...
start http://localhost:3000

echo.
echo Press any key to exit this launcher...
echo (Services will continue running in separate windows)
pause >nul
