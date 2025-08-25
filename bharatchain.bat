@echo off
cd /d "%~dp0"

REM Check if PowerShell version exists and try it first
if exist "bharatchain.ps1" (
    echo Launching BharatChain with PowerShell...
    powershell -ExecutionPolicy Bypass -File "bharatchain.ps1" %*
    if %errorlevel%==0 exit /b
)

REM Fallback to simple batch version
echo PowerShell version failed, using simple launcher...
call start.bat
pause
