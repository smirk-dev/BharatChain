#!/bin/bash

# BharatChain Setup Script
echo "🇮🇳 BharatChain - Digital Governance Platform Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_status "Node.js version check passed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_status "npm version: $(npm --version)"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before starting the application"
else
    print_status ".env file already exists"
fi

# Install root dependencies
print_status "Installing root dependencies..."
npm install

# Install server dependencies
print_status "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies  
print_status "Installing client dependencies..."
cd client
npm install
cd ..

# Create necessary directories
print_status "Creating project directories..."
mkdir -p database
mkdir -p deployments
mkdir -p uploads
mkdir -p logs

# Set up database directory permissions
chmod 755 database
chmod 755 uploads

print_status "Setup completed successfully!"
echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. Edit .env file with your configuration"
echo "2. Start local blockchain: npm run node"
echo "3. Deploy contracts: npm run deploy"  
echo "4. Start development: npm run dev"
echo ""
echo "📱 Application URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001" 
echo "Blockchain: http://localhost:8545"
echo ""
echo "📚 Documentation: README.md"
echo "🐛 Issues: GitHub Issues"
echo ""
print_status "BharatChain setup complete! 🎉"
