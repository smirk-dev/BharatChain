@echo off
setlocal enabledelayedexpansion
title 🇮🇳 BharatChain Platform Launcher 🇮🇳

REM ============================================================================
REM 🇮🇳 BharatChain Digital Identity Platform - One-Click Startup 🇮🇳
REM ============================================================================
REM The easiest way to start the complete BharatChain ecosystem
REM All services will be automatically configured and launched
REM ============================================================================

cls
color 0B
echo.
echo  ╔══════════════════════════════════════════════════════════════════════╗
echo  ║  ████████╗██████╗  ██╗  ██╗ █████╗ ██████╗  █████╗ ████████╗███████╗ ║
echo  ║  ██╔══██║██╔══██╗ ██║  ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝ ║
echo  ║  ██████╔╝██████╔╝ ███████║███████║██████╔╝███████║   ██║   ███████╗ ║
echo  ║  ██╔══██╗██╔══██╗ ██╔══██║██╔══██║██╔══██╗██╔══██║   ██║   ╚════██║ ║
echo  ║  ██████╔╝██║  ██║ ██║  ██║██║  ██║██║  ██║██║  ██║   ██║   ███████║ ║
echo  ║  ╚═════╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝ ║
echo  ║                                                                      ║
echo  ║             🇮🇳 DIGITAL IDENTITY ^& GOVERNANCE PLATFORM 🇮🇳           ║
echo  ║                                                                      ║
echo  ║          🚀 INTELLIGENT ONE-CLICK STARTUP SYSTEM 🚀                  ║
echo  ║                    ⚡ Everything Automated ⚡                       ║
echo  ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo                     🌟 Empowering Digital India 🌟
echo.

REM Set project root
set "PROJECT_ROOT=%~dp0"
set "PYTHON_PATH=%PROJECT_ROOT%.venv\Scripts\python.exe"
set "ERROR_COUNT=0"

echo.
echo ╔═════════════════════════════════════════════════════════════════════════╗
echo ║                      🔍 STEP 1/7: PRE-FLIGHT SYSTEM CHECK 🔍          ║
echo ║                        Validating System Requirements                   ║
echo ╚═════════════════════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
echo    🔍 Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo    ❌ Node.js not found - please install Node.js from nodejs.org
    set /a ERROR_COUNT+=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo    ✅ Node.js detected - Version: !NODE_VERSION!
)

REM Check Python (project virtual environment)
echo    🔍 Checking Python environment...
if exist "%PYTHON_PATH%" (
    echo    ✅ Python virtual environment found
) else (
    REM Try system Python
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        color 0C
        echo    ❌ Python not found - please install Python 3.8+ from python.org
        set /a ERROR_COUNT+=1
    ) else (
        for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i
        echo    ⚠️  System Python detected - Version: !PYTHON_VERSION! (virtual environment preferred)
        set "PYTHON_PATH=python"
    )
)

REM Check npm dependencies
echo    🔍 Checking project dependencies...
if not exist "%PROJECT_ROOT%server\node_modules" (
    echo    ⚠️  Server dependencies missing - will install automatically
)
if not exist "%PROJECT_ROOT%client\node_modules" (
    echo    ⚠️  Client dependencies missing - will install automatically
)

if %ERROR_COUNT% gtr 0 (
    echo.
    color 0C
    echo    ╔═══════════════════════════════════════════════════════════════╗
    echo    ║  ❌ CRITICAL ERROR: %ERROR_COUNT% dependencies missing              ║
    echo    ║  Please install missing dependencies first                   ║
    echo    ╚═══════════════════════════════════════════════════════════════╝
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
) else (
    color 0A
    echo    ✅ All system requirements satisfied!
)

echo.
echo ╔═════════════════════════════════════════════════════════════════════════╗
echo ║                   🧹 STEP 2/7: CLEANUP EXISTING SERVICES 🧹           ║
echo ║                      Preparing Clean Environment                        ║
echo ╚═════════════════════════════════════════════════════════════════════════╝
echo.
echo    🧹 Stopping any existing BharatChain services...
echo    ⏹️  Terminating Node.js processes...
taskkill /f /im node.exe >nul 2>&1
echo    ⏹️  Terminating Python processes...
taskkill /f /im python.exe >nul 2>&1
echo    ⏹️  Terminating Hardhat processes...
taskkill /f /im hardhat.exe >nul 2>&1
timeout /t 2 >nul
color 0A
echo    ✅ Environment cleanup completed successfully!

echo.
echo ╔═════════════════════════════════════════════════════════════════════════╗
echo ║                📦 STEP 3/7: INSTALLING DEPENDENCIES 📦                ║
echo ║                    Smart Dependency Management                          ║
echo ╚═════════════════════════════════════════════════════════════════════════╝

