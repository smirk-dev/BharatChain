# BharatChain Launcher - Beautiful CLI Interface
# Author: BharatChain Team
# Description: One-command solution to start the entire BharatChain ecosystem

param(
    [string]$Action = "start",
    [switch]$Help,
    [switch]$Status,
    [switch]$Stop,
    [switch]$Logs,
    [switch]$Clean
)

# Beautiful CLI Colors and Formatting
$Colors = @{
    Title = [ConsoleColor]::Cyan
    Success = [ConsoleColor]::Green
    Warning = [ConsoleColor]::Yellow
    Error = [ConsoleColor]::Red
    Info = [ConsoleColor]::Blue
    Highlight = [ConsoleColor]::Magenta
    Service = [ConsoleColor]::White
}

function Write-ColorText {
    param([string]$Text, [ConsoleColor]$Color = [ConsoleColor]::White)
    Write-Host $Text -ForegroundColor $Color
}

function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-ColorText "╔══════════════════════════════════════════════════════════════════════╗" $Colors.Title
    Write-ColorText "║                          🇮🇳 BharatChain 🇮🇳                          ║" $Colors.Title
    Write-ColorText "║                    Digital Identity Platform                         ║" $Colors.Title
    Write-ColorText "║                                                                      ║" $Colors.Title
    Write-ColorText "║  🚀 One Command to Rule Them All - Beautiful CLI Interface 🚀      ║" $Colors.Highlight
    Write-ColorText "╚══════════════════════════════════════════════════════════════════════╝" $Colors.Title
    Write-Host ""
}

function Show-Help {
    Show-Banner
    Write-ColorText "📋 BHARATCHAIN COMMANDS:" $Colors.Info
    Write-Host ""
    Write-ColorText "  .\bharatchain.ps1                    Start all services (default)" $Colors.Service
    Write-ColorText "  .\bharatchain.ps1 -Status            Check services status" $Colors.Service
    Write-ColorText "  .\bharatchain.ps1 -Stop              Stop all services" $Colors.Service
    Write-ColorText "  .\bharatchain.ps1 -Logs              Show service logs" $Colors.Service
    Write-ColorText "  .\bharatchain.ps1 -Clean             Clean and restart" $Colors.Service
    Write-ColorText "  .\bharatchain.ps1 -Help              Show this help" $Colors.Service
    Write-Host ""
    Write-ColorText "🌟 SERVICES:" $Colors.Info
    Write-ColorText "  • Frontend (React)     → http://localhost:3000" $Colors.Success
    Write-ColorText "  • Backend (Node.js)    → http://localhost:3001" $Colors.Success
    Write-ColorText "  • AI Service (Python)  → http://localhost:5001" $Colors.Success
    Write-Host ""
}

function Test-ServiceHealth {
    param([string]$Url, [string]$Name)
    
    try {
        if ($Name -eq "Frontend") {
            $response = Invoke-WebRequest -Uri $Url -Method HEAD -TimeoutSec 3
            return @{ Status = "✅ Running"; Code = $response.StatusCode }
        } else {
            $response = Invoke-RestMethod -Uri $Url -TimeoutSec 3
            return @{ Status = "✅ Running"; Message = $response.status -or $response.message }
        }
    } catch {
        return @{ Status = "❌ Not Running"; Error = $_.Exception.Message }
    }
}

function Show-Status {
    Show-Banner
    Write-ColorText "🔍 CHECKING BHARATCHAIN SERVICES STATUS..." $Colors.Info
    Write-Host ""
    
    # Check Frontend
    Write-ColorText "🎨 Frontend (React):      " -NoNewline $Colors.Service
    $frontend = Test-ServiceHealth "http://localhost:3000" "Frontend"
    Write-ColorText $frontend.Status $(if ($frontend.Status -like "*✅*") { $Colors.Success } else { $Colors.Error })
    
    # Check Backend
    Write-ColorText "⚙️  Backend (Node.js):     " -NoNewline $Colors.Service
    $backend = Test-ServiceHealth "http://localhost:3001/api/health" "Backend"
    Write-ColorText $backend.Status $(if ($backend.Status -like "*✅*") { $Colors.Success } else { $Colors.Error })
    
    # Check AI Service
    Write-ColorText "🧠 AI Service (Python):   " -NoNewline $Colors.Service
    $ai = Test-ServiceHealth "http://localhost:5001/health" "AI"
    Write-ColorText $ai.Status $(if ($ai.Status -like "*✅*") { $Colors.Success } else { $Colors.Error })
    
    Write-Host ""
    
    if ($frontend.Status -like "*✅*" -and $backend.Status -like "*✅*" -and $ai.Status -like "*✅*") {
        Write-ColorText "🎉 ALL SERVICES ARE RUNNING PERFECTLY!" $Colors.Success
        Write-ColorText "🌐 Open: http://localhost:3000" $Colors.Highlight
    } else {
        Write-ColorText "⚠️  Some services need attention. Use '.\bharatchain.ps1' to start them." $Colors.Warning
    }
    Write-Host ""
}

