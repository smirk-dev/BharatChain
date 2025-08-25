#!/bin/bash

echo "Setting up BharatChain AI Service..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Create virtual environment
echo "Creating virtual environment..."
cd ai-service
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Download SpaCy model
echo "Downloading SpaCy English model..."
python -m spacy download en_core_web_sm

echo "AI Service setup complete!"
echo "To start the AI service, run:"
echo "cd ai-service"
echo "source venv/bin/activate  # or venv\\Scripts\\activate on Windows"
echo "python app.py"
