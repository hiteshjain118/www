#!/bin/bash

echo "🐳 Docker Setup Validation Script"
echo "================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Docker
if command_exists docker; then
    echo "✅ Docker is installed"
    docker --version
else
    echo "❌ Docker is not installed"
    echo "   Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose for orchestration (optional)
if command_exists docker-compose; then
    echo "✅ Docker Compose is installed"
    docker-compose --version
elif docker compose version >/dev/null 2>&1; then
    echo "✅ Docker Compose V2 is installed"
    docker compose version
else
    echo "⚠️  Docker Compose not installed (optional for orchestration)"
    echo "   Individual service deployment still available"
fi

# Check if Docker daemon is running
if docker info >/dev/null 2>&1; then
    echo "✅ Docker daemon is running"
else
    echo "❌ Docker daemon is not running"
    echo "   Please start Docker Desktop or the Docker daemon"
    exit 1
fi

# Validate Dockerfiles
echo "📋 Validating Dockerfiles..."
if [ -f "backend/Dockerfile" ]; then
    echo "✅ backend/Dockerfile exists"
else
    echo "❌ backend/Dockerfile not found"
    exit 1
fi

if [ -f "chat_js/Dockerfile" ]; then
    echo "✅ chat_js/Dockerfile exists"
else
    echo "❌ chat_js/Dockerfile not found"
    exit 1
fi

if [ -f "chat_js/Dockerfile.dev" ]; then
    echo "✅ chat_js/Dockerfile.dev exists"
else
    echo "❌ chat_js/Dockerfile.dev not found"
    exit 1
fi

# Validate docker-compose.yml (optional)
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml exists"
    if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
        if docker-compose config >/dev/null 2>&1 || docker compose config >/dev/null 2>&1; then
            echo "✅ docker-compose.yml is valid"
        else
            echo "❌ docker-compose.yml has errors"
            exit 1
        fi
    fi
else
    echo "ℹ️  docker-compose.yml not found (individual deployment mode)"
fi

# Check for environment files
echo "📁 Checking environment files..."
if [ -f "backend/.env" ]; then
    echo "✅ backend/.env exists"
else
    echo "⚠️  backend/.env not found (copy from backend/config.env.example)"
fi

if [ -f "chat_js/.env" ]; then
    echo "✅ chat_js/.env exists"
else
    echo "⚠️  chat_js/.env not found (copy from chat_js/env.example)"
fi

echo ""
echo "🎉 Docker setup validation complete!"
echo "Next steps:"
echo "1. Create .env files if missing"
echo "2. Choose deployment method:"
echo ""
echo "   📦 Individual Services:"
echo "   - Build: npm run docker:build:backend && npm run docker:build:chat"
echo "   - Run: npm run docker:run:backend && npm run docker:run:chat"
echo ""
echo "   🐳 Docker Compose (Orchestrated):"
echo "   - Build & Run: npm run docker:compose:up"
echo "   - Development: npm run docker:compose:up:dev"
echo "   - Background: npm run docker:compose:up:detached"
echo ""
echo "Services will be available at:"
echo "  - Backend: http://localhost:3001"
echo "  - Chat-JS: http://localhost:3004" 