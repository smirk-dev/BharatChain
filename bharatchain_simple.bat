@echo off
cls
echo.
echo =================================================================
echo                     🇮🇳 BharatChain 🇮🇳                    
echo               Digital Identity Platform                    
echo                                                          
echo     🚀 One Command to Rule Them All - CLI Interface 🚀   
echo =================================================================
echo.

if "%1"=="help" goto help
if "%1"=="status" goto status
if "%1"=="stop" goto stop
if "%1"=="clean" goto clean

:start
echo 🚀 STARTING BHARATCHAIN ECOSYSTEM...
echo.
echo 🧹 Cleaning up existing processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
timeout /t 2 >nul

echo 🧠 Starting AI Service (Python - Port 5001)...
cd /d "%~dp0\ai-service"
start "🧠 BharatChain AI Service" cmd /k "python enhanced_app.py"
cd /d "%~dp0"
timeout /t 5 >nul

echo ⚙️  Starting Backend (Node.js - Port 3001)...
cd /d "%~dp0\server"
start "⚙️ BharatChain Backend" cmd /k "npm start"
cd /d "%~dp0"
timeout /t 5 >nul

echo 🎨 Starting Frontend (React - Port 3000)...
cd /d "%~dp0\client"
start "🎨 BharatChain Frontend" cmd /k "npm start"
cd /d "%~dp0"
timeout /t 8 >nul

echo.
echo ⏳ Waiting for services to initialize...
echo.
echo 🔄 Loading: [████████████████████] 100%%
timeout /t 5 >nul

echo.
echo 🔍 CHECKING BHARATCHAIN SERVICES STATUS...
echo.

REM Check if services are running
echo 🎨 Frontend (React):      
curl -s -I http://localhost:3000 >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Running
) else (
    echo ❌ Not Running
)

echo ⚙️  Backend (Node.js):     
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Running
) else (
    echo ❌ Not Running
)

echo 🧠 AI Service (Python):   
curl -s http://localhost:5001/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Running
) else (
    echo ❌ Not Running
)

echo.
echo 🎊 BharatChain services are starting up!
echo 🌐 Opening browser to http://localhost:3000
start http://localhost:3000

echo.
echo Press any key to exit...
pause >nul
exit /b

:help
echo.
echo 📋 BHARATCHAIN COMMANDS:
echo.
echo   bharatchain.bat              Start all services
echo   bharatchain.bat help         Show this help
echo   bharatchain.bat status       Check services status
echo   bharatchain.bat stop         Stop all services
echo   bharatchain.bat clean        Clean and restart
echo.
echo 🌟 SERVICES:
echo   • Frontend (React)     → http://localhost:3000
echo   • Backend (Node.js)    → http://localhost:3001
echo   • AI Service (Python)  → http://localhost:5001
echo.
pause
exit /b

:status
echo.
echo 🔍 CHECKING BHARATCHAIN SERVICES STATUS...
echo.

echo 🎨 Frontend (React):      
curl -s -I http://localhost:3000 >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Running
) else (
    echo ❌ Not Running
)

echo ⚙️  Backend (Node.js):     
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Running
) else (
    echo ❌ Not Running
)

echo 🧠 AI Service (Python):   
curl -s http://localhost:5001/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Running
) else (
    echo ❌ Not Running
)

echo.
pause
exit /b

:stop
echo.
echo 🛑 STOPPING ALL BHARATCHAIN SERVICES...
echo.
echo Terminating Node.js processes...
taskkill /f /im node.exe >nul 2>&1
echo Terminating Python processes...
taskkill /f /im python.exe >nul 2>&1
timeout /t 2 >nul
echo ✅ All services stopped successfully!
echo.
pause
exit /b

:clean
echo.
echo 🧽 CLEAN RESTART - This will stop all services and restart fresh
echo.
set /p confirm="Are you sure? (y/N): "
if /i "%confirm%"=="y" (
    call :stop
    echo 🔄 Cleaning cache and temporary files...
    timeout /t 2 >nul
    call :start
) else (
    echo ❌ Clean restart cancelled
    pause
)
exit /b
