#!/bin/bash

# Deploy/Update backend Cloud Run service with environment variables from backend/.env

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying/Updating backend to Google Cloud Run...${NC}"

# Check if we're in the right directory
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}Error: backend/.env file not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Create environment variables string for gcloud command
ENV_VARS=""
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
            if [ -n "$ENV_VARS" ]; then
                ENV_VARS="$ENV_VARS,PORT=$value"
            else
                ENV_VARS="PORT=$value"
            fi
            ;;
        *)
            # Add other variables as-is, but skip certain local development variables
            case $key in
                "PORT"|"INTERNAL_PORT"|"NODE_ENV"|"QBO_SANDBOX"|"JWT_SECRET"|"JWT_EXPIRES_IN"|"SUPABASE_SERVICE_ROLE_KEY"|"SUPABASE_ANON_KEY"|"SUPABASE_URL"|"QBO_CLIENT_ID"|"QBO_CLIENT_SECRET"|"QBO_AUTH_URL"|"QBO_REDIRECT_URI"|"LOG_LEVEL"|"LOG_FILE"|"CORS_ORIGIN"|"RATE_LIMIT_WINDOW_MS"|"RATE_LIMIT_MAX_REQUESTS"|"DATABASE_URL")
                    if [ -n "$ENV_VARS" ]; then
                        ENV_VARS="$ENV_VARS,$key=$value"
                    else
                        ENV_VARS="$key=$value"
                    fi
                    ;;
                *)
                    # Skip other variables that might cause issues
                    echo -e "${YELLOW}Skipping variable: $key${NC}"
                    ;;
            esac
            ;;
    esac
done < backend/.env

# Override NODE_ENV for production
ENV_VARS=$(echo "$ENV_VARS" | sed 's/NODE_ENV=development/NODE_ENV=production/')

# Override PORT to 3010 for Cloud Run
ENV_VARS=$(echo "$ENV_VARS" | sed 's/PORT=3000/PORT=3010/')

# Update/redeploy the backend service
echo -e "${YELLOW}Updating backend service with environment variables...${NC}"

# Update the existing service with new environment variables
gcloud run services update backend \
    --region=us-central1 \
    --update-env-vars="$ENV_VARS"

# Get the service URL
SERVICE_URL=$(gcloud run services describe backend --region=us-central1 --format='value(status.url)')

echo -e "${GREEN}✅ Backend redeployment completed successfully!${NC}"
echo -e "${GREEN}Service URL: $SERVICE_URL${NC}"

# Test the health endpoint
echo -e "${YELLOW}Testing health endpoint in 10 seconds...${NC}"
sleep 10
if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed. The service might be starting up. Please check the logs:${NC}"
    echo -e "${YELLOW}gcloud logs read --service=backend --limit=20 --region=us-central1${NC}"
    
    # Try to get some logs
    echo -e "${YELLOW}Recent logs:${NC}"
    gcloud logs read --service=backend --limit=10 --region=us-central1 2>/dev/null || echo "Could not fetch logs"
fi

echo -e "${GREEN}Backend deployment complete!${NC}"
echo -e "${GREEN}Access your backend at: $SERVICE_URL${NC}"
