@echo off
REM Instagram OAuth Setup Script for Windows
REM This script helps set up the Instagram OAuth integration

echo ==========================================
echo Instagram OAuth Integration Setup
echo ==========================================
echo.

REM Check if we're in the project root
if not exist "backend" (
    echo Error: backend directory not found
    echo Please run this script from the project root directory
    exit /b 1
)
if not exist "frontend" (
    echo Error: frontend directory not found
    echo Please run this script from the project root directory
    exit /b 1
)

echo [OK] Project structure verified
echo.

REM Step 1: Check backend virtual environment
echo Step 1: Checking backend virtual environment...
if exist "backend\venv" (
    echo [OK] Virtual environment found
) else (
    echo [ERROR] Virtual environment not found at backend\venv
    echo Please create it first: cd backend ^&^& python -m venv venv
    exit /b 1
)
echo.

REM Step 2: Run migration
echo Step 2: Running database migration...
cd backend

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Run migration
python migrate_instagram_oauth.py

if %errorlevel% equ 0 (
    echo [OK] Migration completed successfully
) else (
    echo [ERROR] Migration failed
    echo Please check the error messages above
    cd ..
    exit /b 1
)

cd ..
echo.

REM Step 3: Check environment variables
echo Step 3: Checking environment variables...
if exist "backend\.env" (
    echo [OK] .env file found
    
    REM Check if Instagram variables are set
    findstr /C:"INSTAGRAM_APP_ID" backend\.env >nul
    if %errorlevel% equ 0 (
        echo [OK] Instagram environment variables found
    ) else (
        echo [WARNING] Instagram environment variables not found in .env
        echo Please add the following to backend\.env:
        echo.
        echo INSTAGRAM_APP_ID=your_instagram_app_id_here
        echo INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
        echo INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/platforms/instagram/callback
        echo INSTAGRAM_SCOPES=instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages
        echo INSTAGRAM_FRONTEND_URL=http://localhost:5173
        echo.
    )
) else (
    echo [WARNING] .env file not found
    echo Creating from .env.example...
    copy backend\.env.example backend\.env
    echo [OK] Created backend\.env from .env.example
    echo.
    echo Please edit backend\.env and add your Instagram credentials:
    echo - INSTAGRAM_APP_ID
    echo - INSTAGRAM_APP_SECRET
    echo.
)
echo.

REM Step 4: Verify database tables
echo Step 4: Verifying database tables...
if exist "backend\instance\contentgenie_dev.db" (
    echo [OK] Database file found
    echo Note: Use SQLite browser to verify tables were created
    echo Expected tables: instagram_connections, oauth_states
) else (
    echo [WARNING] Database file not found
    echo It will be created when you start the backend server
)
echo.

REM Summary
echo ==========================================
echo Setup Summary
echo ==========================================
echo.
echo [OK] Files created:
echo    - backend/platforms/instagram/ (models, service, controller)
echo    - frontend/src/pages/platforms/InstagramCallback.jsx
echo    - frontend/src/services/platformService.js
echo.
echo [OK] Files modified:
echo    - backend/app.py (blueprint registered)
echo    - backend/.env.example (Instagram variables added)
echo    - frontend/src/App.jsx (callback route added)
echo    - frontend/src/services/api.js (Instagram methods added)
echo    - frontend/src/pages/Onboarding.jsx (OAuth trigger added)
echo.
echo Next Steps:
echo    1. Configure Instagram OAuth credentials in backend\.env
echo    2. Get credentials from: https://developers.facebook.com/
echo    3. Restart backend server: cd backend ^&^& python run.py
echo    4. Start frontend: cd frontend ^&^& npm run dev
echo    5. Test OAuth flow by completing onboarding with Instagram selected
echo.
echo For detailed instructions, see:
echo    INSTAGRAM_OAUTH_IMPLEMENTATION_COMPLETE.md
echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
pause
