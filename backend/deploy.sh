#!/bin/bash

# Deploy Backend Service to Google Cloud Run
# This script builds and deploys the backend service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT}"
REGION="us-central1"
SERVICE_NAME="coralbricks-backend"

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
    print_error "cloudbuild.yaml not found. Make sure you're running this from the backend directory."
    exit 1
fi

print_status "Deploying backend service for project: $PROJECT_ID"

# Build and deploy from the parent directory (www) with backend config
print_status "Building and deploying $SERVICE_NAME..."

cd ..
gcloud builds submit --config=backend/cloudbuild.yaml .

# Get the deployed service URL
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

print_status "Backend service deployed successfully!"
print_status "Service URL: $BACKEND_URL"
print_status ""
print_status "Next steps:"
print_status "1. Test the backend health: curl $BACKEND_URL/health"
print_status "2. Deploy the chat service with: cd ../chat_js && ./deploy.sh"
print_status "3. The chat service will automatically use this backend URL"
