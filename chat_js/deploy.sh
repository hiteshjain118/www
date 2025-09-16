#!/bin/bash

# Deploy Chat JS Service to Google Cloud Run
# This script builds and deploys the chat_js service with proper configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT}"
REGION="us-central1"
SERVICE_NAME="coralbricks-chat"

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

# Check if required environment variables are set
if [ -z "$PROJECT_ID" ]; then
    print_error "GOOGLE_CLOUD_PROJECT environment variable is not set"
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "cloudbuild.yaml" ]; then
    print_error "cloudbuild.yaml not found. Make sure you're running this from the chat_js directory."
    exit 1
fi

# Check if backend service exists to get its URL
print_status "Getting backend service URL..."
BACKEND_URL=$(gcloud run services describe coralbricks-backend --region=$REGION --format='value(status.url)' 2>/dev/null || echo "")

if [ -z "$BACKEND_URL" ]; then
    print_warning "Backend service not found. Please deploy the backend first or provide BACKEND_URL manually."
    echo "Usage: BACKEND_URL=https://your-backend-url.run.app $0"
    exit 1
fi

print_status "Using backend URL: $BACKEND_URL"

# Build and deploy from the parent directory (www) with chat_js config
print_status "Building and deploying chat_js service..."

cd ..
gcloud builds submit \
    --config=chat_js/cloudbuild.yaml \
    --substitutions=_BACKEND_URL="$BACKEND_URL",_FRONTEND_URL="${FRONTEND_URL:-https://your-frontend-domain.com}" \
    .

# Get the deployed service URL
CHAT_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

print_status "Chat service deployed successfully!"
print_status "Service URL: $CHAT_URL"
print_status ""
print_status "Next steps:"
print_status "1. Update your frontend configuration to use: $CHAT_URL"
print_status "2. Test the WebSocket connection"
print_status "3. Verify service-to-service communication between chat and backend"
