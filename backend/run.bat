@echo off
REM FarmVoice Backend Startup Script for Windows

echo Starting FarmVoice Backend...

REM Check if .env exists
if not exist .env (
    echo Error: .env file not found!
    echo Please copy .env.example to .env and fill in your Supabase credentials
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Run the server
echo Starting FastAPI server on http://localhost:8000
uvicorn main:app --reload --port 8000

pause

