#!/bin/bash

echo "�� Starting CoralBricks Authentication Service..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the root directory (www/)"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Generate Prisma client if needed
if [ ! -d "backend/node_modules/.prisma" ]; then
    echo "🗄️  Generating Prisma client..."
    cd backend && npm run db:generate && cd ..
fi

echo "✅ All dependencies installed!"
echo ""
echo "🎯 Available commands:"
echo "  npm run dev              - Run both backend and frontend"
echo "  npm run dev:backend      - Run only backend (port 3001)"
echo "  npm run dev:frontend     - Run only frontend (port 3002)"
echo "  npm run build            - Build both projects"
echo "  npm run db:generate      - Generate Prisma client"
echo "  npm run db:push          - Push database schema"
echo ""
echo "🚀 Starting development servers..."
npm run dev
