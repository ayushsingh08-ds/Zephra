@echo off
echo Installing required packages for NASA Space Apps 2025...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

echo Python found. Installing packages...
echo.

REM Change to backend directory and install from there
cd /d "%~dp0backend"
if not exist requirements.txt (
    echo Error: requirements.txt not found in backend folder
    pause
    exit /b 1
)

REM Install required packages
pip install -r requirements.txt

echo.
echo ✅ Installation complete!
echo.
echo Next steps:
echo 1. Run the FastAPI backend: cd backend ^&^& python zephra_api.py
echo 2. Run the frontend: cd frontend ^&^& npm install ^&^& npm run dev
echo 3. Open browser to http://localhost:5173
echo.
pause