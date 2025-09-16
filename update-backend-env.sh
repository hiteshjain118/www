#!/bin/bash

# Update backend Cloud Run service with environment variables from backend/.env

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Updating backend environment variables...${NC}"

# Check if we're in the right directory
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}Error: backend/.env file not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Read .env file and convert to Cloud Run format
ENV_VARS=""
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^[[:space:]]*# ]] || [[ -z $key ]]; then
        continue
    fi
    
    # Remove quotes from value if present and escape special characters
    value=$(echo "$value" | sed 's/^"//; s/"$//' | sed 's/:/\\:/g')
    
    # Handle specific variables
    case $key in
        "MAIN_PORT")
            # Map MAIN_PORT to PORT for Cloud Run
            if [ -n "$ENV_VARS" ]; then
                ENV_VARS="$ENV_VARS,PORT=$value"
            else
                ENV_VARS="PORT=$value"
            fi
            ;;
        "PORT"|"NODE_ENV")
            # Add these as-is
            if [ -n "$ENV_VARS" ]; then
                ENV_VARS="$ENV_VARS,$key=$value"
            else
                ENV_VARS="$key=$value"
            fi
            ;;
        *)
            # Add other variables
            if [ -n "$ENV_VARS" ]; then
                ENV_VARS="$ENV_VARS,$key=$value"
            else
                ENV_VARS="$key=$value"
            fi
            ;;
    esac
done < backend/.env

# Ensure NODE_ENV is set to production for Cloud Run
if [[ ! $ENV_VARS =~ NODE_ENV ]]; then
    ENV_VARS="$ENV_VARS,NODE_ENV=production"
fi

# Update Cloud Run service with environment variables
echo -e "${YELLOW}Setting environment variables...${NC}"
gcloud run services update backend \
    --region=us-central1 \
    --set-env-vars="$ENV_VARS"

# Get the service URL
SERVICE_URL=$(gcloud run services describe backend --region=us-central1 --format='value(status.url)')

echo -e "${GREEN}✅ Backend environment variables updated successfully!${NC}"
echo -e "${GREEN}Service URL: $SERVICE_URL${NC}"

# Test the health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed. The service might be starting up. Please check the logs:${NC}"
    echo -e "${YELLOW}gcloud logs read --service=backend --limit=20${NC}"
fi

echo -e "${GREEN}Environment variables that were set:${NC}"
echo -e "${YELLOW}$ENV_VARS${NC}"
