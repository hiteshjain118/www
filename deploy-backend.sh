#!/bin/bash

# Deploy backend to Google Cloud Run
# This script reads environment variables from backend/.env and deploys the backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting backend deployment to Google Cloud Run...${NC}"

# Check if we're in the right directory
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}Error: backend/.env file not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No Google Cloud project set. Please run 'gcloud config set project YOUR_PROJECT_ID'${NC}"
    exit 1
fi

echo -e "${YELLOW}Using Google Cloud project: $PROJECT_ID${NC}"

# Enable required APIs
echo -e "${YELLOW}Enabling required Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
echo -e "${YELLOW}Building and deploying with Cloud Build...${NC}"
gcloud builds submit --config cloudbuild.yaml .

# Set environment variables from .env file
echo -e "${YELLOW}Setting environment variables from backend/.env...${NC}"

# Read .env file and convert to Cloud Run format
ENV_VARS=""
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^[[:space:]]*# ]] || [[ -z $key ]]; then
        continue
    fi
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed 's/^"//; s/"$//')
    
    # Skip certain variables that shouldn't be set in production
    case $key in
        "PORT"|"NODE_ENV")
            continue
            ;;
        *)
            if [ -n "$ENV_VARS" ]; then
                ENV_VARS="$ENV_VARS,$key=$value"
            else
                ENV_VARS="$key=$value"
            fi
            ;;
    esac
done < backend/.env

# Update Cloud Run service with environment variables
if [ -n "$ENV_VARS" ]; then
    echo -e "${YELLOW}Updating Cloud Run service with environment variables...${NC}"
    gcloud run services update coralbricks-backend \
        --region=us-central1 \
        --set-env-vars="PORT=3010,NODE_ENV=production,$ENV_VARS"
else
    echo -e "${YELLOW}No additional environment variables to set.${NC}"
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe coralbricks-backend --region=us-central1 --format='value(status.url)')

echo -e "${GREEN}✅ Backend deployment completed successfully!${NC}"
echo -e "${GREEN}Service URL: $SERVICE_URL${NC}"
echo -e "${GREEN}Health check: $SERVICE_URL/health${NC}"

# Test the health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed. Please check the logs:${NC}"
    echo -e "${YELLOW}gcloud logs read --service=coralbricks-backend --limit=50${NC}"
fi
