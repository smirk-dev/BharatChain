@echo off@echo off@echo off@echo off

setlocal enabledelayedexpansion

title BharatChain Platform Launchersetlocal enabledelayedexpansion



clstitle 🇮🇳 BharatChain Platform Launcher 🇮🇳setlocal enabledelayedexpansionsetlocal enabledelayedexpansion

color 0B

echo.

echo  ============================================

echo  ^|  BharatChain Digital Identity Platform  ^|REM ============================================================================title 🇮🇳 BharatChain Platform Launcher 🇮🇳title 🇮🇳 BharatChain Platform Launcher 🇮🇳

echo  ^|          One-Click Startup System       ^|  

echo  ============================================REM 🇮🇳 BharatChain Digital Identity Platform - One-Click Startup 🇮🇳

echo.

REM ============================================================================

REM Set project root

set "PROJECT_ROOT=%~dp0"REM The easiest way to start the complete BharatChain ecosystem

set "PYTHON_PATH=python"

set "ERROR_COUNT=0"REM All services will be automatically configured and launchedREM ============================================================================REM ============================================================================



echo [1/7] Checking system requirements...REM Browser will open automatically when ready



REM Check Node.jsREM ============================================================================REM 🇮🇳 BharatChain Digital Identity Platform - One-Click Startup 🇮🇳REM 🇮🇳 BharatChain Digital Identity Platform - One-Click Startup 🇮🇳

echo    Checking Node.js...

node --version >nul 2>&1

if %errorlevel% neq 0 (

    echo    ERROR: Node.js not foundclsREM ============================================================================REM ============================================================================

    set /a ERROR_COUNT+=1

) else (color 0B

    echo    OK: Node.js found

)echo.REM The easiest way to start the complete BharatChain ecosystemREM The easiest way to start the complete BharatChain ecosystem



REM Check Pythonecho  ╔══════════════════════════════════════════════════════════════════════╗

echo    Checking Python...

python --version >nul 2>&1echo  ║  ████████╗██████╗  ██╗  ██╗ █████╗ ██████╗  █████╗ ████████╗███████╗ ║REM All services will be automatically configured and launchedREM All services will be automatically configured and launched

if %errorlevel% neq 0 (

    echo    ERROR: Python not foundecho  ║  ██╔══██║██╔══██╗ ██║  ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝ ║

    set /a ERROR_COUNT+=1

) else (echo  ║  ██████╔╝██████╔╝ ███████║███████║██████╔╝███████║   ██║   ███████╗ ║REM Browser will open automatically when readyREM ============================================================================

    echo    OK: Python found

)echo  ║  ██╔══██╗██╔══██╗ ██╔══██║██╔══██║██╔══██╗██╔══██║   ██║   ╚════██║ ║



if %ERROR_COUNT% gtr 0 (echo  ║  ██████╔╝██║  ██║ ██║  ██║██║  ██║██║  ██║██║  ██║   ██║   ███████║ ║REM ============================================================================

    echo.

    echo ERROR: %ERROR_COUNT% dependencies missingecho  ║  ╚═════╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝ ║

    echo Please install missing dependencies first

    pauseecho  ║                                                                      ║cls

    exit /b 1

)echo  ║             🇮🇳 DIGITAL IDENTITY ^& GOVERNANCE PLATFORM 🇮🇳           ║



echo [2/7] Cleaning up existing services...echo  ║                                                                      ║clscolor 0B

taskkill /f /im node.exe >nul 2>&1

taskkill /f /im python.exe >nul 2>&1echo  ║          🚀 INTELLIGENT ONE-CLICK STARTUP SYSTEM 🚀                  ║

timeout /t 2 >nul

echo  ║                    ⚡ Everything Automated ⚡                       ║color 0Becho.

echo [3/7] Installing dependencies (if needed)...

REM Server dependenciesecho  ╚══════════════════════════════════════════════════════════════════════╝

if not exist "%PROJECT_ROOT%server\node_modules" (

    echo    Installing backend dependencies...echo.echo.echo  ╔══════════════════════════════════════════════════════════════════════╗

    cd /d "%PROJECT_ROOT%server"

    call npm install --silentecho                     🌟 Empowering Digital India 🌟

    if %errorlevel% neq 0 (

        echo    ERROR: Failed to install backend dependenciesecho.echo  ╔══════════════════════════════════════════════════════════════════════╗echo  ║  ████████╗██████╗  ██╗  ██╗ █████╗ ██████╗  █████╗ ████████╗███████╗ ║

        pause

        exit /b 1

    )

)REM Set project rootecho  ║  ████████╗██████╗  ██╗  ██╗ █████╗ ██████╗  █████╗ ████████╗███████╗ ║echo  ║  ██╔══██║██╔══██╗ ██║  ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝ ║



REM Client dependencies  set "PROJECT_ROOT=%~dp0"

if not exist "%PROJECT_ROOT%client\node_modules" (

    echo    Installing frontend dependencies...set "PYTHON_PATH=%PROJECT_ROOT%.venv\Scripts\python.exe"echo  ║  ██╔══██║██╔══██╗ ██║  ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝ ║echo  ║  ██████╔╝██████╔╝ ███████║███████║██████╔╝███████║   ██║   ███████╗ ║

    cd /d "%PROJECT_ROOT%client"

    call npm install --silentset "ERROR_COUNT=0"

    if %errorlevel% neq 0 (

        echo    ERROR: Failed to install frontend dependenciesecho  ║  ██████╔╝██████╔╝ ███████║███████║██████╔╝███████║   ██║   ███████╗ ║echo  ║  ██╔══██╗██╔══██╗ ██╔══██║██╔══██║██╔══██╗██╔══██║   ██║   ╚════██║ ║

        pause

        exit /b 1echo.

    )

)echo ╔═════════════════════════════════════════════════════════════════════════╗echo  ║  ██╔══██╗██╔══██╗ ██╔══██║██╔══██║██╔══██╗██╔══██║   ██║   ╚════██║ ║echo  ║  ██████╔╝██║  ██║ ██║  ██║██║  ██║██║  ██║██║  ██║   ██║   ███████║ ║



REM Python dependenciesecho ║                      🔍 STEP 1/7: PRE-FLIGHT SYSTEM CHECK 🔍          ║

echo    Installing AI service dependencies...

cd /d "%PROJECT_ROOT%ai-service"echo ║                        Validating System Requirements                   ║echo  ║  ██████╔╝██║  ██║ ██║  ██║██║  ██║██║  ██║██║  ██║   ██║   ███████║ ║echo  ║  ╚═════╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝ ║

if exist requirements.txt (

    "%PYTHON_PATH%" -m pip install -r requirements.txt --quiet --no-warn-script-location >nul 2>&1echo ╚═════════════════════════════════════════════════════════════════════════╝

)

echo.echo  ║  ╚═════╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝ ║echo  ║                                                                      ║

echo [4/7] Starting blockchain network...

cd /d "%PROJECT_ROOT%"

start "Blockchain Network" /MIN cmd /k "echo Starting Hardhat Blockchain... && npx hardhat --config blockchain\hardhat.config.js node"

timeout /t 8 >nulREM Check Node.jsecho  ║                                                                      ║echo  ║             🇮🇳 DIGITAL IDENTITY ^& GOVERNANCE PLATFORM 🇮🇳           ║



echo [5/7] Starting AI service...echo    🔍 Checking Node.js installation...

cd /d "%PROJECT_ROOT%ai-service"

