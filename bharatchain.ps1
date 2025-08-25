# BharatChain Launcher - Beautiful CLI Interface
# Simple and reliable one-command solution

param(
    [string]$Action = "start",
    [switch]$Help,
    [switch]$Status,
    [switch]$Stop,
    [switch]$Clean
)

function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    
    switch ($Color) {
        "Red" { Write-Host $Text -ForegroundColor Red }
        "Green" { Write-Host $Text -ForegroundColor Green }
        "Yellow" { Write-Host $Text -ForegroundColor Yellow }
        "Blue" { Write-Host $Text -ForegroundColor Blue }
        "Cyan" { Write-Host $Text -ForegroundColor Cyan }
        "Magenta" { Write-Host $Text -ForegroundColor Magenta }
        default { Write-Host $Text -ForegroundColor White }
    }
}

function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-ColorText "=================================================================" "Cyan"
    Write-ColorText "                    🇮🇳 BharatChain 🇮🇳                    " "Cyan"
    Write-ColorText "              Digital Identity Platform                    " "Cyan"
    Write-ColorText "                                                          " "Cyan"
    Write-ColorText "    🚀 One Command to Rule Them All - CLI Interface 🚀   " "Magenta"
    Write-ColorText "=================================================================" "Cyan"
    Write-Host ""
}

function Show-Help {
    Show-Banner
    Write-ColorText "📋 BHARATCHAIN COMMANDS:" "Blue"
    Write-Host ""
    Write-ColorText "  .\bharatchain.ps1                    Start all services" "White"
    Write-ColorText "  .\bharatchain.ps1 -Status            Check services status" "White"
    Write-ColorText "  .\bharatchain.ps1 -Stop              Stop all services" "White"
    Write-ColorText "  .\bharatchain.ps1 -Clean             Clean and restart" "White"
    Write-ColorText "  .\bharatchain.ps1 -Help              Show this help" "White"
    Write-Host ""
    Write-ColorText "🌟 SERVICES:" "Blue"
    Write-ColorText "  • Frontend (React)     → http://localhost:3000" "Green"
    Write-ColorText "  • Backend (Node.js)    → http://localhost:3001" "Green"
    Write-ColorText "  • AI Service (Python)  → http://localhost:5001" "Green"
    Write-Host ""
}

function Test-ServiceHealth {
    param([string]$Url, [string]$Name)
    
    try {
        if ($Name -eq "Frontend") {
            $response = Invoke-WebRequest -Uri $Url -Method HEAD -TimeoutSec 3
            return "✅ Running"
        } else {
            $response = Invoke-RestMethod -Uri $Url -TimeoutSec 3
            return "✅ Running"
        }
    } catch {
        return "❌ Not Running"
    }
}

function Show-Status {
    Show-Banner
    Write-ColorText "🔍 CHECKING BHARATCHAIN SERVICES STATUS..." "Blue"
    Write-Host ""
    
    Write-Host "🎨 Frontend (React):      " -NoNewline
    $frontend = Test-ServiceHealth "http://localhost:3000" "Frontend"
    if ($frontend -like "*✅*") {
        Write-ColorText $frontend "Green"
    } else {
        Write-ColorText $frontend "Red"
    }
    
    Write-Host "⚙️  Backend (Node.js):     " -NoNewline
    $backend = Test-ServiceHealth "http://localhost:3001/api/health" "Backend"
    if ($backend -like "*✅*") {
        Write-ColorText $backend "Green"
    } else {
        Write-ColorText $backend "Red"
    }
    
    Write-Host "🧠 AI Service (Python):   " -NoNewline
    $ai = Test-ServiceHealth "http://localhost:5001/health" "AI"
    if ($ai -like "*✅*") {
        Write-ColorText $ai "Green"
    } else {
        Write-ColorText $ai "Red"
    }
    
    Write-Host ""
    
    if ($frontend -like "*✅*" -and $backend -like "*✅*" -and $ai -like "*✅*") {
        Write-ColorText "🎉 ALL SERVICES ARE RUNNING PERFECTLY!" "Green"
        Write-ColorText "🌐 Open: http://localhost:3000" "Magenta"
    } else {
        Write-ColorText "⚠️  Some services need attention. Use '.\bharatchain.ps1' to start them." "Yellow"
    }
    Write-Host ""
}

