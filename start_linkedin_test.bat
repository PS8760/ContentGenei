@echo off
echo ==========================================
echo LinkedIn Integration - Quick Start
echo ==========================================
echo.

echo Creating LinkedIn database tables...
cd backend
python migrate_linkedin_tables.py
echo.

echo ==========================================
echo Ready to Test LinkedIn Integration!
echo ==========================================
echo.
echo To start testing:
echo.
echo 1. Open a terminal and run:
echo    cd backend
echo    python run.py
echo.
echo 2. Open another terminal and run:
echo    cd frontend
echo    npm run dev
echo.
echo 3. Go to http://localhost:5173/dashboard
echo 4. Click 'Connect LinkedIn'
echo 5. Authorize on LinkedIn
echo 6. View LinkedIn Analytics
echo.
echo Documentation:
echo - LINKEDIN_TESTING_GUIDE.md
echo - LINKEDIN_INTEGRATION_STATUS.md
echo - LINKEDIN_IMPLEMENTATION_COMPLETE.md
echo.
echo ==========================================
pause