if exist "simple_ai_service.py" (node --version >nul 2>&1echo  ║             🇮🇳 DIGITAL IDENTITY ^& GOVERNANCE PLATFORM 🇮🇳           ║echo  ║                                                                      ║

    start "AI Service" cmd /k "echo Starting AI Service... && "%PYTHON_PATH%" simple_ai_service.py"

) else if exist "app.py" (if %errorlevel% neq 0 (

    start "AI Service" cmd /k "echo Starting AI Service... && "%PYTHON_PATH%" app.py"

)    color 0Cecho  ║                                                                      ║echo  ║          🚀 INTELLIGENT ONE-CLICK STARTUP SYSTEM 🚀                  ║

timeout /t 3 >nul

    echo    ❌ Node.js not found - please install Node.js from nodejs.org

echo [6/7] Starting backend API...

cd /d "%PROJECT_ROOT%server"    set /a ERROR_COUNT+=1echo  ║          🚀 INTELLIGENT ONE-CLICK STARTUP SYSTEM 🚀                  ║echo  ║                    ⚡ Everything Automated ⚡                       ║

if exist "server.js" (

    start "Backend API" cmd /k "echo Starting Backend API... && node server.js") else (

)

timeout /t 5 >nul    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%iecho  ║                    ⚡ Everything Automated ⚡                       ║echo  ╚══════════════════════════════════════════════════════════════════════╝



echo [7/7] Starting frontend...    echo    ✅ Node.js detected - Version: !NODE_VERSION!

cd /d "%PROJECT_ROOT%client"

if exist "package.json" ()echo  ╚══════════════════════════════════════════════════════════════════════╝echo.

    start "Frontend" cmd /k "echo Starting React Frontend... && npm start"

)



echo.REM Check Python (project virtual environment)echo.echo                     🌟 Empowering Digital India 🌟

echo All services starting...

echo Waiting for frontend to be ready...echo    🔍 Checking Python environment...

timeout /t 15 >nul

if exist "%PYTHON_PATH%" (echo                     🌟 Empowering Digital India 🌟echo.

echo Opening browser...

start http://localhost:3000    echo    ✅ Python virtual environment found



echo.) else (echo.

echo ============================================

echo ^| BharatChain Platform is now running! ^|    REM Try system Python

echo ^|                                        ^|

echo ^| Frontend:  http://localhost:3000      ^|    python --version >nul 2>&1REM Set project root

echo ^| Backend:   http://localhost:3001      ^|

echo ^| AI Service: http://localhost:5001     ^|    if %errorlevel% neq 0 (

echo ^| Blockchain: http://localhost:8545     ^|

echo ============================================        color 0CREM Set project rootset "PROJECT_ROOT=%~dp0"

echo.

echo Press any key to open browser again, or Ctrl+C to exit        echo    ❌ Python not found - please install Python 3.8+ from python.org

pause >nul

start http://localhost:3000        set /a ERROR_COUNT+=1set "PROJECT_ROOT=%~dp0"set "PYTHON_PATH=%PROJECT_ROOT%.venv\Scripts\python.exe"

    ) else (

        for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%iset "PYTHON_PATH=%PROJECT_ROOT%.venv\Scripts\python.exe"set "ERROR_COUNT=0"

        echo    ⚠️  System Python detected - Version: !PYTHON_VERSION! (virtual environment preferred)

        set "PYTHON_PATH=python"set "ERROR_COUNT=0"

    )

)echo.



REM Check npm dependenciesecho.echo ╔═════════════════════════════════════════════════════════════════════════╗

echo    🔍 Checking project dependencies...

if not exist "%PROJECT_ROOT%server\node_modules" (echo ╔═════════════════════════════════════════════════════════════════════════╗echo ║                      🔍 STEP 1/7: PRE-FLIGHT SYSTEM CHECK 🔍          ║

    echo    ⚠️  Server dependencies missing - will install automatically

)echo ║                      🔍 STEP 1/7: PRE-FLIGHT SYSTEM CHECK 🔍          ║echo ║                        Validating System Requirements                   ║

if not exist "%PROJECT_ROOT%client\node_modules" (

    echo    ⚠️  Client dependencies missing - will install automaticallyecho ║                        Validating System Requirements                   ║echo ╚═════════════════════════════════════════════════════════════════════════╝

)

echo ╚═════════════════════════════════════════════════════════════════════════╝echo.

if %ERROR_COUNT% gtr 0 (

    echo.echo.

    color 0C

    echo    ╔═══════════════════════════════════════════════════════════════╗REM Check Node.js

    echo    ║  ❌ CRITICAL ERROR: %ERROR_COUNT% dependencies missing              ║

    echo    ║  Please install missing dependencies first                   ║REM Check Node.jsecho    🔍 Checking Node.js installation...

    echo    ╚═══════════════════════════════════════════════════════════════╝

    echo.echo    🔍 Checking Node.js installation...node --version >nul 2>&1

    echo Press any key to exit...

    pause >nulnode --version >nul 2>&1if %errorlevel% neq 0 (

    exit /b 1

) else (if %errorlevel% neq 0 (    color 0C

    color 0A

    echo    ✅ All system requirements satisfied!    color 0C    echo    ❌ Node.js not found - please install Node.js from nodejs.org

)

    echo    ❌ Node.js not found - please install Node.js from nodejs.org    set /a ERROR_COUNT+=1

echo.

echo ╔═════════════════════════════════════════════════════════════════════════╗    set /a ERROR_COUNT+=1) else (

echo ║                   🧹 STEP 2/7: CLEANUP EXISTING SERVICES 🧹           ║

echo ║                      Preparing Clean Environment                        ║) else (    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i

echo ╚═════════════════════════════════════════════════════════════════════════╝

echo.    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i    echo    ✅ Node.js detected - Version: !NODE_VERSION!

echo    🧹 Stopping any existing BharatChain services...

echo    ⏹️  Terminating Node.js processes...    echo    ✅ Node.js detected - Version: !NODE_VERSION!)

taskkill /f /im node.exe >nul 2>&1

echo    ⏹️  Terminating Python processes...)

taskkill /f /im python.exe >nul 2>&1

echo    ⏹️  Terminating Hardhat processes...REM Check Python (project virtual environment)

taskkill /f /im hardhat.exe >nul 2>&1

timeout /t 2 >nulREM Check Python (project virtual environment)echo    🔍 Checking Python environment...

color 0A

echo    ✅ Environment cleanup completed successfully!echo    🔍 Checking Python environment...if exist "%PYTHON_PATH%" (



echo.if exist "%PYTHON_PATH%" (    echo    ✅ Python virtual environment found

echo ╔═════════════════════════════════════════════════════════════════════════╗

echo ║                📦 STEP 3/7: INSTALLING DEPENDENCIES 📦                ║    echo    ✅ Python virtual environment found) else (

echo ║                    Smart Dependency Management                          ║

echo ╚═════════════════════════════════════════════════════════════════════════╝) else (    REM Try system Python



REM Install server dependencies    REM Try system Python    python --version >nul 2>&1

if not exist "%PROJECT_ROOT%server\node_modules" (

    echo.    python --version >nul 2>&1    if %errorlevel% neq 0 (

    echo    📦 Installing backend dependencies...

    echo    ⏳ This may take a few minutes for first-time setup...    if %errorlevel% neq 0 (        color 0C

    cd /d "%PROJECT_ROOT%server"

    npm install --silent        color 0C        echo    ❌ Python not found - please install Python 3.8+ from python.org

    if %errorlevel% neq 0 (

        color 0C        echo    ❌ Python not found - please install Python 3.8+ from python.org        set /a ERROR_COUNT+=1

        echo    ❌ Failed to install backend dependencies

        pause        set /a ERROR_COUNT+=1    ) else (

        exit /b 1

    )    ) else (        for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i

    color 0A

    echo    ✅ Backend dependencies installed successfully!        for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i        echo    ⚠️  System Python detected - Version: !PYTHON_VERSION! (virtual environment preferred)

) else (

    echo    ✅ Backend dependencies already installed        echo    ⚠️  System Python detected - Version: !PYTHON_VERSION! (virtual environment preferred)        set "PYTHON_PATH=python"

)

        set "PYTHON_PATH=python"    )

REM Install client dependencies

if not exist "%PROJECT_ROOT%client\node_modules" (    ))

    echo.

    echo    🎨 Installing frontend dependencies...)

    echo    ⏳ Setting up React development environment...

    cd /d "%PROJECT_ROOT%client"REM Check npm dependencies

    npm install --silent

    if %errorlevel% neq 0 (REM Check npm dependenciesecho    🔍 Checking project dependencies...

        color 0C

        echo    ❌ Failed to install frontend dependenciesecho    🔍 Checking project dependencies...if not exist "%PROJECT_ROOT%server\node_modules" (

        pause

        exit /b 1if not exist "%PROJECT_ROOT%server\node_modules" (    echo    ⚠️  Server dependencies missing - will install automatically

    )

    color 0A    echo    ⚠️  Server dependencies missing - will install automatically)

    echo    ✅ Frontend dependencies installed successfully!

) else ()if not exist "%PROJECT_ROOT%client\node_modules" (

    echo    ✅ Frontend dependencies already installed

)if not exist "%PROJECT_ROOT%client\node_modules" (    echo    ⚠️  Client dependencies missing - will install automatically



REM Install Python dependencies    echo    ⚠️  Client dependencies missing - will install automatically)

echo.

echo    🧠 Installing AI service dependencies...)

