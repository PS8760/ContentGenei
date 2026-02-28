#!/bin/bash

# MongoDB Installation Script for LinkoGenei
# Supports macOS, Linux, and Docker

echo "🔧 LinkoGenei - MongoDB Installation"
echo "===================================="
echo ""

# Detect OS
OS="$(uname -s)"

case "${OS}" in
    Darwin*)
        echo "📱 Detected: macOS"
        echo ""
        echo "Installing MongoDB using Homebrew..."
        
        # Check if Homebrew is installed
        if ! command -v brew &> /dev/null; then
            echo "❌ Homebrew not found. Please install Homebrew first:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
        
        # Install MongoDB
        brew tap mongodb/brew
        brew install mongodb-community@7.0
        
        # Start MongoDB
        brew services start mongodb-community@7.0
        
        echo ""
        echo "✅ MongoDB installed and started!"
        ;;
        
    Linux*)
        echo "🐧 Detected: Linux"
        echo ""
        
        # Check if Docker is available
        if command -v docker &> /dev/null; then
            echo "🐳 Docker found. Installing MongoDB using Docker..."
            
            # Run MongoDB in Docker
            docker run -d \
              --name mongodb \
              -p 27017:27017 \
              -v mongodb_data:/data/db \
              --restart unless-stopped \
              mongo:7.0
            
            echo ""
            echo "✅ MongoDB installed and started in Docker!"
        else
            echo "Installing MongoDB natively..."
            echo "Please follow the instructions for your Linux distribution:"
            echo "https://www.mongodb.com/docs/manual/administration/install-on-linux/"
            exit 1
        fi
        ;;
        
    *)
        echo "❓ Unknown OS: ${OS}"
        echo ""
        echo "Please install MongoDB manually:"
        echo "https://www.mongodb.com/docs/manual/installation/"
        exit 1
        ;;
esac

# Verify installation
echo ""
echo "🔍 Verifying MongoDB installation..."
sleep 2

if command -v mongosh &> /dev/null; then
    VERSION=$(mongosh --version | head -n 1)
    echo "✅ MongoDB Shell: $VERSION"
    
    # Test connection
    if mongosh --eval "db.version()" --quiet &> /dev/null; then
        echo "✅ MongoDB connection: OK"
        echo ""
        echo "🎉 MongoDB is ready for LinkoGenei!"
    else
        echo "⚠️  MongoDB installed but not responding"
        echo "   Try starting it manually"
    fi
else
    echo "⚠️  MongoDB Shell (mongosh) not found"
    echo "   MongoDB may still be working"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Update backend/.env with MongoDB URI"
echo "2. Install Python dependencies: cd backend && pip install pymongo"
echo "3. Start backend: ./start-backend.sh"
echo "4. Start frontend: ./start-frontend.sh"
echo "5. Load Chrome extension from 'extension' folder"
echo ""
echo "📖 See LINKOGENEI_SETUP.md for detailed instructions"
