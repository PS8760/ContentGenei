#!/bin/bash

echo "🗄️  MongoDB Setup for LinkoGenei"
echo "================================"
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found"
    echo "   Install from: https://brew.sh"
    exit 1
fi

echo "✅ Homebrew found"
echo ""

# Check if MongoDB is already installed
if brew list mongodb-community@7.0 &> /dev/null; then
    echo "✅ MongoDB is already installed"
else
    echo "📦 Installing MongoDB..."
    brew tap mongodb/brew
    brew install mongodb-community@7.0
    echo "✅ MongoDB installed"
fi

echo ""

# Start MongoDB
echo "🚀 Starting MongoDB..."
brew services start mongodb-community@7.0

sleep 3

# Check if MongoDB is running
if brew services list | grep mongodb-community@7.0 | grep started &> /dev/null; then
    echo "✅ MongoDB is running"
else
    echo "⚠️  MongoDB might not be running"
    echo "   Check with: brew services list"
fi

echo ""

# Check if MongoDB Compass is installed
if brew list --cask mongodb-compass &> /dev/null; then
    echo "✅ MongoDB Compass is already installed"
else
    echo "📦 Installing MongoDB Compass..."
    brew install --cask mongodb-compass
    echo "✅ MongoDB Compass installed"
fi

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Open MongoDB Compass:"
echo "   - Launch from Applications"
echo "   - Or run: open -a 'MongoDB Compass'"
echo ""
echo "2. Connect to MongoDB:"
echo "   - Connection String: mongodb://localhost:27017"
echo "   - Click 'Connect'"
echo ""
echo "3. Create Database:"
echo "   - Click 'Create Database'"
echo "   - Database Name: linkogenei"
echo "   - Collection Name: saved_posts"
echo "   - Click 'Create Database'"
echo ""
echo "4. Create Second Collection:"
echo "   - Select 'linkogenei' database"
echo "   - Click 'Create Collection'"
echo "   - Collection Name: categories"
echo "   - Click 'Create Collection'"
echo ""
echo "5. Restart Backend:"
echo "   - Stop backend (Ctrl+C)"
echo "   - Run: ./start-backend.sh"
echo "   - Look for: 'Connected to MongoDB: linkogenei'"
echo ""
echo "6. Test Extension:"
echo "   - Reload extension in Chrome"
echo "   - Visit Instagram"
echo "   - Click test button"
echo "   - Should save successfully!"
echo ""
echo "📖 For detailed instructions, see: MONGODB_COMPASS_SETUP.md"
echo ""
echo "🚀 Opening MongoDB Compass..."
sleep 2
open -a "MongoDB Compass" 2>/dev/null || echo "   Please open MongoDB Compass manually"