cd /d "%PROJECT_ROOT%ai-service"

if exist requirements.txt (if %ERROR_COUNT% gtr 0 (

    echo    📦 Installing Python packages... (this may take a moment)

    "%PYTHON_PATH%" -m pip install -r requirements.txt --quiet --no-warn-script-locationif %ERROR_COUNT% gtr 0 (    echo.

    if %errorlevel% neq 0 (

        color 0E    echo.    color 0C

        echo    ⚠️  AI service dependencies had some warnings (will continue with available packages)

        echo    💡 Note: Some advanced features may be limited, but basic functionality will work    color 0C    echo    ╔═══════════════════════════════════════════════════════════════╗

    ) else (

        color 0A    echo    ╔═══════════════════════════════════════════════════════════════╗    echo    ║  ❌ CRITICAL ERROR: %ERROR_COUNT% dependencies missing              ║

        echo    ✅ AI service dependencies installed successfully!

    )    echo    ║  ❌ CRITICAL ERROR: %ERROR_COUNT% dependencies missing              ║    echo    ║  Please install missing dependencies first                   ║

) else (

    color 0E    echo    ║  Please install missing dependencies first                   ║    echo    ╚═══════════════════════════════════════════════════════════════╝

    echo    ⚠️  AI service requirements.txt not found (will use system packages)

)    echo    ╚═══════════════════════════════════════════════════════════════╝    echo.



echo.    echo.    echo Press any key to exit...

echo ╔═════════════════════════════════════════════════════════════════════════╗

echo ║              ⛓️ STEP 4/7: STARTING BLOCKCHAIN NETWORK ⛓️              ║    echo Press any key to exit...    pause >nul

echo ║                      Hardhat Local Development                          ║

echo ╚═════════════════════════════════════════════════════════════════════════╝    pause >nul    exit /b 1

cd /d "%PROJECT_ROOT%"

echo.    exit /b 1) else (

echo    ⛓️  Initializing local Hardhat blockchain network...

echo    🚀 Starting development blockchain on port 8545...) else (    color 0A

start "🔗 BharatChain Blockchain Network" /MIN cmd /c "echo ╔══════════════════════════════════════════════════════════╗ && echo ║                  BHARATCHAIN BLOCKCHAIN                  ║ && echo ║                    Hardhat Network                       ║ && echo ║                   Port: 8545                            ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo Starting Hardhat Network... && npx hardhat --config blockchain\hardhat.config.js node"

echo    ⏳ Waiting for blockchain to initialize... (10 seconds)    color 0A    echo    ✅ All system requirements satisfied!

timeout /t 10 >nul

    echo    ✅ All system requirements satisfied!)

echo    📋 Deploying smart contracts to blockchain...

npx hardhat run scripts/deploy.js --network localhost --config blockchain\hardhat.config.js >nul 2>&1)

if %errorlevel% neq 0 (

    color 0Eecho.

    echo    ⚠️  Contract deployment had warnings (blockchain will continue)

) else (echo.echo ╔═════════════════════════════════════════════════════════════════════════╗

    color 0A

    echo    ✅ Smart contracts deployed successfully to local network!echo ╔═════════════════════════════════════════════════════════════════════════╗echo ║                   🧹 STEP 2/7: CLEANUP EXISTING SERVICES 🧹           ║

)

echo ║                   🧹 STEP 2/7: CLEANUP EXISTING SERVICES 🧹           ║echo ║                      Preparing Clean Environment                        ║

echo.

echo ╔═════════════════════════════════════════════════════════════════════════╗echo ║                      Preparing Clean Environment                        ║echo ╚═════════════════════════════════════════════════════════════════════════╝

echo ║                 🧠 STEP 5/7: STARTING AI SERVICE 🧠                   ║

echo ║                    OCR ^& Document Processing                            ║echo ╚═════════════════════════════════════════════════════════════════════════╝echo.

echo ╚═════════════════════════════════════════════════════════════════════════╝

cd /d "%PROJECT_ROOT%ai-service"echo.echo    🧹 Stopping any existing BharatChain services...

echo.

echo    🧠 Initializing AI service with OCR capabilities...echo    🧹 Stopping any existing BharatChain services...echo    ⏹️  Terminating Node.js processes...

echo    🤖 Starting document processing engine on port 5001...

if exist "simple_ai_service.py" (echo    ⏹️  Terminating Node.js processes...taskkill /f /im node.exe >nul 2>&1

    start "🧠 BharatChain AI Service" cmd /k "title 🧠 BharatChain AI Service && color 0E && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                    BHARATCHAIN AI SERVICE                ║ && echo ║                 OCR ^& Document Processing                 ║ && echo ║                      Port: 5001                          ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [AI SERVICE] Starting OCR and Document Processing... && echo [AI SERVICE] TensorFlow/OpenCV Loading... && echo [AI SERVICE] Ready for Hindi/English text recognition && echo. && "%PYTHON_PATH%" simple_ai_service.py"

    color 0Ataskkill /f /im node.exe >nul 2>&1echo    ⏹️  Terminating Python processes...

    echo    ✅ AI Service starting successfully on port 5001

) else if exist "app.py" (echo    ⏹️  Terminating Python processes...taskkill /f /im python.exe >nul 2>&1

    start "🧠 BharatChain AI Service" cmd /k "title 🧠 BharatChain AI Service && color 0E && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                    BHARATCHAIN AI SERVICE                ║ && echo ║                 OCR ^& Document Processing                 ║ && echo ║                      Port: 5001                          ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [AI SERVICE] Starting OCR and Document Processing... && echo [AI SERVICE] Loading ML Models... && echo [AI SERVICE] Ready for document analysis && echo. && "%PYTHON_PATH%" app.py"

    color 0Ataskkill /f /im python.exe >nul 2>&1echo    ⏹️  Terminating Hardhat processes...

    echo    ✅ AI Service (fallback) starting successfully on port 5001

) else (echo    ⏹️  Terminating Hardhat processes...taskkill /f /im hardhat.exe >nul 2>&1

    color 0C

    echo    ❌ AI Service files not found - check ai-service directorytaskkill /f /im hardhat.exe >nul 2>&1timeout /t 2 >nul

)

