# Coral Bricks Deployment Guide

This guide explains how to deploy the Coral Bricks application to Google Cloud Platform with proper service-to-service communication.

## Architecture Overview

The application consists of three main components:
- **Backend Service** (`coralbricks-backend`) - REST API and data processing
- **Chat Service** (`coralbricks-chat`) - WebSocket server and AI chat functionality
- **Frontend** - React application (typically deployed to Firebase Hosting or similar)

## Service Communication

```
Frontend → Backend API (REST)
Frontend → Chat Service (WebSocket)
Chat Service → Backend API (Internal communication via INTERNAL_API_URL)
```

## Directory Structure

```
www/
├── backend/
│   ├── cloudbuild.yaml    # Backend Cloud Build config
│   ├── deploy.sh          # Backend deployment script
│   └── DEPLOY.md          # Backend deployment guide
├── chat_js/
│   ├── cloudbuild.yaml    # Chat service Cloud Build config
│   ├── deploy.sh          # Chat service deployment script
│   └── DEPLOY.md          # Chat service deployment guide
├── frontend/              # Frontend application
├── scripts/
│   ├── deploy-all.sh      # Deploy all services
│   ├── update-frontend-urls.sh # Update frontend config
│   ├── setup-env.sh       # Environment setup
│   ├── validate-docker.sh # Docker validation
│   └── start.sh           # Local development start
├── deploy.sh              # Simple wrapper for deployment
└── DEPLOYMENT_GUIDE.md    # This file
```

## Prerequisites

1. **Google Cloud Project** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **Required APIs enabled**:
   - Cloud Build API
   - Cloud Run API
   - Container Registry API
4. **Environment variables set**:
   ```bash
   export GOOGLE_CLOUD_PROJECT=your-project-id
   ```

## Deployment Methods

### Method 1: Deploy All Services (Recommended)

Use the automated deployment script:

```bash
# Deploy both backend and chat services (from www root)
./deploy.sh

# Or run directly from scripts directory
cd scripts && ./deploy-all.sh
```

This script will:
1. Deploy the backend service first
2. Get the backend URL
3. Deploy the chat service with the correct `INTERNAL_API_URL`
4. Display service URLs and next steps

### Method 2: Manual Step-by-Step Deployment

#### Step 1: Deploy Backend Service

```bash
# From the www root directory
gcloud builds submit --config=backend/cloudbuild.yaml .

# Or from the backend directory
cd backend && ./deploy.sh
```

#### Step 2: Get Backend URL

```bash
BACKEND_URL=$(gcloud run services describe coralbricks-backend --region=us-central1 --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

#### Step 3: Deploy Chat Service

```bash
# From the www root directory
gcloud builds submit \
  --config=chat_js/cloudbuild.yaml \
  --substitutions=_BACKEND_URL="$BACKEND_URL",_FRONTEND_URL="https://your-frontend-domain.com" \
  .

# Or from the chat_js directory
cd chat_js && ./deploy.sh
```

#### Step 4: Update Frontend Configuration

```bash
# Auto-generate frontend configuration
cd scripts && ./update-frontend-urls.sh

# Or manually create frontend/.env.production:
VITE_BACKEND_API_URL=https://coralbricks-backend-HASH-uc.a.run.app
VITE_CHAT_WEBSOCKET_URL=wss://coralbricks-chat-HASH-uc.a.run.app
VITE_NODE_ENV=production
```

## Configuration Files

### Backend Configuration (`backend/cloudbuild.yaml`)
- Deploys backend service to Cloud Run
- Sets up environment variables
- Configures memory, CPU, and scaling
- Individual deployment: `cd backend && ./deploy.sh`

### Chat Service Configuration (`chat_js/cloudbuild.yaml`)
- Deploys chat service to Cloud Run
- **Critical**: Sets `INTERNAL_API_URL` to point to the backend service
- Configures CORS origins for frontend communication
- Sets up WebSocket configuration
- Individual deployment: `cd chat_js && ./deploy.sh`

### Environment Variables

#### Backend Service
- `PORT`: Service port (3010)
- `NODE_ENV`: Environment (production)
- Standard backend environment variables

#### Chat Service
- `PORT`: Service port (3004)
- `NODE_ENV`: Environment (production)
- **`INTERNAL_API_URL`**: URL of the backend service (critical for service communication)
- `CORS_ORIGIN`: Allowed origins for WebSocket connections
- `WS_HOST`: WebSocket host (0.0.0.0 for Cloud Run)
- `WS_PORT`: WebSocket port (3004)

## Troubleshooting

### Chat Service Cannot Reach Backend

**Symptoms**: Chat service logs show connection errors to backend API

**Solution**: Verify `INTERNAL_API_URL` is correctly set:
```bash
# Check chat service environment variables
gcloud run services describe coralbricks-chat --region=us-central1 --format='value(spec.template.spec.containers[0].env)'

# Update if needed
gcloud run services update coralbricks-chat \
  --region=us-central1 \
  --set-env-vars=INTERNAL_API_URL=https://your-backend-url.run.app
```

### CORS Errors in Frontend

**Symptoms**: Browser console shows CORS errors when connecting to chat service

**Solution**: Update CORS origins in chat service:
```bash
gcloud run services update coralbricks-chat \
  --region=us-central1 \
  --set-env-vars=CORS_ORIGIN=https://your-frontend-domain.com
```

### WebSocket Connection Fails

**Symptoms**: Frontend cannot establish WebSocket connection

**Checklist**:
1. Frontend is using `wss://` (not `ws://`) for production
2. Chat service is deployed and healthy
3. CORS origins include your frontend domain

## Service URLs

After deployment, your services will be available at:
- Backend: `https://coralbricks-backend-[HASH]-uc.a.run.app`
- Chat: `https://coralbricks-chat-[HASH]-uc.a.run.app`

## Security Considerations

1. **Secrets Management**: Store sensitive environment variables in Google Secret Manager
2. **Service Authentication**: Consider implementing service-to-service authentication
3. **CORS Configuration**: Restrict CORS origins to your actual frontend domains
4. **Network Security**: Services communicate over HTTPS within Google Cloud

## Monitoring and Logging

- View logs: `gcloud logs read --service=coralbricks-backend --limit=50`
- Monitor services in Google Cloud Console → Cloud Run
- Set up alerts for service health and performance

## Scaling Configuration

Current configuration:
- **Memory**: Backend (1Gi), Chat (2Gi)
- **CPU**: 1 vCPU per service
- **Max Instances**: 10 per service

Adjust based on your traffic needs in the Cloud Build configurations.

## Next Steps After Deployment

1. **Test service connectivity**:
   ```bash
   curl https://your-backend-url.run.app/health
   curl https://your-chat-url.run.app/api/status
   ```

2. **Deploy frontend** with the generated configuration

3. **Set up monitoring** and alerting

4. **Configure custom domains** if needed

5. **Set up CI/CD pipelines** for automated deployments
