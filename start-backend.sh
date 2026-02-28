#!/bin/bash

echo "🚀 Starting ContentGenie Backend on Port 5001..."
echo ""

cd backend

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "⚠️  Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please create one from .env.example"
    exit 1
fi

# Start the backend
echo "✅ Starting backend server..."
python app.py
