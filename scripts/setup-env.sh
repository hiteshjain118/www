#!/bin/bash

echo "🔧 Environment Setup for Docker Compose"
echo "======================================="

# Create root .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating root .env file for Docker Compose..."
    cat > .env << 'EOF'
# Environment variables for Docker Compose
# Fill in your actual values

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Supabase Configuration (REQUIRED - get from your Supabase project)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# QuickBooks Configuration (REQUIRED - get from Intuit Developer portal)
QBO_CLIENT_ID=
QBO_CLIENT_SECRET=
QBO_AUTH_URL=https://appcenter.intuit.com/connect/oauth2
QBO_REDIRECT_URI=http://localhost:3001/auth/quickbooks/callback

# Application Configuration
CORS_ORIGIN=http://localhost:3001
LOG_LEVEL=debug

# Chat-JS Dockerfile Selection (optional)
# CHAT_JS_DOCKERFILE=Dockerfile      # Production (default)
# CHAT_JS_DOCKERFILE=Dockerfile.dev  # Development
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Create backend .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env file..."
    if [ -f "backend/config.env.example" ]; then
        cp backend/config.env.example backend/.env
        echo "✅ Created backend/.env from example"
    else
        echo "❌ backend/config.env.example not found"
    fi
else
    echo "✅ backend/.env already exists"
fi

# Create chat_js .env file if it doesn't exist
if [ ! -f "chat_js/.env" ]; then
    echo "Creating chat_js/.env file..."
    if [ -f "chat_js/env.example" ]; then
        cp chat_js/env.example chat_js/.env
        echo "✅ Created chat_js/.env from example"
    else
        echo "❌ chat_js/env.example not found"
    fi
else
    echo "✅ chat_js/.env already exists"
fi

echo ""
echo "🚨 IMPORTANT: Please edit the .env files with your actual values:"
echo "   - Root .env: Fill in SUPABASE_* and QBO_* variables"
echo "   - backend/.env: Configure backend-specific settings"
echo "   - chat_js/.env: Configure chat service settings"
echo ""
echo "📝 After editing .env files, you can run:"
echo "   npm run docker:compose:up" 