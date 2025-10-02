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

REM Install required packages
pip install requests>=2.31.0
pip install pandas>=2.0.0
pip install numpy>=1.24.0
pip install netCDF4>=1.6.0
pip install xarray>=2023.1.0
pip install matplotlib>=3.7.0
pip install plotly>=5.15.0
pip install folium>=0.14.0
pip install jupyter>=1.0.0
pip install scipy>=1.10.0
pip install scikit-learn>=1.3.0
pip install seaborn>=0.12.0

echo.
echo ✅ Installation complete!
echo.
echo Next steps:
echo 1. Get your NASA Earthdata credentials
echo 2. Edit nasa_data_fetcher.py with your credentials
echo 3. Run: python nasa_data_fetcher.py
echo.
pause