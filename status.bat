@echo off
setlocal enabledelayedexpansion

REM ============================================================================
REM 🇮🇳 BharatChain Digital Identity Platform - Status Checker 🇮🇳
REM ============================================================================
REM Check the status of all BharatChain services
REM ============================================================================

cls
color 0B
echo.
echo  ╔══════════════════════════════════════════════════════════════════════╗
echo  ║                    🔍 BharatChain Service Status 🔍                  ║
echo  ║                    Real-time health monitoring                       ║
echo  ╚══════════════════════════════════════════════════════════════════════╝
echo.

echo 🔍 CHECKING SERVICE STATUS...
echo ────────────────────────────────────

echo.
echo 🎨 Frontend (React Development Server)
echo    Expected: http://localhost:3000
curl -s --connect-timeout 5 -I http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo    Status: ✅ RUNNING
    echo    Response: OK
) else (
    echo    Status: ❌ NOT RUNNING
    echo    Issue: Service not responding
)

echo.
echo ⚙️ Backend API (Express Server)
echo    Expected: http://localhost:3001
curl -s --connect-timeout 5 http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo    Status: ✅ RUNNING
    echo    Response: API endpoints accessible
) else (
    echo    Status: ❌ NOT RUNNING
    echo    Issue: API server not responding
)

echo.
echo 🧠 AI Service (OCR ^& Document Processing)
echo    Expected: http://localhost:5001
curl -s --connect-timeout 5 http://localhost:5001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo    Status: ✅ RUNNING
    echo    Response: AI service operational
) else (
    echo    Status: ❌ NOT RUNNING
    echo    Issue: AI service not responding
)

echo.
echo ⛓️ Blockchain Network (Hardhat Local Node)
echo    Expected: http://localhost:8545
curl -s --connect-timeout 5 -X POST -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" http://localhost:8545 >nul 2>&1
if %errorlevel% equ 0 (
    echo    Status: ✅ RUNNING
    echo    Response: Blockchain node active
) else (
    echo    Status: ❌ NOT RUNNING
    echo    Issue: Blockchain node not responding
)

echo.
echo 🖥️  PROCESS STATUS:
echo ────────────────────────────────────
echo.

tasklist /fi "imagename eq node.exe" 2>nul | find /i "node.exe" >nul
if %errorlevel% equ 0 (
    echo Node.js Processes: ✅ FOUND
    echo   - Backend, Frontend, or Blockchain services running
) else (
    echo Node.js Processes: ❌ NOT FOUND
)

tasklist /fi "imagename eq python.exe" 2>nul | find /i "python.exe" >nul
if %errorlevel% equ 0 (
    echo Python Processes:  ✅ FOUND
    echo   - AI service likely running
) else (
    echo Python Processes:  ❌ NOT FOUND
)

echo.
echo 📊 QUICK LINKS:
echo ────────────────────────────────────
echo   🌐 Open Frontend:    http://localhost:3000
echo   🔧 API Documentation: http://localhost:3001/api/docs
echo   🧠 AI Service Health: http://localhost:5001/health
echo   ⛓️  Blockchain RPC:    http://localhost:8545
echo.

echo 🛠️  ACTIONS:
echo ────────────────────────────────────
echo   • To start services: run start.bat
echo   • To stop services:  run stop.bat
echo   • To restart:        run stop.bat then start.bat
echo.

echo Press any key to exit...
pause >nul