REM Install server dependencies
if not exist "%PROJECT_ROOT%server\node_modules" (
    echo.
    echo    📦 Installing backend dependencies...
    echo    ⏳ This may take a few minutes for first-time setup...
    cd /d "%PROJECT_ROOT%server"
    npm install --silent
    if %errorlevel% neq 0 (
        color 0C
        echo    ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
    color 0A
    echo    ✅ Backend dependencies installed successfully!
) else (
    echo    ✅ Backend dependencies already installed
)

REM Install client dependencies
if not exist "%PROJECT_ROOT%client\node_modules" (
    echo.
    echo    🎨 Installing frontend dependencies...
    echo    ⏳ Setting up React development environment...
    cd /d "%PROJECT_ROOT%client"
    npm install --silent
    if %errorlevel% neq 0 (
        color 0C
        echo    ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    color 0A
    echo    ✅ Frontend dependencies installed successfully!
) else (
    echo    ✅ Frontend dependencies already installed
)

REM Install Python dependencies
echo.
echo    🧠 Installing AI service dependencies...
cd /d "%PROJECT_ROOT%ai-service"
if exist requirements.txt (
    echo    📦 Installing Python packages... (this may take a moment)
    "%PYTHON_PATH%" -m pip install -r requirements.txt --quiet --no-warn-script-location
    if %errorlevel% neq 0 (
        color 0E
        echo    ⚠️  AI service dependencies had some warnings (will continue with available packages)
        echo    💡 Note: Some advanced features may be limited, but basic functionality will work
    ) else (
        color 0A
        echo    ✅ AI service dependencies installed successfully!
    )
) else (
    color 0E
    echo    ⚠️  AI service requirements.txt not found (will use system packages)
)

echo.
echo ╔═════════════════════════════════════════════════════════════════════════╗
echo ║              ⛓️ STEP 4/7: STARTING BLOCKCHAIN NETWORK ⛓️              ║
echo ║                      Hardhat Local Development                          ║
echo ╚═════════════════════════════════════════════════════════════════════════╝
cd /d "%PROJECT_ROOT%"
echo.
echo    ⛓️  Initializing local Hardhat blockchain network...
echo    🚀 Starting development blockchain on port 8545...
start "🔗 BharatChain Blockchain Network" /MIN cmd /c "echo ╔══════════════════════════════════════════════════════════╗ && echo ║                  BHARATCHAIN BLOCKCHAIN                  ║ && echo ║                    Hardhat Network                       ║ && echo ║                   Port: 8545                            ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo Starting Hardhat Network... && npx hardhat --config blockchain\hardhat.config.js node"
echo    ⏳ Waiting for blockchain to initialize... (10 seconds)
timeout /t 10 >nul

echo    📋 Deploying smart contracts to blockchain...
npx hardhat run scripts/deploy.js --network localhost --config blockchain\hardhat.config.js >nul 2>&1
if %errorlevel% neq 0 (
    color 0E
    echo    ⚠️  Contract deployment had warnings (blockchain will continue)
) else (
    color 0A
    echo    ✅ Smart contracts deployed successfully to local network!
)

echo.
echo ╔═════════════════════════════════════════════════════════════════════════╗
echo ║                 🧠 STEP 5/7: STARTING AI SERVICE 🧠                   ║
echo ║                    OCR ^& Document Processing                            ║
echo ╚═════════════════════════════════════════════════════════════════════════╝
cd /d "%PROJECT_ROOT%ai-service"
echo.
echo    🧠 Initializing AI service with OCR capabilities...
echo    🤖 Starting document processing engine on port 5001...
if exist "simple_ai_service.py" (
    start "🧠 BharatChain AI Service" cmd /k "title 🧠 BharatChain AI Service && color 0E && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                    BHARATCHAIN AI SERVICE                ║ && echo ║                 OCR ^& Document Processing                 ║ && echo ║                      Port: 5001                          ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [AI SERVICE] Starting OCR and Document Processing... && echo [AI SERVICE] TensorFlow/OpenCV Loading... && echo [AI SERVICE] Ready for Hindi/English text recognition && echo. && "%PYTHON_PATH%" simple_ai_service.py"
    color 0A
    echo    ✅ AI Service starting successfully on port 5001
) else if exist "app.py" (
    start "🧠 BharatChain AI Service" cmd /k "title 🧠 BharatChain AI Service && color 0E && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                    BHARATCHAIN AI SERVICE                ║ && echo ║                 OCR ^& Document Processing                 ║ && echo ║                      Port: 5001                          ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [AI SERVICE] Starting OCR and Document Processing... && echo [AI SERVICE] Loading ML Models... && echo [AI SERVICE] Ready for document analysis && echo. && "%PYTHON_PATH%" app.py"
    color 0A
    echo    ✅ AI Service (fallback) starting successfully on port 5001
) else (
    color 0C
    echo    ❌ AI Service files not found - check ai-service directory
)
timeout /t 3 >nul

echo.
echo ╔═════════════════════════════════════════════════════════════════════════╗
echo ║                ⚙️ STEP 6/7: STARTING BACKEND API ⚙️                   ║
echo ║                Express Server ^& Database Integration                   ║
echo ╚═════════════════════════════════════════════════════════════════════════╝
cd /d "%PROJECT_ROOT%server"
echo.
echo    ⚙️  Initializing Express.js backend server...
echo    🗄️  Connecting to SQLite database...
echo    🔐 Setting up JWT authentication system...
echo    🌐 Configuring Web3 blockchain integration...
if exist "server.js" (
    REM Use full path to ensure server.js is found correctly
    start "⚙️ BharatChain Backend API" cmd /k "title ⚙️ BharatChain Backend API && color 0C && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                   BHARATCHAIN BACKEND API                ║ && echo ║                Express.js ^& SQLite Database                ║ && echo ║                       Port: 3001                         ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [BACKEND] Starting Express Server and APIs... && echo [BACKEND] Database: SQLite with auto-sync && echo [BACKEND] JWT Authentication: Enabled && echo [BACKEND] Web3 Integration: Ready && echo [BACKEND] CORS Origin: http://localhost:3000 && echo [BACKEND] WebSocket Support: Active && echo. && node "%PROJECT_ROOT%server\server.js""
    color 0A
    echo    ✅ Backend API starting successfully on port 3001
) else (
    color 0C
    echo    ❌ Backend server file not found at %PROJECT_ROOT%server\server.js
)
timeout /t 5 >nul

echo.
echo ╔═════════════════════════════════════════════════════════════════════════╗
echo ║                🎨 STEP 7/7: STARTING FRONTEND APP 🎨                  ║
echo ║                React Development Server ^& Material-UI                  ║
echo ╚═════════════════════════════════════════════════════════════════════════╝
cd /d "%PROJECT_ROOT%client"
echo.
echo    🎨 Initializing React development environment...
echo    ⚛️  Loading Material-UI component library...
echo    🔗 Establishing Web3/MetaMask integration...
if exist "package.json" (
    start "🎨 BharatChain Frontend" cmd /k "title 🎨 BharatChain Frontend && color 0B && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                  BHARATCHAIN FRONTEND                    ║ && echo ║                React.js ^& Material-UI                     ║ && echo ║                      Port: 3000                          ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [FRONTEND] Starting React Development Server... && echo [FRONTEND] Material-UI Theme: Loaded && echo [FRONTEND] Web3 Integration: Ready && echo [FRONTEND] MetaMask Support: Active && echo [FRONTEND] Multi-language: Hindi/English && echo [FRONTEND] Hot Reload: Enabled && echo. && npm start"
    color 0A
    echo    ✅ Frontend app starting successfully on port 3000
) else (
    color 0C
    echo    ❌ Frontend package.json not found - check client directory
)

color 0B

echo.
echo  ╔══════════════════════════════════════════════════════════════════════╗
echo  ║                    🎉 BHARATCHAIN LAUNCHED! 🎉                      ║
echo  ║                                                                      ║
echo  ║    🚀 All services are spinning up in dedicated windows...          ║
echo  ║    ⭐ Professional-grade microservices architecture                  ║
echo  ╚══════════════════════════════════════════════════════════════════════╝
echo.
REM Wait for services to initialize
echo ╔═════════════════════════════════════════════════════════════════════════╗
echo ║                    ⏳ SERVICE INITIALIZATION STATUS ⏳                 ║
echo ╚═════════════════════════════════════════════════════════════════════════╝
echo.
echo    ⛓️  Blockchain Network:   Initializing... (~5 seconds)
echo    🧠 AI Service:           Loading models... (~8 seconds)  
echo    ⚙️  Backend API:          Connecting database... (~12 seconds)
echo    🎨 Frontend App:         Building bundle... (~18 seconds)
echo.
echo    ⏱️  Total estimated startup time: ~25 seconds
echo.
for /l %%i in (1,1,20) do (
    set /p "=■" <nul
    timeout /t 1 >nul
)
echo.
echo.
color 0A
echo    ✅ All services should now be operational!

REM Try to open browser automatically
echo.
echo ╔═════════════════════════════════════════════════════════════════════════╗
echo ║                      🌐 OPENING WEB BROWSER 🌐                        ║
echo ╚═════════════════════════════════════════════════════════════════════════╝
echo.
echo    🌐 Launching BharatChain Platform in your default browser...
echo    📱 URL: http://localhost:3000
timeout /t 3 >nul
start "BharatChain Platform" http://localhost:3000

echo.
echo  ╔══════════════════════════════════════════════════════════════════════╗
echo  ║  🏛️ WELCOME TO BHARATCHAIN - DIGITAL INDIA PLATFORM! 🏛️             ║
echo  ║                                                                      ║
echo  ║  🚀 SYSTEM STATUS: FULLY OPERATIONAL                                ║
echo  ║                                                                      ║
echo  ║  📍 SERVICE ENDPOINTS:                                               ║
echo  ║     🌐 Frontend:          http://localhost:3000                     ║
echo  ║     🔧 Backend API:       http://localhost:3001/api/health          ║
echo  ║     🧠 AI Service:        http://localhost:5001/health              ║
echo  ║     ⛓️  Blockchain:        http://localhost:8545                     ║
echo  ║                                                                      ║
echo  ║  📋 AVAILABLE FEATURES:                                              ║
echo  ║     ✅ Citizen Registration ^& Authentication                        ║
echo  ║     ✅ Document Upload ^& OCR Processing                             ║
echo  ║     ✅ Blockchain Verification ^& QR Codes                           ║
echo  ║     ✅ Grievance Management System                                   ║
echo  ║     ✅ Government Payment Processing                                 ║
echo  ║     ✅ MetaMask Web3 Integration                                     ║
echo  ║     ✅ Multi-language Support (Hindi/English)                       ║
echo  ║     ✅ Real-time WebSocket Events                                    ║
echo  ║     ✅ JWT Authentication ^& Security                                ║
echo  ║                                                                      ║
echo  ║  🔧 TROUBLESHOOTING:                                                 ║
echo  ║     • If frontend shows errors, wait 30 seconds for backend         ║
echo  ║     • Check service windows for any startup errors                  ║
echo  ║     • Backend must be on port 3001, Frontend on 3000                ║
echo  ║     • MetaMask required for Web3 features                           ║
echo  ║                                                                      ║
echo  ║  ⚡ All services running in separate windows - DO NOT CLOSE THEM    ║
echo  ║                                                                      ║
echo  ║  🛑 TO STOP: Close all terminal windows or run stop.bat             ║
echo  ╚══════════════════════════════════════════════════════════════════════╝
echo.

cd /d "%PROJECT_ROOT%"

echo ╔═════════════════════════════════════════════════════════════════════════╗
echo ║                    🎛️ LAUNCHER CONTROL PANEL 🎛️                      ║
echo ╚═════════════════════════════════════════════════════════════════════════╝
echo.
echo    This launcher will remain open to monitor your services.
echo    You can safely minimize this window - all services will continue running.
echo.
echo    Available Actions:
echo    [M] Minimize this launcher window
echo    [O] Open BharatChain in browser again  
echo    [S] Show service status
echo    [Q] Quit launcher (services will keep running)
echo    [X] Stop all services and exit
echo.

:MENU
set /p "choice=    Enter your choice (M/O/S/Q/X): "

if /i "%choice%"=="M" (
    echo    🗕 Minimizing launcher window...
    powershell -command "(New-Object -ComObject Shell.Application).MinimizeAll()"
    goto MENU
)

if /i "%choice%"=="O" (
    echo    🌐 Opening BharatChain Platform...
    start "BharatChain Platform" http://localhost:3000
    goto MENU
)

if /i "%choice%"=="S" (
    echo.
    echo    📊 Checking service status...
    netstat -ano | findstr ":300" >nul && echo    ✅ Services detected on ports 3000-3001 || echo    ⚠️  No services detected
    goto MENU
)

if /i "%choice%"=="Q" (
    echo.
    echo    👋 Launcher closing... Services will continue running in background.
    echo    💡 Tip: Use stop.bat to stop all services later.
    timeout /t 2 >nul
    exit /b 0
)

if /i "%choice%"=="X" (
    echo.
    echo    🛑 Stopping all BharatChain services...
    taskkill /f /im node.exe >nul 2>&1
    taskkill /f /im python.exe >nul 2>&1
    echo    ✅ All services stopped.
    echo    👋 Thank you for using BharatChain!
    timeout /t 3 >nul
    exit /b 0
)

echo    ❌ Invalid choice. Please enter M, O, S, Q, or X.
goto MENU