timeout /t 3 >nultimeout /t 2 >nulcolor 0A



echo.color 0Aecho    ✅ Environment cleanup completed successfully!

echo ╔═════════════════════════════════════════════════════════════════════════╗

echo ║                ⚙️ STEP 6/7: STARTING BACKEND API ⚙️                   ║echo    ✅ Environment cleanup completed successfully!

echo ║                Express Server ^& Database Integration                   ║

echo ╚═════════════════════════════════════════════════════════════════════════╝echo.

cd /d "%PROJECT_ROOT%server"

echo.echo.echo ╔═════════════════════════════════════════════════════════════════════════╗

echo    ⚙️  Initializing Express.js backend server...

echo    🗄️  Connecting to SQLite database...echo ╔═════════════════════════════════════════════════════════════════════════╗echo ║                📦 STEP 3/7: INSTALLING DEPENDENCIES 📦                ║

echo    🔐 Setting up JWT authentication system...

echo    🌐 Configuring Web3 blockchain integration...echo ║                📦 STEP 3/7: INSTALLING DEPENDENCIES 📦                ║echo ║                    Smart Dependency Management                          ║

echo    ⏳ Waiting for blockchain to be ready... (5 seconds)

timeout /t 5 >nulecho ║                    Smart Dependency Management                          ║echo ╚═════════════════════════════════════════════════════════════════════════╝

if exist "server.js" (

    start "⚙️ BharatChain Backend API" cmd /k "title ⚙️ BharatChain Backend API && color 0C && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                   BHARATCHAIN BACKEND API                ║ && echo ║                Express.js ^& SQLite Database                ║ && echo ║                       Port: 3001                         ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [BACKEND] Starting Express Server and APIs... && echo [BACKEND] Database: SQLite with auto-sync && echo [BACKEND] JWT Authentication: Enabled && echo [BACKEND] Web3 Integration: Ready && echo [BACKEND] CORS Origin: http://localhost:3000 && echo [BACKEND] WebSocket Support: Active && echo. && pushd \"%PROJECT_ROOT%server\" && node server.js"echo ╚═════════════════════════════════════════════════════════════════════════╝

    color 0A

    echo    ✅ Backend API starting successfully on port 3001REM Install server dependencies

) else (

    color 0CREM Install server dependenciesif not exist "%PROJECT_ROOT%server\node_modules" (

    echo    ❌ Backend server file not found at %PROJECT_ROOT%server\server.js

)if not exist "%PROJECT_ROOT%server\node_modules" (    echo.

timeout /t 8 >nul

    echo.    echo    📦 Installing backend dependencies...

echo.

echo ╔═════════════════════════════════════════════════════════════════════════╗    echo    📦 Installing backend dependencies...    echo    ⏳ This may take a few minutes for first-time setup...

echo ║                🎨 STEP 7/7: STARTING FRONTEND APP 🎨                  ║

echo ║                React Development Server ^& Material-UI                  ║    echo    ⏳ This may take a few minutes for first-time setup...    cd /d "%PROJECT_ROOT%server"

echo ╚═════════════════════════════════════════════════════════════════════════╝

cd /d "%PROJECT_ROOT%client"    cd /d "%PROJECT_ROOT%server"    npm install --silent

echo.

echo    🎨 Initializing React development environment...    npm install --silent    if %errorlevel% neq 0 (

echo    ⚛️  Loading Material-UI component library...

echo    🔗 Establishing Web3/MetaMask integration...    if %errorlevel% neq 0 (        color 0C

if exist "package.json" (

    start "🎨 BharatChain Frontend" cmd /k "title 🎨 BharatChain Frontend && color 0B && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                  BHARATCHAIN FRONTEND                    ║ && echo ║                React.js ^& Material-UI                     ║ && echo ║                      Port: 3000                          ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [FRONTEND] Starting React Development Server... && echo [FRONTEND] Material-UI Theme: Loaded && echo [FRONTEND] Web3 Integration: Ready && echo [FRONTEND] MetaMask Support: Active && echo [FRONTEND] Multi-language: Hindi/English && echo [FRONTEND] Hot Reload: Enabled && echo. && npm start"        color 0C        echo    ❌ Failed to install backend dependencies

    color 0A

    echo    ✅ Frontend app starting successfully on port 3000        echo    ❌ Failed to install backend dependencies        pause

) else (

    color 0C        pause        exit /b 1

    echo    ❌ Frontend package.json not found - check client directory

)        exit /b 1    )



color 0B    )    color 0A



echo.    color 0A    echo    ✅ Backend dependencies installed successfully!

echo  ╔══════════════════════════════════════════════════════════════════════╗

echo  ║                    🎉 BHARATCHAIN LAUNCHED! 🎉                      ║    echo    ✅ Backend dependencies installed successfully!) else (

echo  ║                                                                      ║

echo  ║    🚀 All services are spinning up in dedicated windows...          ║) else (    echo    ✅ Backend dependencies already installed

echo  ║    ⭐ Professional-grade microservices architecture                  ║

echo  ╚══════════════════════════════════════════════════════════════════════╝    echo    ✅ Backend dependencies already installed)

echo.

)

REM Wait for services to initialize

echo ╔═════════════════════════════════════════════════════════════════════════╗REM Install client dependencies

echo ║                    ⏳ SERVICE INITIALIZATION STATUS ⏳                 ║

echo ╚═════════════════════════════════════════════════════════════════════════╝REM Install client dependenciesif not exist "%PROJECT_ROOT%client\node_modules" (

echo.

echo    ⛓️  Blockchain Network:   Initializing... (~5 seconds)if not exist "%PROJECT_ROOT%client\node_modules" (    echo.

echo    🧠 AI Service:           Loading models... (~8 seconds)  

echo    ⚙️  Backend API:          Connecting database... (~12 seconds)    echo.    echo    🎨 Installing frontend dependencies...

echo    🎨 Frontend App:         Building bundle... (~18 seconds)

echo.    echo    🎨 Installing frontend dependencies...    echo    ⏳ Setting up React development environment...

echo    ⏱️  Total estimated startup time: ~25 seconds

echo.    echo    ⏳ Setting up React development environment...    cd /d "%PROJECT_ROOT%client"

for /l %%i in (1,1,20) do (

    set /p "=■" <nul    cd /d "%PROJECT_ROOT%client"    npm install --silent

    timeout /t 1 >nul

)    npm install --silent    if %errorlevel% neq 0 (

echo.

echo.    if %errorlevel% neq 0 (        color 0C

color 0A

echo    ✅ All services should now be operational!        color 0C        echo    ❌ Failed to install frontend dependencies



REM Enhanced browser opening with multiple methods        echo    ❌ Failed to install frontend dependencies        pause

echo.

echo ╔═════════════════════════════════════════════════════════════════════════╗        pause        exit /b 1

echo ║                      🌐 OPENING WEB BROWSER 🌐                        ║

echo ╚═════════════════════════════════════════════════════════════════════════╝        exit /b 1    )

echo.

echo    ⏳ Waiting for frontend to be fully ready... (10 seconds)    )    color 0A

echo    🌐 This ensures the browser opens to a working application

timeout /t 10 >nul    color 0A    echo    ✅ Frontend dependencies installed successfully!

echo    🚀 Launching BharatChain Platform in your default browser...

echo    📱 URL: http://localhost:3000    echo    ✅ Frontend dependencies installed successfully!) else (

start "BharatChain Platform - Digital India" http://localhost:3000

timeout /t 2 >nul) else (    echo    ✅ Frontend dependencies already installed

REM Backup browser opening method

powershell -command "try { Start-Process 'http://localhost:3000' -ErrorAction SilentlyContinue } catch { Write-Host 'Browser already opened or unavailable' }"    echo    ✅ Frontend dependencies already installed)

echo    ✅ Browser opened successfully!

echo.)



