#!/bin/bash

echo "🔍 Testing Frontend-Backend Connection..."
echo ""

# Test backend
echo "Testing Backend (Port 5001)..."
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo "✅ Backend is running on port 5001"
else
    echo "❌ Backend is NOT running on port 5001"
    echo "   Start it with: ./start-backend.sh"
fi

echo ""

# Test frontend
echo "Testing Frontend (Port 5173)..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is running on port 5173"
else
    echo "❌ Frontend is NOT running on port 5173"
    echo "   Start it with: ./start-frontend.sh"
fi

echo ""
echo "📊 Connection Status:"
echo "   Backend:  http://localhost:5001/api"
echo "   Frontend: http://localhost:5173"
