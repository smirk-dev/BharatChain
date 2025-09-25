@echo off
setlocal enabledelayedexpansion

REM ============================================================================
REM 🇮🇳 BharatChain Digital Identity Platform - Service Stopper 🇮🇳
REM ============================================================================
REM Safely stop all BharatChain services
REM ============================================================================

cls
color 0C
echo.
echo  ╔══════════════════════════════════════════════════════════════════════╗
echo  ║                    🛑 BharatChain Service Stopper 🛑                 ║
echo  ║                  Safely shutting down all services                   ║
echo  ╚══════════════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Checking for running BharatChain services...
echo.

REM Check what's running
set "FOUND_NODE=false"
set "FOUND_PYTHON=false"
set "FOUND_HARDHAT=false"

tasklist /fi "imagename eq node.exe" 2>nul | find /i "node.exe" >nul
if %errorlevel% equ 0 (
    echo 📍 Found Node.js processes (Backend/Frontend/Blockchain)
    set "FOUND_NODE=true"
)

tasklist /fi "imagename eq python.exe" 2>nul | find /i "python.exe" >nul
if %errorlevel% equ 0 (
    echo 📍 Found Python processes (AI Service)
    set "FOUND_PYTHON=true"
)

if "%FOUND_NODE%"=="false" if "%FOUND_PYTHON%"=="false" (
    echo ✅ No BharatChain services currently running
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 0
)

echo.
echo 🛑 STOPPING BHARATCHAIN SERVICES...
echo ────────────────────────────────────────

REM Stop Node.js processes (Backend, Frontend, Hardhat)
if "%FOUND_NODE%"=="true" (
    echo Stopping Backend API, Frontend, and Blockchain services...
    taskkill /f /im node.exe >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Node.js services stopped
    ) else (
        echo ⚠️  Some Node.js processes may have already stopped
    )
)

REM Stop Python processes (AI Service)
if "%FOUND_PYTHON%"=="true" (
    echo Stopping AI Service...
    taskkill /f /im python.exe >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Python AI Service stopped
    ) else (
        echo ⚠️  AI Service may have already stopped
    )
)

REM Wait a moment for processes to fully terminate
echo.
echo ⏳ Waiting for graceful shutdown...
timeout /t 3 >nul

REM Close any remaining BharatChain windows
echo 🪟 Closing service windows...
taskkill /f /fi "WindowTitle eq *BharatChain*" >nul 2>&1

echo.
echo  ╔══════════════════════════════════════════════════════════════════════╗
echo  ║                 ✅ ALL BHARATCHAIN SERVICES STOPPED ✅               ║
echo  ║                                                                      ║
echo  ║  All services have been safely shut down:                           ║
echo  ║  • Backend API (Port 3001)                                          ║
echo  ║  • Frontend React App (Port 3000)                                   ║
echo  ║  • AI Service (Port 5001)                                           ║
echo  ║  • Blockchain Network (Port 8545)                                   ║
echo  ║                                                                      ║
echo  ║  To restart: Run start.bat                                          ║
echo  ╚══════════════════════════════════════════════════════════════════════╝
echo.

echo Press any key to exit...
pause >nul