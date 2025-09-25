@echo off
echo Starting Hardhat Blockchain...
echo ================================

REM Start Hardhat node in the background
start "Hardhat Node" /MIN npx hardhat node

REM Wait for Hardhat to start
echo Waiting for Hardhat to start...
timeout /t 5 /nobreak > nul

REM Deploy contracts
echo.
echo Deploying contracts...
npx hardhat run scripts/deploy.js --network localhost

echo.
echo ================================
echo Blockchain started and contracts deployed!
echo.
echo Network: http://127.0.0.1:8545
echo.
echo Contract addresses have been saved to deployments/localhost/
echo.
pause