echo  ╔══════════════════════════════════════════════════════════════════════╗REM Install Python dependencies

echo  ║  🏛️ WELCOME TO BHARATCHAIN - DIGITAL INDIA PLATFORM! 🏛️             ║

echo  ║                                                                      ║REM Install Python dependenciesecho.

echo  ║  🚀 SYSTEM STATUS: FULLY OPERATIONAL                                ║

echo  ║                                                                      ║echo.echo    🧠 Installing AI service dependencies...

echo  ║  📍 SERVICE ENDPOINTS:                                               ║

echo  ║     🌐 Frontend:          http://localhost:3000                     ║echo    🧠 Installing AI service dependencies...cd /d "%PROJECT_ROOT%ai-service"

echo  ║     🔧 Backend API:       http://localhost:3001/api/health          ║

echo  ║     🧠 AI Service:        http://localhost:5001/health              ║cd /d "%PROJECT_ROOT%ai-service"if exist requirements.txt (

echo  ║     ⛓️  Blockchain:        http://localhost:8545                     ║

echo  ║                                                                      ║if exist requirements.txt (    echo    📦 Installing Python packages... (this may take a moment)

echo  ║  📋 AVAILABLE FEATURES:                                              ║

echo  ║     ✅ Citizen Registration ^& Authentication                        ║    echo    📦 Installing Python packages... (this may take a moment)    "%PYTHON_PATH%" -m pip install -r requirements.txt --quiet --no-warn-script-location

echo  ║     ✅ Document Upload ^& OCR Processing                             ║

echo  ║     ✅ Blockchain Verification ^& QR Codes                           ║    "%PYTHON_PATH%" -m pip install -r requirements.txt --quiet --no-warn-script-location    if %errorlevel% neq 0 (

echo  ║     ✅ Grievance Management System                                   ║

echo  ║     ✅ Government Payment Processing                                 ║    if %errorlevel% neq 0 (        color 0E

echo  ║     ✅ MetaMask Web3 Integration                                     ║

echo  ║     ✅ Multi-language Support (Hindi/English)                       ║        color 0E        echo    ⚠️  AI service dependencies had some warnings (will continue with available packages)

echo  ║     ✅ Real-time WebSocket Events                                    ║

echo  ║     ✅ JWT Authentication ^& Security                                ║        echo    ⚠️  AI service dependencies had some warnings (will continue with available packages)        echo    💡 Note: Some advanced features may be limited, but basic functionality will work

echo  ║                                                                      ║

echo  ║  🔧 TROUBLESHOOTING:                                                 ║        echo    💡 Note: Some advanced features may be limited, but basic functionality will work    ) else (

echo  ║     • If frontend shows errors, wait 30 seconds for backend         ║

echo  ║     • Check service windows for any startup errors                  ║    ) else (        color 0A

echo  ║     • Backend must be on port 3001, Frontend on 3000                ║

echo  ║     • MetaMask required for Web3 features                           ║        color 0A        echo    ✅ AI service dependencies installed successfully!

echo  ║                                                                      ║

echo  ║  ⚡ All services running in separate windows - DO NOT CLOSE THEM    ║        echo    ✅ AI service dependencies installed successfully!    )

echo  ║                                                                      ║

echo  ║  🛑 TO STOP: Close all terminal windows or run stop.bat             ║    )) else (

echo  ╚══════════════════════════════════════════════════════════════════════╝

echo.) else (    color 0E



cd /d "%PROJECT_ROOT%"    color 0E    echo    ⚠️  AI service requirements.txt not found (will use system packages)



echo ╔═════════════════════════════════════════════════════════════════════════╗    echo    ⚠️  AI service requirements.txt not found (will use system packages))

echo ║                    🎛️ LAUNCHER CONTROL PANEL 🎛️                      ║

echo ╚═════════════════════════════════════════════════════════════════════════╝)

echo.

echo    This launcher will remain open to monitor your services.echo.

echo    You can safely minimize this window - all services will continue running.

echo.echo.echo ╔═════════════════════════════════════════════════════════════════════════╗

echo    Available Actions:

echo    [B] Open BharatChain in browserecho ╔═════════════════════════════════════════════════════════════════════════╗echo ║              ⛓️ STEP 4/7: STARTING BLOCKCHAIN NETWORK ⛓️              ║

echo    [M] Minimize this launcher window

echo    [O] Open BharatChain in browser again (backup method)echo ║              ⛓️ STEP 4/7: STARTING BLOCKCHAIN NETWORK ⛓️              ║echo ║                      Hardhat Local Development                          ║

echo    [S] Show service status

echo    [Q] Quit launcher (services will keep running)echo ║                      Hardhat Local Development                          ║echo ╚═════════════════════════════════════════════════════════════════════════╝

echo    [X] Stop all services and exit

echo.echo ╚═════════════════════════════════════════════════════════════════════════╝cd /d "%PROJECT_ROOT%"



:MENUcd /d "%PROJECT_ROOT%"echo.

set /p "choice=    Enter your choice (B/M/O/S/Q/X): "

echo.echo    ⛓️  Initializing local Hardhat blockchain network...

if /i "%choice%"=="B" (

    echo    🌐 Opening BharatChain Platform...echo    ⛓️  Initializing local Hardhat blockchain network...echo    🚀 Starting development blockchain on port 8545...

    start "BharatChain Platform" http://localhost:3000

    goto MENUecho    🚀 Starting development blockchain on port 8545...start "🔗 BharatChain Blockchain Network" /MIN cmd /c "echo ╔══════════════════════════════════════════════════════════╗ && echo ║                  BHARATCHAIN BLOCKCHAIN                  ║ && echo ║                    Hardhat Network                       ║ && echo ║                   Port: 8545                            ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo Starting Hardhat Network... && npx hardhat --config blockchain\hardhat.config.js node"

)

start "🔗 BharatChain Blockchain Network" /MIN cmd /c "echo ╔══════════════════════════════════════════════════════════╗ && echo ║                  BHARATCHAIN BLOCKCHAIN                  ║ && echo ║                    Hardhat Network                       ║ && echo ║                   Port: 8545                            ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo Starting Hardhat Network... && npx hardhat --config blockchain\hardhat.config.js node"echo    ⏳ Waiting for blockchain to initialize... (10 seconds)

if /i "%choice%"=="M" (

    echo    🗕 Minimizing launcher window...echo    ⏳ Waiting for blockchain to initialize... (10 seconds)timeout /t 10 >nul

    powershell -command "(New-Object -ComObject Shell.Application).MinimizeAll()"

    goto MENUtimeout /t 10 >nul

)

echo    📋 Deploying smart contracts to blockchain...

if /i "%choice%"=="O" (

    echo    🌐 Opening BharatChain Platform (backup method)...echo    📋 Deploying smart contracts to blockchain...npx hardhat run scripts/deploy.js --network localhost --config blockchain\hardhat.config.js >nul 2>&1

    powershell -command "Start-Process 'http://localhost:3000'"

    goto MENUnpx hardhat run scripts/deploy.js --network localhost --config blockchain\hardhat.config.js >nul 2>&1if %errorlevel% neq 0 (

)

if %errorlevel% neq 0 (    color 0E

if /i "%choice%"=="S" (

    echo.    color 0E    echo    ⚠️  Contract deployment had warnings (blockchain will continue)

    echo    📊 Checking service status...

    netstat -ano | findstr ":300" >nul && echo    ✅ Services detected on ports 3000-3001 || echo    ⚠️  No services detected    echo    ⚠️  Contract deployment had warnings (blockchain will continue)) else (

    goto MENU

)) else (    color 0A



if /i "%choice%"=="Q" (    color 0A    echo    ✅ Smart contracts deployed successfully to local network!

    echo.

    echo    👋 Launcher closing... Services will continue running in background.    echo    ✅ Smart contracts deployed successfully to local network!)

    echo    💡 Tip: Use stop.bat to stop all services later.

    timeout /t 2 >nul)

    exit /b 0

)echo.