function Stop-AllServices {
    Show-Banner
    Write-ColorText "🛑 STOPPING ALL BHARATCHAIN SERVICES..." "Yellow"
    Write-Host ""
    
    Write-ColorText "Terminating Node.js processes..." "Blue"
    taskkill /f /im node.exe 2>$null | Out-Null
    
    Write-ColorText "Terminating Python processes..." "Blue"
    taskkill /f /im python.exe 2>$null | Out-Null
    
    Start-Sleep -Seconds 2
    Write-ColorText "✅ All services stopped successfully!" "Green"
    Write-Host ""
}

function Start-AllServices {
    Show-Banner
    Write-ColorText "🚀 STARTING BHARATCHAIN ECOSYSTEM..." "Blue"
    Write-Host ""
    
    # Stop any existing services first
    Write-ColorText "🧹 Cleaning up existing processes..." "Yellow"
    taskkill /f /im node.exe 2>$null | Out-Null
    taskkill /f /im python.exe 2>$null | Out-Null
    Start-Sleep -Seconds 2
    
    $projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    
    # Start AI Service
    Write-ColorText "🧠 Starting AI Service (Python - Port 5001)..." "White"
    $aiDir = Join-Path $projectRoot "ai-service"
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$aiDir'; Write-Host '🧠 BharatChain AI Service' -ForegroundColor Cyan; python enhanced_app.py" -WindowStyle Minimized
    Start-Sleep -Seconds 5
    
    # Start Backend
    Write-ColorText "⚙️  Starting Backend (Node.js - Port 3001)..." "White"
    $serverDir = Join-Path $projectRoot "server"
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$serverDir'; Write-Host '⚙️ BharatChain Backend Server' -ForegroundColor Green; npm start" -WindowStyle Minimized
    Start-Sleep -Seconds 5
    
    # Start Frontend
    Write-ColorText "🎨 Starting Frontend (React - Port 3000)..." "White"
    $clientDir = Join-Path $projectRoot "client"
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$clientDir'; Write-Host '🎨 BharatChain Frontend' -ForegroundColor Magenta; npm start" -WindowStyle Minimized
    Start-Sleep -Seconds 8
    
    Write-Host ""
    Write-ColorText "⏳ Waiting for services to initialize..." "Blue"
    Write-Host ""
    
    # Progress bar simulation
    for ($i = 1; $i -le 20; $i++) {
        $progress = "█" * $i + "░" * (20 - $i)
        Write-Host "`r🔄 Loading: [$progress] $($i * 5)%" -NoNewline -ForegroundColor Magenta
        Start-Sleep -Milliseconds 500
    }
    Write-Host ""
    Write-Host ""
    
    # Check final status
    Start-Sleep -Seconds 3
    Show-Status
    
    if ((Test-ServiceHealth "http://localhost:3000" "Frontend") -like "*✅*") {
        Write-ColorText "🎊 SUCCESS! Opening BharatChain in your browser..." "Green"
        Start-Process "http://localhost:3000"
    }
}

function Clean-AndRestart {
    Show-Banner
    Write-ColorText "🧽 CLEAN RESTART - This will stop all services and restart fresh" "Yellow"
    Write-Host ""
    
    $confirm = Read-Host "Are you sure? (y/N)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        Stop-AllServices
        Write-ColorText "🔄 Cleaning cache and temporary files..." "Blue"
        Start-Sleep -Seconds 2
        Start-AllServices
    } else {
        Write-ColorText "❌ Clean restart cancelled" "Blue"
    }
}

# Main Script Logic
if ($Help) {
    Show-Help
    return
}

if ($Status) {
    Show-Status
    return
}

if ($Stop) {
    Stop-AllServices
    return
}

if ($Clean) {
    Clean-AndRestart
    return
}

# Default action - Start all services
Start-AllServices
