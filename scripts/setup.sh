#!/bin/bash

echo "🇮🇳 Setting up BharatChain - Decentralized Governance Platform"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_status "Node.js version: $(node -v) ✓"
}

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3.8+ is required but not installed."
        exit 1
    fi
    
    print_status "Python version: $(python3 --version) ✓"
}

# Install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    # Root dependencies
    npm install
    
    # Client dependencies
    print_status "Installing client dependencies..."
    cd client && npm install && cd ..
    
    # Server dependencies
    print_status "Installing server dependencies..."
    cd server && npm install && cd ..
    
    # Python ML dependencies
    print_status "Installing Python ML dependencies..."
    pip3 install -r ml-models/requirements.txt
    
    print_status "All dependencies installed successfully ✓"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_warning "Created .env file from example. Please update with your configuration."
    fi
    
    if [ ! -f client/.env ]; then
        cp client/.env.example client/.env
        print_warning "Created client .env file. Please update contract addresses after deployment."
    fi
    
    if [ ! -f server/.env ]; then
        cp server/.env.example server/.env
        print_warning "Created server .env file. Please update database and service configurations."
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Create database if it doesn't exist
    createdb bharatchain 2>/dev/null || print_warning "Database may already exist"
    
    # Run migrations
    cd server && npm run migrate && cd ..
    
    # Run seeds
    cd server && npm run seed && cd ..
    
    print_status "Database setup completed ✓"
}

# Compile smart contracts
compile_contracts() {
    print_status "Compiling smart contracts..."
    
    npx hardhat compile
    
    print_status "Smart contracts compiled successfully ✓"
}

# Deploy contracts to local network
deploy_contracts() {
    print_status "Starting local blockchain and deploying contracts..."
    
    # Start Hardhat node in background
    npx hardhat node &
    HARDHAT_PID=$!
    
    # Wait for node to start
    sleep 5
    
    # Deploy contracts
    npx hardhat run scripts/deploy.js --network localhost
    
    # Stop Hardhat node
    kill $HARDHAT_PID
    
    print_status "Contracts deployed successfully ✓"
}

# Main setup function
main() {
    echo ""
    print_status "Starting BharatChain setup process..."
    echo ""
    
    check_nodejs
    check_python
    install_dependencies
    setup_environment
    setup_database
    compile_contracts
    deploy_contracts
    
    echo ""
    echo "🎉 BharatChain setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update your .env files with the correct configurations"
    echo "2. Start the development environment: npm run dev"
    echo "3. Access the application at http://localhost:3000"
    echo ""
    echo "📚 For more information, check the documentation in ./docs/"
}

# Run main function
main "$@"