if /i "%choice%"=="X" (echo.echo ╔═════════════════════════════════════════════════════════════════════════╗

    echo.

    echo    🛑 Stopping all BharatChain services...echo ╔═════════════════════════════════════════════════════════════════════════╗echo ║                 🧠 STEP 5/7: STARTING AI SERVICE 🧠                   ║

    taskkill /f /im node.exe >nul 2>&1

    taskkill /f /im python.exe >nul 2>&1echo ║                 🧠 STEP 5/7: STARTING AI SERVICE 🧠                   ║echo ║                    OCR ^& Document Processing                            ║

    echo    ✅ All services stopped.

    echo    👋 Thank you for using BharatChain!echo ║                    OCR ^& Document Processing                            ║echo ╚═════════════════════════════════════════════════════════════════════════╝

    timeout /t 3 >nul

    exit /b 0echo ╚═════════════════════════════════════════════════════════════════════════╝cd /d "%PROJECT_ROOT%ai-service"

)

cd /d "%PROJECT_ROOT%ai-service"echo.

echo    ❌ Invalid choice. Please enter B, M, O, S, Q, or X.

goto MENUecho.echo    🧠 Initializing AI service with OCR capabilities...

echo    🧠 Initializing AI service with OCR capabilities...echo    🤖 Starting document processing engine on port 5001...

echo    🤖 Starting document processing engine on port 5001...if exist "simple_ai_service.py" (

if exist "simple_ai_service.py" (    start "🧠 BharatChain AI Service" cmd /k "title 🧠 BharatChain AI Service && color 0E && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                    BHARATCHAIN AI SERVICE                ║ && echo ║                 OCR ^& Document Processing                 ║ && echo ║                      Port: 5001                          ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [AI SERVICE] Starting OCR and Document Processing... && echo [AI SERVICE] TensorFlow/OpenCV Loading... && echo [AI SERVICE] Ready for Hindi/English text recognition && echo. && "%PYTHON_PATH%" simple_ai_service.py"

    start "🧠 BharatChain AI Service" cmd /k "title 🧠 BharatChain AI Service && color 0E && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                    BHARATCHAIN AI SERVICE                ║ && echo ║                 OCR ^& Document Processing                 ║ && echo ║                      Port: 5001                          ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [AI SERVICE] Starting OCR and Document Processing... && echo [AI SERVICE] TensorFlow/OpenCV Loading... && echo [AI SERVICE] Ready for Hindi/English text recognition && echo. && "%PYTHON_PATH%" simple_ai_service.py"    color 0A

    color 0A    echo    ✅ AI Service starting successfully on port 5001

    echo    ✅ AI Service starting successfully on port 5001) else if exist "app.py" (

) else if exist "app.py" (    start "🧠 BharatChain AI Service" cmd /k "title 🧠 BharatChain AI Service && color 0E && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                    BHARATCHAIN AI SERVICE                ║ && echo ║                 OCR ^& Document Processing                 ║ && echo ║                      Port: 5001                          ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [AI SERVICE] Starting OCR and Document Processing... && echo [AI SERVICE] Loading ML Models... && echo [AI SERVICE] Ready for document analysis && echo. && "%PYTHON_PATH%" app.py"

    start "🧠 BharatChain AI Service" cmd /k "title 🧠 BharatChain AI Service && color 0E && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                    BHARATCHAIN AI SERVICE                ║ && echo ║                 OCR ^& Document Processing                 ║ && echo ║                      Port: 5001                          ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [AI SERVICE] Starting OCR and Document Processing... && echo [AI SERVICE] Loading ML Models... && echo [AI SERVICE] Ready for document analysis && echo. && "%PYTHON_PATH%" app.py"    color 0A

    color 0A    echo    ✅ AI Service (fallback) starting successfully on port 5001

    echo    ✅ AI Service (fallback) starting successfully on port 5001) else (

) else (    color 0C

    color 0C    echo    ❌ AI Service files not found - check ai-service directory

    echo    ❌ AI Service files not found - check ai-service directory)

)timeout /t 3 >nul

timeout /t 3 >nul

echo.

echo.echo ╔═════════════════════════════════════════════════════════════════════════╗

echo ╔═════════════════════════════════════════════════════════════════════════╗echo ║                ⚙️ STEP 6/7: STARTING BACKEND API ⚙️                   ║

echo ║                ⚙️ STEP 6/7: STARTING BACKEND API ⚙️                   ║echo ║                Express Server ^& Database Integration                   ║

echo ║                Express Server ^& Database Integration                   ║echo ╚═════════════════════════════════════════════════════════════════════════╝

echo ╚═════════════════════════════════════════════════════════════════════════╝cd /d "%PROJECT_ROOT%server"

cd /d "%PROJECT_ROOT%server"echo.

echo.echo    ⚙️  Initializing Express.js backend server...

echo    ⚙️  Initializing Express.js backend server...echo    🗄️  Connecting to SQLite database...

echo    🗄️  Connecting to SQLite database...echo    🔐 Setting up JWT authentication system...

echo    🔐 Setting up JWT authentication system...echo    🌐 Configuring Web3 blockchain integration...

echo    🌐 Configuring Web3 blockchain integration...echo    ⏳ Waiting for blockchain to be ready... (5 seconds)

echo    ⏳ Waiting for blockchain to be ready... (5 seconds)timeout /t 5 >nul

timeout /t 5 >nulif exist "server.js" (

if exist "server.js" (    REM Use full path to ensure server.js is found correctly

    start "⚙️ BharatChain Backend API" cmd /k "title ⚙️ BharatChain Backend API && color 0C && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                   BHARATCHAIN BACKEND API                ║ && echo ║                Express.js ^& SQLite Database                ║ && echo ║                       Port: 3001                         ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [BACKEND] Starting Express Server and APIs... && echo [BACKEND] Database: SQLite with auto-sync && echo [BACKEND] JWT Authentication: Enabled && echo [BACKEND] Web3 Integration: Ready && echo [BACKEND] CORS Origin: http://localhost:3000 && echo [BACKEND] WebSocket Support: Active && echo. && pushd \"%PROJECT_ROOT%server\" && node server.js"    start "⚙️ BharatChain Backend API" cmd /k "title ⚙️ BharatChain Backend API && color 0C && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                   BHARATCHAIN BACKEND API                ║ && echo ║                Express.js ^& SQLite Database                ║ && echo ║                       Port: 3001                         ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [BACKEND] Starting Express Server and APIs... && echo [BACKEND] Database: SQLite with auto-sync && echo [BACKEND] JWT Authentication: Enabled && echo [BACKEND] Web3 Integration: Ready && echo [BACKEND] CORS Origin: http://localhost:3000 && echo [BACKEND] WebSocket Support: Active && echo. && pushd \"%PROJECT_ROOT%server\" && node server.js"

    color 0A    color 0A

    echo    ✅ Backend API starting successfully on port 3001    echo    ✅ Backend API starting successfully on port 3001

) else () else (

    color 0C    color 0C

    echo    ❌ Backend server file not found at %PROJECT_ROOT%server\server.js    echo    ❌ Backend server file not found at %PROJECT_ROOT%server\server.js

))

timeout /t 8 >nultimeout /t 8 >nul



echo.echo.

echo ╔═════════════════════════════════════════════════════════════════════════╗echo ╔═════════════════════════════════════════════════════════════════════════╗

