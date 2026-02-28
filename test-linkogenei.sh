#!/bin/bash

echo "🧪 Testing LinkoGenei Setup"
echo "============================"
echo ""

# Check if MongoDB is running
echo "1. Checking MongoDB..."
if mongosh --eval "db.version()" --quiet &> /dev/null; then
    echo "   ✅ MongoDB is running"
else
    echo "   ⚠️  MongoDB is not running"
    echo "   Run: ./install-mongodb.sh"
fi

echo ""

# Check if backend dependencies are installed
echo "2. Checking Python dependencies..."
if python3 -c "import pymongo" 2>/dev/null; then
    echo "   ✅ pymongo is installed"
else
    echo "   ⚠️  pymongo is not installed"
    echo "   Run: cd backend && pip install pymongo==4.6.1"
fi

echo ""

# Check if backend is running
echo "3. Checking backend..."
if curl -s http://localhost:5001/api/health &> /dev/null; then
    echo "   ✅ Backend is running on port 5001"
    
    # Test LinkoGenei endpoint
    echo ""
    echo "4. Testing LinkoGenei API..."
    RESPONSE=$(curl -s http://localhost:5001/api/linkogenei/test)
    if echo "$RESPONSE" | grep -q "success"; then
        echo "   ✅ LinkoGenei API is working"
    else
        echo "   ⚠️  LinkoGenei API test failed"
        echo "   Response: $RESPONSE"
    fi
else
    echo "   ⚠️  Backend is not running"
    echo "   Run: ./start-backend.sh"
fi

echo ""

# Check if frontend is running
echo "5. Checking frontend..."
if curl -s http://localhost:5173 &> /dev/null; then
    echo "   ✅ Frontend is running on port 5173"
else
    echo "   ⚠️  Frontend is not running"
    echo "   Run: ./start-frontend.sh"
fi

echo ""

# Check extension files
echo "6. Checking Chrome extension..."
if [ -f "extension/manifest.json" ]; then
    echo "   ✅ Extension manifest found"
    
    if [ -f "extension/icons/icon16.png" ]; then
        echo "   ✅ Extension icons found"
    else
        echo "   ⚠️  Extension icons missing"
    fi
else
    echo "   ⚠️  Extension files not found"
fi

echo ""
echo "============================"
echo "📋 Summary"
echo ""
echo "To start using LinkoGenei:"
echo "1. Start MongoDB (if not running)"
echo "2. Start backend: ./start-backend.sh"
echo "3. Start frontend: ./start-frontend.sh"
echo "4. Load extension in Chrome"
echo "5. Generate token from dashboard"
echo ""
echo "For detailed instructions, see LINKOGENEI_SETUP.md"
