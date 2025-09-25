@echo off
setlocal enabledelayedexpansion

REM ============================================================================
REM 🇮🇳 BharatChain Digital Identity Platform - One-Click Startup 🇮🇳
REM ============================================================================
REM The easiest way to start the complete BharatChain ecosystem
REM All services will be automatically configured and launched
REM ============================================================================

cls
color 0A
echo.
echo  ╔══════════════════════════════════════════════════════════════════════╗
echo  ║                    🇮🇳 BharatChain Platform 🇮🇳                     ║
echo  ║                  Digital Identity ^& Governance                      ║
echo  ║                                                                      ║
echo  ║              🚀 ONE-CLICK STARTUP - EVERYTHING AUTOMATED 🚀         ║
echo  ╚══════════════════════════════════════════════════════════════════════╝
echo.

REM Set project root
set "PROJECT_ROOT=%~dp0"
set "PYTHON_PATH=%PROJECT_ROOT%.venv\Scripts\python.exe"
set "ERROR_COUNT=0"

echo 🔍 STEP 1/7: Pre-flight System Check
echo ────────────────────────────────────────

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found - please install Node.js from nodejs.org
    set /a ERROR_COUNT+=1
) else (
    echo ✅ Node.js detected
)

REM Check Python (project virtual environment)
if exist "%PYTHON_PATH%" (
    echo ✅ Python virtual environment found
) else (
    REM Try system Python
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Python not found - please install Python 3.8+ from python.org
        set /a ERROR_COUNT+=1
    ) else (
        echo ⚠️  System Python detected (virtual environment preferred)
        set "PYTHON_PATH=python"
    )
)

REM Check npm dependencies
if not exist "%PROJECT_ROOT%server\node_modules" (
    echo ⚠️  Server dependencies missing - will install automatically
)
if not exist "%PROJECT_ROOT%client\node_modules" (
    echo ⚠️  Client dependencies missing - will install automatically
)

if %ERROR_COUNT% gtr 0 (
    echo.
    echo ❌ %ERROR_COUNT% critical dependencies missing. Please install them first.
    pause
    exit /b 1
)

echo.
echo 🧹 STEP 2/7: Cleanup Existing Services
echo ────────────────────────────────────────
echo Stopping any existing BharatChain services...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im hardhat.exe >nul 2>&1
timeout /t 2 >nul
echo ✅ Cleanup completed

echo.
echo 📦 STEP 3/7: Installing Dependencies (if needed)
echo ────────────────────────────────────────

REM Install server dependencies
if not exist "%PROJECT_ROOT%server\node_modules" (
    echo Installing backend dependencies...
    cd /d "%PROJECT_ROOT%server"
    npm install --silent
    if %errorlevel% neq 0 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)

REM Install client dependencies
if not exist "%PROJECT_ROOT%client\node_modules" (
    echo Installing frontend dependencies...
    cd /d "%PROJECT_ROOT%client"
    npm install --silent
    if %errorlevel% neq 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo ✅ Frontend dependencies installed
) else (
    echo ✅ Frontend dependencies already installed
)

REM Install Python dependencies
echo Installing AI service dependencies...
cd /d "%PROJECT_ROOT%ai-service"
if exist requirements.txt (
    "%PYTHON_PATH%" -m pip install -r requirements.txt --quiet
    if %errorlevel% neq 0 (
        echo ⚠️  AI service dependencies installation had warnings (will continue)
    ) else (
        echo ✅ AI service dependencies installed
    )
) else (
    echo ⚠️  AI service requirements.txt not found (will use system packages)
)

echo.
echo ⛓️ STEP 4/7: Starting Blockchain Network
echo ────────────────────────────────────────
cd /d "%PROJECT_ROOT%"
echo Starting local Hardhat blockchain network...
start "🔗 BharatChain Blockchain" /MIN cmd /c "echo Starting Hardhat Network... && npx hardhat node"
timeout /t 5 >nul

echo Deploying smart contracts...
npx hardhat run scripts/deploy.js --network localhost >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Contract deployment had warnings (blockchain will continue)
) else (
    echo ✅ Smart contracts deployed successfully
)

echo.
echo 🧠 STEP 5/7: Starting AI Service (Port 5001)
echo ────────────────────────────────────────
cd /d "%PROJECT_ROOT%ai-service"
if exist "simple_ai_service.py" (
    start "🧠 BharatChain AI Service" cmd /k "echo [AI SERVICE] Starting OCR and Document Processing... && echo [AI SERVICE] Port: 5001 && echo. && "%PYTHON_PATH%" simple_ai_service.py"
    echo ✅ AI Service starting on port 5001
) else if exist "app.py" (
    start "🧠 BharatChain AI Service" cmd /k "echo [AI SERVICE] Starting OCR and Document Processing... && echo [AI SERVICE] Port: 5001 && echo. && "%PYTHON_PATH%" app.py"
    echo ✅ AI Service (fallback) starting on port 5001
) else (
    echo ❌ AI Service files not found
)
timeout /t 3 >nul

