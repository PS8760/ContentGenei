#!/bin/bash

echo "🔄 Restarting Instagram Analytics..."
echo ""

# Kill existing processes
echo "Stopping existing processes..."
pkill -f "python run.py" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 2

# Start backend
echo "Starting backend..."
cd backend
python run.py &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"
cd ..

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 3

# Start frontend
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "✅ All services started!"
echo ""
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:5173"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
