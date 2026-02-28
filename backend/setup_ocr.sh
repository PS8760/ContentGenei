#!/bin/bash

# OCR Setup and Test Script
# This script helps set up and test the Groq Vision API OCR functionality

set -e  # Exit on error

echo "=================================="
echo "OCR Setup and Test Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo ""
    echo "Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ .env file created${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  Please edit .env and add your GROQ_API_KEY${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
fi

# Check if GROQ_API_KEY is set
source .env
if [ -z "$GROQ_API_KEY" ]; then
    echo -e "${RED}❌ GROQ_API_KEY not set in .env${NC}"
    echo ""
    echo "Please add your Groq API key to .env:"
    echo "GROQ_API_KEY=your_key_here"
    exit 1
fi

echo -e "${GREEN}✅ GROQ_API_KEY found${NC}"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found${NC}"
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
    echo ""
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo -e "${GREEN}✅ Virtual environment activated${NC}"
echo ""

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Run OCR test
echo "=================================="
echo "Running OCR Tests"
echo "=================================="
echo ""

python test_groq_ocr.py

# Check test result
if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo -e "${GREEN}✅ OCR Setup Complete!${NC}"
    echo "=================================="
    echo ""
    echo "Next steps:"
    echo "1. Start the backend server: python run.py"
    echo "2. Test OCR in the Creator page (Summarize tab)"
    echo "3. Upload an image with text"
    echo ""
else
    echo ""
    echo "=================================="
    echo -e "${RED}❌ OCR Tests Failed${NC}"
    echo "=================================="
    echo ""
    echo "Troubleshooting:"
    echo "1. Check your GROQ_API_KEY in .env"
    echo "2. Verify internet connection"
    echo "3. Review error messages above"
    echo ""
    exit 1
fi
