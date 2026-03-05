#!/bin/bash

# Instagram OAuth Setup Script
# This script helps set up the Instagram OAuth integration

echo "=========================================="
echo "Instagram OAuth Integration Setup"
echo "=========================================="
echo ""

# Check if we're in the project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✓ Project structure verified"
echo ""

# Step 1: Check backend virtual environment
echo "Step 1: Checking backend virtual environment..."
if [ -d "backend/venv" ]; then
    echo "✓ Virtual environment found"
else
    echo "❌ Virtual environment not found at backend/venv"
    echo "   Please create it first: cd backend && python -m venv venv"
    exit 1
fi
echo ""

# Step 2: Run migration
echo "Step 2: Running database migration..."
cd backend

# Activate virtual environment based on OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    source venv/Scripts/activate
else
    # Linux/Mac
    source venv/bin/activate
fi

# Run migration
python migrate_instagram_oauth.py

if [ $? -eq 0 ]; then
    echo "✓ Migration completed successfully"
else
    echo "❌ Migration failed"
    echo "   Please check the error messages above"
    exit 1
fi

cd ..
echo ""

# Step 3: Check environment variables
echo "Step 3: Checking environment variables..."
if [ -f "backend/.env" ]; then
    echo "✓ .env file found"
    
    # Check if Instagram variables are set
    if grep -q "INSTAGRAM_APP_ID" backend/.env; then
        echo "✓ Instagram environment variables found"
    else
        echo "⚠️  Instagram environment variables not found in .env"
        echo "   Please add the following to backend/.env:"
        echo ""
        echo "   INSTAGRAM_APP_ID=your_instagram_app_id_here"
        echo "   INSTAGRAM_APP_SECRET=your_instagram_app_secret_here"
        echo "   INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/platforms/instagram/callback"
        echo "   INSTAGRAM_SCOPES=instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages"
        echo "   INSTAGRAM_FRONTEND_URL=http://localhost:5173"
        echo ""
    fi
else
    echo "⚠️  .env file not found"
    echo "   Creating from .env.example..."
    cp backend/.env.example backend/.env
    echo "✓ Created backend/.env from .env.example"
    echo ""
    echo "   Please edit backend/.env and add your Instagram credentials:"
    echo "   - INSTAGRAM_APP_ID"
    echo "   - INSTAGRAM_APP_SECRET"
    echo ""
fi
echo ""

# Step 4: Verify database tables
echo "Step 4: Verifying database tables..."
if [ -f "backend/instance/contentgenie_dev.db" ]; then
    echo "✓ Database file found"
    
    # Check if tables exist
    TABLES=$(sqlite3 backend/instance/contentgenie_dev.db ".tables" 2>/dev/null)
    
    if echo "$TABLES" | grep -q "instagram_connections"; then
        echo "✓ instagram_connections table exists"
    else
        echo "❌ instagram_connections table not found"
    fi
    
    if echo "$TABLES" | grep -q "oauth_states"; then
        echo "✓ oauth_states table exists"
    else
        echo "❌ oauth_states table not found"
    fi
else
    echo "⚠️  Database file not found"
    echo "   It will be created when you start the backend server"
fi
echo ""

# Summary
echo "=========================================="
echo "Setup Summary"
echo "=========================================="
echo ""
echo "✅ Files created:"
echo "   - backend/platforms/instagram/ (models, service, controller)"
echo "   - frontend/src/pages/platforms/InstagramCallback.jsx"
echo "   - frontend/src/services/platformService.js"
echo ""
echo "✅ Files modified:"
echo "   - backend/app.py (blueprint registered)"
echo "   - backend/.env.example (Instagram variables added)"
echo "   - frontend/src/App.jsx (callback route added)"
echo "   - frontend/src/services/api.js (Instagram methods added)"
echo "   - frontend/src/pages/Onboarding.jsx (OAuth trigger added)"
echo ""
echo "📋 Next Steps:"
echo "   1. Configure Instagram OAuth credentials in backend/.env"
echo "   2. Get credentials from: https://developers.facebook.com/"
echo "   3. Restart backend server: cd backend && python run.py"
echo "   4. Start frontend: cd frontend && npm run dev"
echo "   5. Test OAuth flow by completing onboarding with Instagram selected"
echo ""
echo "📖 For detailed instructions, see:"
echo "   INSTAGRAM_OAUTH_IMPLEMENTATION_COMPLETE.md"
echo ""
echo "=========================================="
echo "Setup Complete! 🎉"
echo "=========================================="
