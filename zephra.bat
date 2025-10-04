@echo off
echo ========================================
echo    Zephra - Environmental Monitoring
echo ========================================
echo.
echo Starting both Frontend and Backend servers...
echo.
echo Starting Backend (FastAPI)...
start "Zephra Backend" cmd /c "cd /d "%~dp0backend" && python zephra_api.py && pause"
echo.
echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend (React + Vite)...
start "Zephra Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev && pause"
echo.
echo ========================================
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to close this window...
pause >nul