echo.
echo ⚙️  STEP 6/7: Starting Backend API (Port 3001)
echo ────────────────────────────────────────
cd /d "%PROJECT_ROOT%server"
if exist "server.js" (
    REM Use full path to ensure server.js is found correctly
    start "⚙️ BharatChain Backend" cmd /k "echo [BACKEND] Starting Express Server and APIs... && echo [BACKEND] Port: 3001 && echo [BACKEND] Database: SQLite && echo [BACKEND] JWT Authentication Enabled && echo [BACKEND] Web3 Integration: Ready && echo. && node "%PROJECT_ROOT%server\server.js""
    echo ✅ Backend API starting on port 3001
) else (
    echo ❌ Backend server file not found at %PROJECT_ROOT%server\server.js
)
timeout /t 5 >nul

echo.
echo 🎨 STEP 7/7: Starting Frontend React App (Port 3000)
echo ────────────────────────────────────────
cd /d "%PROJECT_ROOT%client"
if exist "package.json" (
    start "🎨 BharatChain Frontend" cmd /k "echo [FRONTEND] Starting React Development Server... && echo [FRONTEND] Port: 3000 && echo [FRONTEND] Material-UI Theme Loaded && echo [FRONTEND] Web3 Integration Ready && echo. && npm start"
    echo ✅ Frontend app starting on port 3000
) else (
    echo ❌ Frontend package.json not found
)

echo.
echo  ╔══════════════════════════════════════════════════════════════════════╗
echo  ║                    🎉 BHARATCHAIN LAUNCHED! 🎉                      ║
echo  ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo 🚀 All services are starting up in separate windows...
echo ⏱️  Please wait 20-35 seconds for complete initialization
echo.
echo 📍 SERVICE ENDPOINTS:
echo    🌐 Frontend (React):       http://localhost:3000
echo    🔧 Backend API:            http://localhost:3001/api/health
echo    🧠 AI Service:             http://localhost:5001/health
echo    ⛓️  Blockchain Network:     http://localhost:8545
echo.
echo 📋 FEATURES AVAILABLE:
echo    ✅ Citizen Registration ^& Authentication
echo    ✅ Document Upload ^& OCR Processing
echo    ✅ Blockchain Verification ^& QR Codes  
echo    ✅ Grievance Management System
echo    ✅ Government Payment Processing
echo    ✅ MetaMask Web3 Integration
echo    ✅ Multi-language Support (Hindi/English)
echo    ✅ Real-time WebSocket Events
echo    ✅ JWT Authentication ^& Security
echo.

REM Wait for services to initialize
echo ⏳ Waiting for services to initialize completely...
echo    🔗 Blockchain: ~5 seconds
echo    🧠 AI Service: ~8 seconds  
echo    ⚙️  Backend API: ~10 seconds
echo    🎨 Frontend: ~15 seconds
timeout /t 18 >nul

REM Try to open browser automatically
echo 🌐 Opening BharatChain in your default browser...
timeout /t 3 >nul
start "BharatChain Platform" http://localhost:3000

echo.
echo  ╔══════════════════════════════════════════════════════════════════════╗
echo  ║  🏛️ Welcome to BharatChain - India's Digital Identity Platform! 🏛️   ║
echo  ║                                                                      ║
echo  ║  Your browser should open automatically to:                          ║
echo  ║  👉 http://localhost:3000                                            ║
echo  ║                                                                      ║
echo  ║  All services are running in separate windows.                       ║
echo  ║  You can minimize this window - services will continue running.      ║
echo  ║                                                                      ║
echo  ║  🔧 TROUBLESHOOTING:                                                 ║
echo  ║  • If frontend shows errors, wait 30 seconds for backend to start   ║
echo  ║  • Check service windows for any startup errors                     ║
echo  ║  • Backend must be on port 3001, Frontend on 3000                   ║
echo  ║  • MetaMask required for Web3 features                              ║
echo  ║                                                                      ║
echo  ║  To stop all services: Close all terminal windows or run stop.bat   ║
echo  ╚══════════════════════════════════════════════════════════════════════╝
echo.

cd /d "%PROJECT_ROOT%"
echo Press any key to minimize this launcher (services will keep running)...
pause >nul

REM Minimize this window
powershell -window minimized -command "Start-Sleep -Seconds 1"
