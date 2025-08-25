#!/bin/bash

# BharatChain Launcher for Linux/MacOS
# Beautiful CLI Interface for starting the entire ecosystem

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

show_banner() {
    clear
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                          🇮🇳 BharatChain 🇮🇳                          ║${NC}"
    echo -e "${CYAN}║                    Digital Identity Platform                         ║${NC}"
    echo -e "${CYAN}║                                                                      ║${NC}"
    echo -e "${PURPLE}║  🚀 One Command to Rule Them All - Beautiful CLI Interface 🚀      ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

show_help() {
    show_banner
    echo -e "${BLUE}📋 BHARATCHAIN COMMANDS:${NC}"
    echo ""
    echo -e "${WHITE}  ./bharatchain.sh                    Start all services (default)${NC}"
    echo -e "${WHITE}  ./bharatchain.sh status             Check services status${NC}"
    echo -e "${WHITE}  ./bharatchain.sh stop               Stop all services${NC}"
    echo -e "${WHITE}  ./bharatchain.sh logs               Show service logs${NC}"
    echo -e "${WHITE}  ./bharatchain.sh clean              Clean and restart${NC}"
    echo -e "${WHITE}  ./bharatchain.sh help               Show this help${NC}"
    echo ""
    echo -e "${BLUE}🌟 SERVICES:${NC}"
    echo -e "${GREEN}  • Frontend (React)     → http://localhost:3000${NC}"
    echo -e "${GREEN}  • Backend (Node.js)    → http://localhost:3001${NC}"
    echo -e "${GREEN}  • AI Service (Python)  → http://localhost:5001${NC}"
    echo ""
}

check_service() {
    local url=$1
    local name=$2
    
    if curl -s --head "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC}"
    else
        echo -e "${RED}❌ Not Running${NC}"
    fi
}

show_status() {
    show_banner
    echo -e "${BLUE}🔍 CHECKING BHARATCHAIN SERVICES STATUS...${NC}"
    echo ""
    
    echo -ne "${WHITE}🎨 Frontend (React):      ${NC}"
    check_service "http://localhost:3000" "Frontend"
    
    echo -ne "${WHITE}⚙️  Backend (Node.js):     ${NC}"
    check_service "http://localhost:3001/api/health" "Backend"
    
    echo -ne "${WHITE}🧠 AI Service (Python):   ${NC}"
    check_service "http://localhost:5001/health" "AI"
    
    echo ""
}

stop_services() {
    show_banner
    echo -e "${YELLOW}🛑 STOPPING ALL BHARATCHAIN SERVICES...${NC}"
    echo ""
    
    echo -e "${BLUE}Terminating processes...${NC}"
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    pkill -f "python.*app.py" 2>/dev/null || true
    pkill -f "enhanced_app.py" 2>/dev/null || true
    
    sleep 2
    echo -e "${GREEN}✅ All services stopped successfully!${NC}"
    echo ""
}

start_services() {
    show_banner
    echo -e "${BLUE}🚀 STARTING BHARATCHAIN ECOSYSTEM...${NC}"
    echo ""
    
    # Stop existing services
    echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    pkill -f "python.*app.py" 2>/dev/null || true
    pkill -f "enhanced_app.py" 2>/dev/null || true
    sleep 2
    
    # Start AI Service
    echo -e "${WHITE}🧠 Starting AI Service (Python - Port 5001)...${NC}"
    cd ai-service
    nohup python enhanced_app.py > ../logs/ai-service.log 2>&1 &
    cd ..
    sleep 3
    
    # Start Backend
    echo -e "${WHITE}⚙️  Starting Backend (Node.js - Port 3001)...${NC}"
    cd server
    nohup npm start > ../logs/backend.log 2>&1 &
    cd ..
    sleep 3
    
    # Start Frontend
    echo -e "${WHITE}🎨 Starting Frontend (React - Port 3000)...${NC}"
    cd client
    nohup npm start > ../logs/frontend.log 2>&1 &
    cd ..
    sleep 5
    
    echo ""
    echo -e "${BLUE}⏳ Waiting for services to initialize...${NC}"
    echo ""
    
    # Progress bar
    for i in {1..20}; do
        printf "\r${PURPLE}🔄 Loading: ["
        for j in $(seq 1 $i); do printf "█"; done
        for j in $(seq $((i+1)) 20); do printf "░"; done
        printf "] $((i*5))%%${NC}"
        sleep 0.5
    done
    echo ""
    echo ""
    
    sleep 3
    show_status
    
    echo -e "${GREEN}🎊 BharatChain is ready! Opening in browser...${NC}"
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open > /dev/null; then
        open http://localhost:3000
    fi
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Parse command line arguments
case "${1:-start}" in
    "help"|"-h"|"--help")
        show_help
        ;;
    "status"|"-s"|"--status")
        show_status
        ;;
    "stop"|"--stop")
        stop_services
        ;;
    "logs"|"-l"|"--logs")
        show_banner
        echo -e "${BLUE}📋 SERVICE LOGS:${NC}"
        echo ""
        echo "1. AI Service Log"
        echo "2. Backend Log"
        echo "3. Frontend Log"
        echo ""
        read -p "Select log (1-3): " choice
        case $choice in
            1) tail -f logs/ai-service.log ;;
            2) tail -f logs/backend.log ;;
            3) tail -f logs/frontend.log ;;
            *) echo "Invalid choice" ;;
        esac
        ;;
    "clean"|"--clean")
        stop_services
        echo -e "${BLUE}🔄 Cleaning cache and temporary files...${NC}"
        sleep 2
        start_services
        ;;
    "start"|*)
        start_services
        ;;
esac
