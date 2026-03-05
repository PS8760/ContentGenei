@echo off
echo ================================================================================
echo RESTARTING BACKEND WITH NEW CODE
echo ================================================================================
echo.

echo Step 1: Killing all Python processes...
taskkill /F /IM python.exe /T 2>nul
timeout /t 3 /nobreak >nul

echo.
echo Step 2: Starting backend server...
cd backend
python run.py

pause