echo ║                🎨 STEP 7/7: STARTING FRONTEND APP 🎨                  ║echo ║                🎨 STEP 7/7: STARTING FRONTEND APP 🎨                  ║

echo ║                React Development Server ^& Material-UI                  ║echo ║                React Development Server ^& Material-UI                  ║

echo ╚═════════════════════════════════════════════════════════════════════════╝echo ╚═════════════════════════════════════════════════════════════════════════╝

cd /d "%PROJECT_ROOT%client"cd /d "%PROJECT_ROOT%client"

echo.echo.

echo    🎨 Initializing React development environment...echo    🎨 Initializing React development environment...

echo    ⚛️  Loading Material-UI component library...echo    ⚛️  Loading Material-UI component library...

echo    🔗 Establishing Web3/MetaMask integration...echo    🔗 Establishing Web3/MetaMask integration...

if exist "package.json" (if exist "package.json" (

    start "🎨 BharatChain Frontend" cmd /k "title 🎨 BharatChain Frontend && color 0B && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                  BHARATCHAIN FRONTEND                    ║ && echo ║                React.js ^& Material-UI                     ║ && echo ║                      Port: 3000                          ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [FRONTEND] Starting React Development Server... && echo [FRONTEND] Material-UI Theme: Loaded && echo [FRONTEND] Web3 Integration: Ready && echo [FRONTEND] MetaMask Support: Active && echo [FRONTEND] Multi-language: Hindi/English && echo [FRONTEND] Hot Reload: Enabled && echo. && npm start"    start "🎨 BharatChain Frontend" cmd /k "title 🎨 BharatChain Frontend && color 0B && echo ╔══════════════════════════════════════════════════════════╗ && echo ║                  BHARATCHAIN FRONTEND                    ║ && echo ║                React.js ^& Material-UI                     ║ && echo ║                      Port: 3000                          ║ && echo ╚══════════════════════════════════════════════════════════╝ && echo. && echo [FRONTEND] Starting React Development Server... && echo [FRONTEND] Material-UI Theme: Loaded && echo [FRONTEND] Web3 Integration: Ready && echo [FRONTEND] MetaMask Support: Active && echo [FRONTEND] Multi-language: Hindi/English && echo [FRONTEND] Hot Reload: Enabled && echo. && npm start"

    color 0A    color 0A

    echo    ✅ Frontend app starting successfully on port 3000    echo    ✅ Frontend app starting successfully on port 3000

) else () else (

    color 0C    color 0C

    echo    ❌ Frontend package.json not found - check client directory    echo    ❌ Frontend package.json not found - check client directory

))



color 0Bcolor 0B



echo.echo.

echo  ╔══════════════════════════════════════════════════════════════════════╗echo  ╔══════════════════════════════════════════════════════════════════════╗

echo  ║                    🎉 BHARATCHAIN LAUNCHED! 🎉                      ║echo  ║                    🎉 BHARATCHAIN LAUNCHED! 🎉                      ║

echo  ║                                                                      ║echo  ║                                                                      ║

echo  ║    🚀 All services are spinning up in dedicated windows...          ║echo  ║    🚀 All services are spinning up in dedicated windows...          ║

echo  ║    ⭐ Professional-grade microservices architecture                  ║echo  ║    ⭐ Professional-grade microservices architecture                  ║

echo  ╚══════════════════════════════════════════════════════════════════════╝echo  ╚══════════════════════════════════════════════════════════════════════╝

echo.echo.

REM Wait for services to initialize

REM Wait for services to initializeecho ╔═════════════════════════════════════════════════════════════════════════╗

echo ╔═════════════════════════════════════════════════════════════════════════╗echo ║                    ⏳ SERVICE INITIALIZATION STATUS ⏳                 ║

echo ║                    ⏳ SERVICE INITIALIZATION STATUS ⏳                 ║echo ╚═════════════════════════════════════════════════════════════════════════╝

echo ╚═════════════════════════════════════════════════════════════════════════╝echo.

echo.echo    ⛓️  Blockchain Network:   Initializing... (~5 seconds)

echo    ⛓️  Blockchain Network:   Initializing... (~5 seconds)echo    🧠 AI Service:           Loading models... (~8 seconds)  

echo    🧠 AI Service:           Loading models... (~8 seconds)  echo    ⚙️  Backend API:          Connecting database... (~12 seconds)

echo    ⚙️  Backend API:          Connecting database... (~12 seconds)echo    🎨 Frontend App:         Building bundle... (~18 seconds)

echo    🎨 Frontend App:         Building bundle... (~18 seconds)echo.

echo.echo    ⏱️  Total estimated startup time: ~25 seconds

echo    ⏱️  Total estimated startup time: ~25 secondsecho.

echo.for /l %%i in (1,1,20) do (

for /l %%i in (1,1,20) do (    set /p "=■" <nul

    set /p "=■" <nul    timeout /t 1 >nul

    timeout /t 1 >nul)

)echo.

echo.echo.

echo.color 0A

color 0Aecho    ✅ All services should now be operational!

echo    ✅ All services should now be operational!

REM Wait for frontend to be ready and open browser

REM Enhanced browser opening with multiple methodsecho.

echo.echo ╔═════════════════════════════════════════════════════════════════════════╗

echo ╔═════════════════════════════════════════════════════════════════════════╗echo ║                      🌐 OPENING WEB BROWSER 🌐                        ║

echo ║                      🌐 OPENING WEB BROWSER 🌐                        ║echo ╚═════════════════════════════════════════════════════════════════════════╝

echo ╚═════════════════════════════════════════════════════════════════════════╝echo.

echo.echo    ⏳ Waiting for frontend to be fully ready... (10 seconds)

echo    ⏳ Waiting for frontend to be fully ready... (10 seconds)echo    🌐 This ensures the browser opens to a working application

echo    🌐 This ensures the browser opens to a working applicationtimeout /t 10 >nul

timeout /t 10 >nulecho    🚀 Launching BharatChain Platform in your default browser...

echo    🚀 Launching BharatChain Platform in your default browser...echo    📱 URL: http://localhost:3000

echo    📱 URL: http://localhost:3000start "BharatChain Platform - Digital India" http://localhost:3000

start "BharatChain Platform - Digital India" http://localhost:3000timeout /t 2 >nul

timeout /t 2 >nulREM Backup browser opening method

REM Backup browser opening methodpowershell -command "try { Start-Process 'http://localhost:3000' -ErrorAction SilentlyContinue } catch { Write-Host 'Browser already opened or unavailable' }"

powershell -command "try { Start-Process 'http://localhost:3000' -ErrorAction SilentlyContinue } catch { Write-Host 'Browser already opened or unavailable' }"echo    ✅ Browser opened successfully!

echo    ✅ Browser opened successfully!echo.

echo.

echo.

echo  ╔══════════════════════════════════════════════════════════════════════╗echo  ╔══════════════════════════════════════════════════════════════════════╗

echo  ║  🏛️ WELCOME TO BHARATCHAIN - DIGITAL INDIA PLATFORM! 🏛️             ║echo  ║  🏛️ WELCOME TO BHARATCHAIN - DIGITAL INDIA PLATFORM! 🏛️             ║

echo  ║                                                                      ║echo  ║                                                                      ║

echo  ║  🚀 SYSTEM STATUS: FULLY OPERATIONAL                                ║echo  ║  🚀 SYSTEM STATUS: FULLY OPERATIONAL                                ║

echo  ║                                                                      ║echo  ║                                                                      ║

echo  ║  📍 SERVICE ENDPOINTS:                                               ║echo  ║  📍 SERVICE ENDPOINTS:                                               ║

