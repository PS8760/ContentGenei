@echo off
echo ==========================================
echo Starting Content Genie Backend
echo ==========================================
echo.

echo Checking Python dependencies...
python -c "import flask; import numpy; import scipy; import sklearn; print('✓ All dependencies installed')" 2>nul
if errorlevel 1 (
    echo ❌ Missing dependencies! Installing...
    pip install Flask Flask-CORS Flask-Migrate Flask-JWT-Extended python-dotenv requests numpy scipy scikit-learn textblob firebase-admin groq bcrypt beautifulsoup4 pymongo pillow validators cryptography
)

echo.
echo Starting Flask server...
echo.
python run.py

pause
