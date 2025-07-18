#!/bin/bash

# Mile Safe Application Startup Script
# This script ensures proper environment setup and starts the application

echo "🚀 Starting Mile Safe Application..."
echo "📊 System Information:"
echo "   Node.js version: $(node --version)"
echo "   NPM version: $(npm --version)"
echo "   Environment: ${NODE_ENV:-development}"
echo "   Port: ${PORT:-8080}"

# Load environment variables
if [ -f ".env.production" ] && [ "$NODE_ENV" = "production" ]; then
    echo "📄 Loading production environment variables..."
    export $(cat .env.production | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    echo "📄 Loading development environment variables..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Navigate to backend directory
cd backend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in backend directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check for critical dependencies
echo "🔍 Checking dependencies..."
node -e "
try {
    require('express');
    require('cors');
    console.log('✅ Core dependencies available');
} catch (err) {
    console.error('❌ Missing dependencies:', err.message);
    process.exit(1);
}
"

# Start the application
echo "🌟 Starting Mile Safe server..."
exec npm start
