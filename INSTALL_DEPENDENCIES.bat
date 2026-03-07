@echo off
echo ==========================================
echo Installing Backend Dependencies
echo ==========================================
echo.

cd backend

echo Installing core dependencies...
pip install Flask==3.0.0 Flask-CORS==4.0.0 Flask-SQLAlchemy Flask-Migrate Flask-JWT-Extended python-dotenv requests

echo.
echo Installing ML dependencies...
pip install numpy scipy scikit-learn textblob

echo.
echo Installing other dependencies...
pip install firebase-admin groq bcrypt beautifulsoup4 pymongo pillow validators cryptography

echo.
echo ==========================================
echo Testing installation...
echo ==========================================
python -c "import numpy; import scipy; import sklearn; import textblob; print('✓ All ML dependencies installed successfully!')"

echo.
echo ==========================================
echo Installation Complete!
echo ==========================================
echo.
echo Now run: cd backend && python run.py
echo.
pause
