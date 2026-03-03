#!/bin/bash

# Instagram Analytics Setup Script for ContentGenie
# This script helps you set up the Instagram Analytics module

echo "🎨 ContentGenie - Instagram Analytics Setup"
echo "==========================================="
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found"
    echo "Please run this script from the ContentGenie root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env file"
fi

# Check for Instagram credentials
echo ""
echo "📝 Checking Instagram API credentials..."
if grep -q "INSTAGRAM_APP_ID=your-instagram-app-id" backend/.env; then
    echo ""
    echo "⚠️  Instagram credentials not configured!"
    echo ""
    echo "To set up Instagram Analytics, you need:"
    echo "  1. A Facebook Developer Account"
    echo "  2. An Instagram App ID and App Secret"
    echo ""
    echo "📖 Follow the detailed setup guide: INSTAGRAM_SETUP.md"
    echo ""
    read -p "Do you have your Instagram App ID and Secret? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        read -p "Enter your Instagram App ID: " app_id
        read -p "Enter your Instagram App Secret: " app_secret
        
        # Update .env file
        sed -i.bak "s/INSTAGRAM_APP_ID=your-instagram-app-id/INSTAGRAM_APP_ID=$app_id/" backend/.env
        sed -i.bak "s/INSTAGRAM_APP_SECRET=your-instagram-app-secret/INSTAGRAM_APP_SECRET=$app_secret/" backend/.env
        rm backend/.env.bak
        
        echo "✅ Instagram credentials saved to backend/.env"
    else
        echo ""
        echo "📖 Please follow INSTAGRAM_SETUP.md to get your credentials"
        echo "   Then run this script again"
        exit 0
    fi
else
    echo "✅ Instagram credentials already configured"
fi

# Run database migration
echo ""
echo "🗄️  Creating Instagram Analytics database tables..."
cd backend

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

# Run migration
python migrate_instagram_tables.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Instagram Analytics setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Start the backend: cd backend && python run.py"
    echo "  2. Start the frontend: cd frontend && npm run dev"
    echo "  3. Navigate to http://localhost:5173/instagram-analytics"
    echo "  4. Click 'Connect Instagram Account'"
    echo ""
    echo "📖 For detailed instructions, see INSTAGRAM_SETUP.md"
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi
