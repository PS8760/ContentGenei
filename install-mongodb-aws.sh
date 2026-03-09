#!/bin/bash

# Install MongoDB on AWS Ubuntu
# Run this on AWS EC2 instance

set -e

echo "🗄️  Installing MongoDB on AWS Ubuntu..."
echo "=================================================="

# Import MongoDB public GPG key
echo "Step 1: Importing MongoDB GPG key..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Create MongoDB list file
echo "Step 2: Adding MongoDB repository..."
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
echo "Step 3: Updating package database..."
sudo apt-get update

# Install MongoDB
echo "Step 4: Installing MongoDB..."
sudo apt-get install -y mongodb-org

# Start MongoDB
echo "Step 5: Starting MongoDB service..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Check status
echo "Step 6: Checking MongoDB status..."
sudo systemctl status mongod --no-pager

echo ""
echo "✅ MongoDB installed successfully!"
echo ""
echo "MongoDB connection string: mongodb://localhost:27017/"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with: MONGODB_URI=mongodb://localhost:27017/"
echo "2. Restart backend: sudo systemctl restart contentgenei-backend"
echo ""
