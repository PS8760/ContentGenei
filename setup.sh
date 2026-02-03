#!/bin/bash

echo "🚀 ContentGenie Setup Script"
echo "=============================="

# Add Homebrew to PATH
echo "📦 Setting up Homebrew PATH..."
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc

# Install Node.js
echo "📦 Installing Node.js and npm..."
brew install node

# Verify installations
echo "✅ Verifying installations..."
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Python version: $(python3 --version)"

# Setup frontend
echo "🎨 Setting up React frontend..."
cd frontend
npm install
cd ..

# Setup backend
echo "🐍 Setting up Flask backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "Frontend: cd frontend && npm run dev"
echo "Backend: cd backend && source venv/bin/activate && python app.py"