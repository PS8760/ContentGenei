#!/bin/bash

echo "🚀 Starting ContentGenie Frontend on Port 5173..."
echo ""

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Installing dependencies..."
    npm install
fi

# Start the frontend
echo "✅ Starting frontend server..."
npm run dev
