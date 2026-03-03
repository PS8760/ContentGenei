#!/bin/bash

echo "=== Installing Advanced Analytics Dependencies ==="
echo ""

# Install Python packages
echo "Installing pandas, numpy, scikit-learn, textblob..."
pip install pandas==2.1.4 numpy==1.26.2 scikit-learn==1.3.2 textblob==0.17.1

# Download TextBlob corpora
echo ""
echo "Downloading TextBlob corpora..."
python -m textblob.download_corpora

echo ""
echo "✅ Advanced analytics dependencies installed!"
echo ""
echo "New features available:"
echo "  - Enhanced dashboard metrics"
echo "  - Caption length analysis"
echo "  - Posting time heatmap"
echo "  - Content format analysis"
echo "  - Sentiment analysis"
echo "  - ML engagement predictions"
echo "  - Optimal posting time suggestions"
echo ""
echo "Restart backend: python run.py"
