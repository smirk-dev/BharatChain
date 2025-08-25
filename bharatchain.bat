@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "bharatchain.ps1" %*
pause
