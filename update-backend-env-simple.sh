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

# Create a temporary env file for Cloud Run
TEMP_ENV_FILE=$(mktemp)

# Read .env file and convert to Cloud Run format
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^[[:space:]]*# ]] || [[ -z $key ]]; then
        continue
    fi
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed 's/^"//; s/"$//')
    
    # Handle specific variables
    case $key in
        "MAIN_PORT")
            # Map MAIN_PORT to PORT for Cloud Run
            echo "PORT=$value" >> "$TEMP_ENV_FILE"
            ;;
        *)
            # Add other variables as-is
            echo "$key=$value" >> "$TEMP_ENV_FILE"
            ;;
    esac
done < backend/.env

# Ensure NODE_ENV is set to production for Cloud Run
if ! grep -q "NODE_ENV" "$TEMP_ENV_FILE"; then
    echo "NODE_ENV=production" >> "$TEMP_ENV_FILE"
fi

echo -e "${YELLOW}Environment variables to be set:${NC}"
cat "$TEMP_ENV_FILE"

# Update Cloud Run service with environment variables using file
echo -e "${YELLOW}Updating Cloud Run service...${NC}"
gcloud run services update backend \
    --region=us-central1 \
    --env-vars-file="$TEMP_ENV_FILE"

# Clean up temp file
rm "$TEMP_ENV_FILE"

# Get the service URL
SERVICE_URL=$(gcloud run services describe backend --region=us-central1 --format='value(status.url)')

echo -e "${GREEN}✅ Backend environment variables updated successfully!${NC}"
echo -e "${GREEN}Service URL: $SERVICE_URL${NC}"

# Test the health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
sleep 5  # Wait a bit for the service to restart
if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed. The service might be starting up. Please check the logs:${NC}"
    echo -e "${YELLOW}gcloud logs read --service=backend --limit=20${NC}"
fi