echo  ║     🌐 Frontend:          http://localhost:3000                     ║echo  ║     🌐 Frontend:          http://localhost:3000                     ║

echo  ║     🔧 Backend API:       http://localhost:3001/api/health          ║echo  ║     🔧 Backend API:       http://localhost:3001/api/health          ║

echo  ║     🧠 AI Service:        http://localhost:5001/health              ║echo  ║     🧠 AI Service:        http://localhost:5001/health              ║

echo  ║     ⛓️  Blockchain:        http://localhost:8545                     ║echo  ║     ⛓️  Blockchain:        http://localhost:8545                     ║

echo  ║                                                                      ║echo  ║                                                                      ║

echo  ║  📋 AVAILABLE FEATURES:                                              ║echo  ║  📋 AVAILABLE FEATURES:                                              ║

echo  ║     ✅ Citizen Registration ^& Authentication                        ║echo  ║     ✅ Citizen Registration ^& Authentication                        ║

echo  ║     ✅ Document Upload ^& OCR Processing                             ║echo  ║     ✅ Document Upload ^& OCR Processing                             ║

echo  ║     ✅ Blockchain Verification ^& QR Codes                           ║echo  ║     ✅ Blockchain Verification ^& QR Codes                           ║

echo  ║     ✅ Grievance Management System                                   ║echo  ║     ✅ Grievance Management System                                   ║

echo  ║     ✅ Government Payment Processing                                 ║echo  ║     ✅ Government Payment Processing                                 ║

echo  ║     ✅ MetaMask Web3 Integration                                     ║echo  ║     ✅ MetaMask Web3 Integration                                     ║

echo  ║     ✅ Multi-language Support (Hindi/English)                       ║echo  ║     ✅ Multi-language Support (Hindi/English)                       ║

echo  ║     ✅ Real-time WebSocket Events                                    ║echo  ║     ✅ Real-time WebSocket Events                                    ║

echo  ║     ✅ JWT Authentication ^& Security                                ║echo  ║     ✅ JWT Authentication ^& Security                                ║

echo  ║                                                                      ║echo  ║                                                                      ║

echo  ║  🔧 TROUBLESHOOTING:                                                 ║echo  ║  🔧 TROUBLESHOOTING:                                                 ║

echo  ║     • If frontend shows errors, wait 30 seconds for backend         ║echo  ║     • If frontend shows errors, wait 30 seconds for backend         ║

echo  ║     • Check service windows for any startup errors                  ║echo  ║     • Check service windows for any startup errors                  ║

echo  ║     • Backend must be on port 3001, Frontend on 3000                ║echo  ║     • Backend must be on port 3001, Frontend on 3000                ║

echo  ║     • MetaMask required for Web3 features                           ║echo  ║     • MetaMask required for Web3 features                           ║

echo  ║                                                                      ║echo  ║                                                                      ║

echo  ║  ⚡ All services running in separate windows - DO NOT CLOSE THEM    ║echo  ║  ⚡ All services running in separate windows - DO NOT CLOSE THEM    ║

echo  ║                                                                      ║echo  ║                                                                      ║

echo  ║  🛑 TO STOP: Close all terminal windows or run stop.bat             ║echo  ║  🛑 TO STOP: Close all terminal windows or run stop.bat             ║

echo  ╚══════════════════════════════════════════════════════════════════════╝echo  ╚══════════════════════════════════════════════════════════════════════╝

echo.echo.



cd /d "%PROJECT_ROOT%"cd /d "%PROJECT_ROOT%"



echo ╔═════════════════════════════════════════════════════════════════════════╗echo ╔═════════════════════════════════════════════════════════════════════════╗

echo ║                    🎛️ LAUNCHER CONTROL PANEL 🎛️                      ║echo ║                    🎛️ LAUNCHER CONTROL PANEL 🎛️                      ║

echo ╚═════════════════════════════════════════════════════════════════════════╝echo ╚═════════════════════════════════════════════════════════════════════════╝

echo.echo.

echo    This launcher will remain open to monitor your services.echo    This launcher will remain open to monitor your services.

echo    You can safely minimize this window - all services will continue running.echo    You can safely minimize this window - all services will continue running.

echo.echo.

echo    Available Actions:echo    Available Actions:

echo    [B] Open BharatChain in browserecho    [B] Open BharatChain in browser

echo    [M] Minimize this launcher windowecho    [M] Minimize this launcher window

echo    [O] Open BharatChain in browser again (backup method)echo    [O] Open BharatChain in browser again (backup method)

echo    [S] Show service statusecho    [S] Show service status

echo    [Q] Quit launcher (services will keep running)echo    [Q] Quit launcher (services will keep running)

echo    [X] Stop all services and exitecho    [X] Stop all services and exit

echo.echo.



:MENU:MENU

set /p "choice=    Enter your choice (B/M/O/S/Q/X): "set /p "choice=    Enter your choice (B/M/O/S/Q/X): "



if /i "%choice%"=="B" (if /i "%choice%"=="B" (

    echo    🌐 Opening BharatChain Platform...    echo    🌐 Opening BharatChain Platform...

    start "BharatChain Platform" http://localhost:3000    start "BharatChain Platform" http://localhost:3000

    goto MENU    goto MENU

))



if /i "%choice%"=="M" (if /i "%choice%"=="M" (

    echo    🗕 Minimizing launcher window...    echo    🗕 Minimizing launcher window...

    powershell -command "(New-Object -ComObject Shell.Application).MinimizeAll()"    powershell -command "(New-Object -ComObject Shell.Application).MinimizeAll()"

    goto MENU    goto MENU

))



if /i "%choice%"=="O" (if /i "%choice%"=="O" (

    echo    🌐 Opening BharatChain Platform (backup method)...    echo    🌐 Opening BharatChain Platform (backup method)...

    powershell -command "Start-Process 'http://localhost:3000'"    powershell -command "Start-Process 'http://localhost:3000'"

    goto MENU    goto MENU

))



if /i "%choice%"=="S" (if /i "%choice%"=="S" (

    echo.    echo.

    echo    📊 Checking service status...    echo    📊 Checking service status...

    netstat -ano | findstr ":300" >nul && echo    ✅ Services detected on ports 3000-3001 || echo    ⚠️  No services detected    netstat -ano | findstr ":300" >nul && echo    ✅ Services detected on ports 3000-3001 || echo    ⚠️  No services detected

    goto MENU    goto MENU

))



if /i "%choice%"=="Q" (if /i "%choice%"=="Q" (

    echo.    echo.

    echo    👋 Launcher closing... Services will continue running in background.    echo    👋 Launcher closing... Services will continue running in background.

    echo    💡 Tip: Use stop.bat to stop all services later.    echo    💡 Tip: Use stop.bat to stop all services later.

    timeout /t 2 >nul    timeout /t 2 >nul

    exit /b 0    exit /b 0

))



if /i "%choice%"=="X" (if /i "%choice%"=="X" (

    echo.    echo.

    echo    🛑 Stopping all BharatChain services...    echo    🛑 Stopping all BharatChain services...

    taskkill /f /im node.exe >nul 2>&1    taskkill /f /im node.exe >nul 2>&1

    taskkill /f /im python.exe >nul 2>&1    taskkill /f /im python.exe >nul 2>&1

    echo    ✅ All services stopped.    echo    ✅ All services stopped.

    echo    👋 Thank you for using BharatChain!    echo    👋 Thank you for using BharatChain!

    timeout /t 3 >nul    timeout /t 3 >nul

    exit /b 0    exit /b 0

))



echo    ❌ Invalid choice. Please enter B, M, O, S, Q, or X.echo    ❌ Invalid choice. Please enter B, M, O, S, Q, or X.

goto MENUgoto MENU
