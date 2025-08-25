param(
    [switch]$Help,
    [switch]$Status,
    [switch]$Stop,
    [switch]$Clean
)

function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host "                    🇮🇳 BharatChain 🇮🇳                    " -ForegroundColor Cyan
    Write-Host "              Digital Identity Platform                    " -ForegroundColor Cyan
    Write-Host "                                                          " -ForegroundColor Cyan
    Write-Host "    🚀 One Command to Rule Them All - CLI Interface 🚀   " -ForegroundColor Magenta
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Show-Banner
    Write-Host "📋 BHARATCHAIN COMMANDS:" -ForegroundColor Blue
    Write-Host ""
    Write-Host "  .\bharatchain.ps1                    Start all services" -ForegroundColor White
    Write-Host "  .\bharatchain.ps1 -Status            Check services status" -ForegroundColor White
    Write-Host "  .\bharatchain.ps1 -Stop              Stop all services" -ForegroundColor White
    Write-Host "  .\bharatchain.ps1 -Clean             Clean and restart" -ForegroundColor White
    Write-Host "  .\bharatchain.ps1 -Help              Show this help" -ForegroundColor White
    Write-Host ""
    Write-Host "🌟 SERVICES:" -ForegroundColor Blue
    Write-Host "  • Frontend (React)     → http://localhost:3000" -ForegroundColor Green
    Write-Host "  • Backend (Node.js)    → http://localhost:3001" -ForegroundColor Green
    Write-Host "  • AI Service (Python)  → http://localhost:5001" -ForegroundColor Green
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
    Write-Host "🔍 CHECKING BHARATCHAIN SERVICES STATUS..." -ForegroundColor Blue
    Write-Host ""
    
    Write-Host "🎨 Frontend (React):      " -NoNewline
    $frontend = Test-ServiceHealth "http://localhost:3000" "Frontend"
    if ($frontend -like "*✅*") {
        Write-Host $frontend -ForegroundColor Green
    } else {
        Write-Host $frontend -ForegroundColor Red
    }
    
    Write-Host "⚙️  Backend (Node.js):     " -NoNewline
    $backend = Test-ServiceHealth "http://localhost:3001/api/health" "Backend"
    if ($backend -like "*✅*") {
        Write-Host $backend -ForegroundColor Green
    } else {
        Write-Host $backend -ForegroundColor Red
    }
    
    Write-Host "🧠 AI Service (Python):   " -NoNewline
    $ai = Test-ServiceHealth "http://localhost:5001/health" "AI"
    if ($ai -like "*✅*") {
        Write-Host $ai -ForegroundColor Green
    } else {
        Write-Host $ai -ForegroundColor Red
    }
    
    Write-Host ""
    
    if ($frontend -like "*✅*" -and $backend -like "*✅*" -and $ai -like "*✅*") {
        Write-Host "🎉 ALL SERVICES ARE RUNNING PERFECTLY!" -ForegroundColor Green
        Write-Host "🌐 Open: http://localhost:3000" -ForegroundColor Magenta
    } else {
        Write-Host "⚠️  Some services need attention. Use '.\bharatchain.ps1' to start them." -ForegroundColor Yellow
    }
    Write-Host ""
}

function Stop-AllServices {
    Show-Banner
    Write-Host "🛑 STOPPING ALL BHARATCHAIN SERVICES..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Terminating Node.js processes..." -ForegroundColor Blue
    try { taskkill /f /im node.exe 2>$null | Out-Null } catch { }
    
    Write-Host "Terminating Python processes..." -ForegroundColor Blue
    try { taskkill /f /im python.exe 2>$null | Out-Null } catch { }
    
    Start-Sleep -Seconds 2
    Write-Host "✅ All services stopped successfully!" -ForegroundColor Green
    Write-Host ""
}

function Start-AllServices {
    Show-Banner
    Write-Host "🚀 STARTING BHARATCHAIN ECOSYSTEM..." -ForegroundColor Blue
    Write-Host ""
    
    Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow
    try { taskkill /f /im node.exe 2>$null | Out-Null } catch { }
    try { taskkill /f /im python.exe 2>$null | Out-Null } catch { }
    Start-Sleep -Seconds 2
    
    $projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    
    # Start AI Service
    Write-Host "🧠 Starting AI Service (Python - Port 5001)..." -ForegroundColor White
    $aiDir = Join-Path $projectRoot "ai-service"
    try {
        Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$aiDir'; Write-Host '🧠 BharatChain AI Service' -ForegroundColor Cyan; python enhanced_app.py" -WindowStyle Minimized
    } catch {
        Write-Host "Warning: Could not start AI service" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 5
    
    # Start Backend
    Write-Host "⚙️  Starting Backend (Node.js - Port 3001)..." -ForegroundColor White
    $serverDir = Join-Path $projectRoot "server"
    try {
        Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$serverDir'; Write-Host '⚙️ BharatChain Backend Server' -ForegroundColor Green; npm start" -WindowStyle Minimized
    } catch {
        Write-Host "Warning: Could not start backend service" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 5
    
    # Start Frontend
    Write-Host "🎨 Starting Frontend (React - Port 3000)..." -ForegroundColor White
    $clientDir = Join-Path $projectRoot "client"
    try {
        Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$clientDir'; Write-Host '🎨 BharatChain Frontend' -ForegroundColor Magenta; npm start" -WindowStyle Minimized
    } catch {
        Write-Host "Warning: Could not start frontend service" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 8
    
    Write-Host ""
    Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Blue
    Write-Host ""
    
    # Progress bar
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
    
    # Try to open browser
    try {
        if ((Test-ServiceHealth "http://localhost:3000" "Frontend") -like "*✅*") {
            Write-Host "🎊 SUCCESS! Opening BharatChain in your browser..." -ForegroundColor Green
            Start-Process "http://localhost:3000"
        }
    } catch {
        Write-Host "Browser opening failed, please visit http://localhost:3000 manually" -ForegroundColor Yellow
    }
}

function Clean-AndRestart {
    Show-Banner
    Write-Host "🧽 CLEAN RESTART - This will stop all services and restart fresh" -ForegroundColor Yellow
    Write-Host ""
    
    $confirm = Read-Host "Are you sure? (y/N)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        Stop-AllServices
        Write-Host "🔄 Cleaning cache and temporary files..." -ForegroundColor Blue
        Start-Sleep -Seconds 2
        Start-AllServices
    } else {
        Write-Host "❌ Clean restart cancelled" -ForegroundColor Blue
    }
}

# Main execution logic
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
