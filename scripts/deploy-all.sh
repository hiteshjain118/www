#!/bin/bash

# Deploy All Coral Bricks Services to Google Cloud
# This script orchestrates the deployment of backend and chat services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT}"
REGION="us-central1"
BACKEND_SERVICE="coralbricks-backend"
CHAT_SERVICE="coralbricks-chat"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if required environment variables are set
if [ -z "$PROJECT_ID" ]; then
    print_error "GOOGLE_CLOUD_PROJECT environment variable is not set"
    exit 1
fi

# Ensure we're in the correct directory (www root)
if [ ! -d "../backend" ] || [ ! -d "../chat_js" ]; then
    print_error "This script must be run from the scripts directory in the www project root"
    exit 1
fi

print_status "Starting deployment for project: $PROJECT_ID"

# Step 1: Deploy Backend Service
print_step "1. Deploying Backend Service..."
print_status "Building and deploying $BACKEND_SERVICE..."

cd ..
gcloud builds submit --config=backend/cloudbuild.yaml .

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format='value(status.url)' 2>/dev/null || echo "")

if [ -z "$BACKEND_URL" ]; then
    print_error "Failed to get backend service URL. Backend deployment may have failed."
    exit 1
fi

print_status "Backend deployed successfully: $BACKEND_URL"

# Step 2: Deploy Chat Service
print_step "2. Deploying Chat Service..."
print_status "Building and deploying $CHAT_SERVICE with backend URL: $BACKEND_URL"

# Set frontend URL if provided, otherwise use default
FRONTEND_URL="${FRONTEND_URL:-https://your-frontend-domain.com}"

gcloud builds submit \
    --config=chat_js/cloudbuild.yaml \
    --substitutions=_BACKEND_URL="$BACKEND_URL",_FRONTEND_URL="$FRONTEND_URL" \
    .

# Get chat URL
CHAT_URL=$(gcloud run services describe $CHAT_SERVICE --region=$REGION --format='value(status.url)' 2>/dev/null || echo "")

if [ -z "$CHAT_URL" ]; then
    print_error "Failed to get chat service URL. Chat deployment may have failed."
    exit 1
fi

print_status "Chat service deployed successfully: $CHAT_URL"

# Step 3: Display Summary
print_step "3. Deployment Summary"
echo ""
print_status "✅ All services deployed successfully!"
echo ""
echo "Service URLs:"
echo "  📊 Backend:  $BACKEND_URL"
echo "  💬 Chat:     $CHAT_URL"
echo ""
print_status "Next steps:"
print_status "1. Update your frontend configuration:"
print_status "   - Backend API URL: $BACKEND_URL"
print_status "   - WebSocket URL: $CHAT_URL"
echo ""
print_status "2. Test service connectivity:"
print_status "   - Backend health: curl $BACKEND_URL/health"
print_status "   - Chat status: curl $CHAT_URL/api/status"
echo ""
print_status "3. Verify service-to-service communication:"
print_status "   - Chat should be able to reach backend at: $BACKEND_URL"
echo ""

# Optional: Test connectivity
if command -v curl &> /dev/null; then
    print_step "4. Testing Service Connectivity"
    
    echo "Testing backend health..."
    if curl -f -s "$BACKEND_URL/health" > /dev/null; then
        print_status "✅ Backend is healthy"
    else
        print_warning "⚠️  Backend health check failed"
    fi
    
    echo "Testing chat status..."
    if curl -f -s "$CHAT_URL/api/status" > /dev/null; then
        print_status "✅ Chat service is healthy"
    else
        print_warning "⚠️  Chat service status check failed"
    fi
fi

print_status "Deployment complete! 🚀"
