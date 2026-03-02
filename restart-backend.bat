@echo off
echo ================================================================================
echo RESTARTING BACKEND SERVER
echo ================================================================================
echo.

echo Step 1: Killing any existing Python processes...
taskkill /F /IM python.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Starting backend...
cd backend
start cmd /k "python run.py"

echo.
echo ================================================================================
echo Backend should be starting in a new window...
echo Wait for "Running on http://127.0.0.1:5000"
echo ================================================================================
pause