function Stop-AllServices {
    Show-Banner
    Write-ColorText "🛑 STOPPING ALL BHARATCHAIN SERVICES..." $Colors.Warning
    Write-Host ""
    
    Write-ColorText "Terminating Node.js processes..." $Colors.Info
    taskkill /f /im node.exe 2>$null | Out-Null
    
    Write-ColorText "Terminating Python processes..." $Colors.Info
    taskkill /f /im python.exe 2>$null | Out-Null
    
    Start-Sleep -Seconds 2
    Write-ColorText "✅ All services stopped successfully!" $Colors.Success
    Write-Host ""
}

function Start-Service {
    param([string]$Name, [string]$Command, [string]$WorkingDir, [string]$LogFile)
    
    Write-ColorText "🚀 Starting $Name..." $Colors.Info
    
    $processArgs = @{
        FilePath = "powershell.exe"
        ArgumentList = "-NoExit", "-Command", "cd '$WorkingDir'; $Command"
        WindowStyle = "Minimized"
    }
    
    Start-Process @processArgs
    Start-Sleep -Seconds 3
}

function Start-AllServices {
    Show-Banner
    Write-ColorText "🚀 STARTING BHARATCHAIN ECOSYSTEM..." $Colors.Info
    Write-Host ""
    
    # Stop any existing services first
    Write-ColorText "🧹 Cleaning up existing processes..." $Colors.Warning
    taskkill /f /im node.exe 2>$null | Out-Null
    taskkill /f /im python.exe 2>$null | Out-Null
    Start-Sleep -Seconds 2
    
    $projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    
    # Start AI Service
    Write-ColorText "🧠 Starting AI Service (Python - Port 5001)..." $Colors.Service
    $aiDir = Join-Path $projectRoot "ai-service"
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$aiDir'; Write-Host '🧠 BharatChain AI Service' -ForegroundColor Cyan; python enhanced_app.py" -WindowStyle Minimized
    Start-Sleep -Seconds 5
    
    # Start Backend
    Write-ColorText "⚙️  Starting Backend (Node.js - Port 3001)..." $Colors.Service
    $serverDir = Join-Path $projectRoot "server"
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$serverDir'; Write-Host '⚙️ BharatChain Backend Server' -ForegroundColor Green; npm start" -WindowStyle Minimized
    Start-Sleep -Seconds 5
    
    # Start Frontend
    Write-ColorText "🎨 Starting Frontend (React - Port 3000)..." $Colors.Service
    $clientDir = Join-Path $projectRoot "client"
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$clientDir'; Write-Host '🎨 BharatChain Frontend' -ForegroundColor Magenta; npm start" -WindowStyle Minimized
    Start-Sleep -Seconds 8
    
    Write-Host ""
    Write-ColorText "⏳ Waiting for services to initialize..." $Colors.Info
    Write-Host ""
    
    # Progress bar simulation
    for ($i = 1; $i -le 20; $i++) {
        $progress = "█" * $i + "░" * (20 - $i)
        Write-Host "`r🔄 Loading: [$progress] $($i * 5)%" -NoNewline -ForegroundColor $Colors.Highlight
        Start-Sleep -Milliseconds 500
    }
    Write-Host ""
    Write-Host ""
    
    # Check final status
    Start-Sleep -Seconds 3
    Show-Status
    
    if ((Test-ServiceHealth "http://localhost:3000" "Frontend").Status -like "*✅*") {
        Write-ColorText "🎊 SUCCESS! Opening BharatChain in your browser..." $Colors.Success
        Start-Process "http://localhost:3000"
    }
}

function Show-Logs {
    Show-Banner
    Write-ColorText "📋 SERVICE LOGS - Use Ctrl+C to exit log view" $Colors.Info
    Write-Host ""
    
    Write-ColorText "Select log to view:" $Colors.Service
    Write-ColorText "1. All Services Status" $Colors.Info
    Write-ColorText "2. Quick Health Check" $Colors.Info
    Write-ColorText "3. Open Service Windows" $Colors.Info
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1-3)"
    
    switch ($choice) {
        "1" { Show-Status }
        "2" { 
            Write-ColorText "🔍 Quick Health Check..." $Colors.Info
            Show-Status 
        }
        "3" {
            Write-ColorText "🪟 Opening service terminal windows..." $Colors.Info
            # This will show the minimized windows
            Get-Process powershell | Where-Object { $_.MainWindowTitle -like "*BharatChain*" } | ForEach-Object {
                Add-Type -TypeDefinition @"
                    using System;
                    using System.Runtime.InteropServices;
                    public class Win32 {
                        [DllImport("user32.dll")]
                        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
                    }
"@
                [Win32]::ShowWindow($_.MainWindowHandle, 9) # SW_RESTORE
            }
        }
        default { Write-ColorText "Invalid choice" $Colors.Error }
    }
}

function Clean-AndRestart {
    Show-Banner
    Write-ColorText "🧽 CLEAN RESTART - This will stop all services and restart fresh" $Colors.Warning
    Write-Host ""
    
    $confirm = Read-Host "Are you sure? (y/N)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        Stop-AllServices
        Write-ColorText "🔄 Cleaning cache and temporary files..." $Colors.Info
        Start-Sleep -Seconds 2
        Start-AllServices
    } else {
        Write-ColorText "❌ Clean restart cancelled" $Colors.Info
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

if ($Logs) {
    Show-Logs
    return
}

if ($Clean) {
    Clean-AndRestart
    return
}

# Default action - Start all services
Start-AllServices
