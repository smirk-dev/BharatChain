@echo off
echo Setting up BharatChain AI Service...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python 3 is required but not installed. Please install Python 3.8 or higher.
    exit /b 1
)

REM Create virtual environment
echo Creating virtual environment...
cd ai-service
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Download SpaCy model
echo Downloading SpaCy English model...
python -m spacy download en_core_web_sm

echo AI Service setup complete!
echo To start the AI service, run:
echo cd ai-service
echo call venv\Scripts\activate.bat
echo python app.py

pause
