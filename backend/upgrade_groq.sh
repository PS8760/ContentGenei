#!/bin/bash

# Upgrade Groq SDK to fix the 'proxies' parameter error

echo "🔧 Upgrading Groq SDK..."

# Activate virtual environment
source venv/bin/activate

# Upgrade Groq package
pip install --upgrade groq

echo "✅ Groq SDK upgraded successfully!"
echo ""
echo "📋 Installed version:"
pip show groq | grep Version

echo ""
echo "🔄 Please restart the backend server for changes to take effect:"
echo "   ./start-backend.sh"
