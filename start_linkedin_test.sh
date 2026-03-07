#!/bin/bash

echo "=========================================="
echo "LinkedIn Integration - Quick Start"
echo "=========================================="
echo ""

# Check if backend is already running
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "✓ Backend is already running on port 5001"
else
    echo "Starting backend..."
    cd backend
    
    # Create database tables if needed
    echo "Creating LinkedIn tables..."
    python migrate_linkedin_tables.py
    
    # Start backend in background
    python run.py &
    BACKEND_PID=$!
    echo "✓ Backend started (PID: $BACKEND_PID)"
    cd ..
fi

echo ""

# Check if frontend is already running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "✓ Frontend is already running on port 5173"
else
    echo "Starting frontend..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    echo "✓ Frontend started (PID: $FRONTEND_PID)"
    cd ..
fi

echo ""
echo "=========================================="
echo "✅ LinkedIn Integration Ready!"
echo "=========================================="
echo ""
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend:  http://localhost:5001"
echo ""
echo "🧪 Test Steps:"
echo "1. Go to http://localhost:5173/dashboard"
echo "2. Click 'Connect LinkedIn'"
echo "3. Authorize on LinkedIn"
echo "4. View LinkedIn Analytics"
echo ""
echo "📚 Documentation:"
echo "- LINKEDIN_TESTING_GUIDE.md - Testing instructions"
echo "- LINKEDIN_INTEGRATION_STATUS.md - API limitations"
echo "- LINKEDIN_IMPLEMENTATION_COMPLETE.md - Full summary"
echo ""
echo "Press Ctrl+C to stop servers"
echo "=========================================="

# Wait for user interrupt
wait
