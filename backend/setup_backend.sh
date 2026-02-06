#!/bin/bash

echo "🚀 Setting up ContentGenie Backend"
echo "=================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📦 Installing Python packages..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created from template"
    echo "⚠️  Please update .env file with your actual configuration values"
else
    echo "✅ .env file already exists"
fi

# Initialize database
echo "🗄️  Initializing database..."
python init_db.py

# Make scripts executable
chmod +x setup_backend.sh
chmod +x run.py
chmod +x init_db.py

echo ""
echo "🎉 Backend setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your configuration:"
echo "   - Add OpenAI API key for AI content generation"
echo "   - Configure Firebase credentials path"
echo "   - Set up database URL (if using PostgreSQL)"
echo ""
echo "2. Start the development server:"
echo "   python run.py"
echo "   or"
echo "   python app.py"
echo ""
echo "3. Test the API:"
echo "   curl http://localhost:5000/api/health"
echo ""
echo "🔗 API Endpoints:"
echo "   Health Check: GET /api/health"
echo "   Authentication: /api/auth/*"
echo "   Content: /api/content/*"
echo "   Analytics: /api/analytics/*"
echo ""
echo "📚 Documentation: Check BACKEND_README.md for detailed information"