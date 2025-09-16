# Chat Service Documentation

## Overview

The chat service handles WebSocket connections, AI chat functionality, and tool execution. It communicates with the backend service via the `INTERNAL_API_URL`.

## Quick Deploy

```bash
# Individual deployment
cd chat_js && ./deploy.sh

# Or from www root
./deploy.sh  # Deploys all services
```

## Critical Configuration

The chat service **requires** the backend service to be deployed first, as it needs the `INTERNAL_API_URL`:

```bash
INTERNAL_API_URL=https://coralbricks-backend-HASH-uc.a.run.app
```

## Service Configuration

- **Service Name**: `coralbricks-chat`
- **Port**: 3004
- **Memory**: 2Gi
- **CPU**: 1 vCPU
- **Region**: us-central1

## Environment Variables

### Critical Variables
- `INTERNAL_API_URL` - Backend service URL (set automatically during deployment)
- `CORS_ORIGIN` - Allowed frontend origins
- `OPENAI_API_KEY` - OpenAI API key for AI functionality

### WebSocket Configuration
- `WS_HOST=0.0.0.0` - WebSocket host (for Cloud Run)
- `WS_PORT=3004` - WebSocket port

### Other Configuration
```bash
PORT=3004
NODE_ENV=production
INTENT_SERVER_ENABLED=true
DEFAULT_INTENT=qb
RATE_LIMIT_ENABLED=true
MAX_CONNECTIONS_PER_IP=10
SESSION_TIMEOUT=3600000
MAX_SESSIONS=1000
```

## Architecture

### Core Components

1. **WebSocket Server**: Handles real-time communication with frontend
2. **Intent Server**: Processes AI chat intents (QuickBooks, general chat)
3. **Tool Call Runner**: Executes tools via backend API calls
4. **Session Manager**: Manages user sessions and connections

### AI Integration

- **GPT Provider**: OpenAI GPT-4 integration
- **Model I/O**: Handles prompts and responses
- **Tool Execution**: Runs QuickBooks and other business tools

### Service Communication

```
Frontend ←→ Chat Service (WebSocket)
Chat Service ←→ Backend Service (REST API via INTERNAL_API_URL)
```

## API Endpoints

### Status & Health
- `GET /api/status` - Service status
- `GET /api/clients` - Active WebSocket connections

### WebSocket Connection
- `ws://localhost:3004` (development)
- `wss://your-chat-url.run.app` (production)

## WebSocket Message Format

### Client → Server
```json
{
  "type": "chat",
  "message": "User message text",
  "threadId": "thread-id",
  "messageId": "unique-message-id"
}
```

### Server → Client
```json
{
  "type": "chat",
  "message": "AI response text",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

## Deployment Files

- `chat_js/cloudbuild.yaml` - Cloud Build configuration
- `chat_js/deploy.sh` - Deployment script
- `chat_js/Dockerfile` - Container configuration
- `chat_js/DEPLOY.md` - Quick deployment guide

## Development

### Local Setup
```bash
cd chat_js
npm install
cp env.example .env  # Configure environment variables
npm run dev
```

### Environment Setup
```bash
# Required for local development
INTERNAL_API_URL=http://localhost:3010
OPENAI_API_KEY=your_openai_key
```

### Testing
```bash
npm test
npm run test:watch
```

## Integration Guides

### Prisma Implementation
See `chat_js/PRISMA_IMPLEMENTATION.md` for database integration details.

### QuickBooks Integration
See `chat_js/QUICKBOOKS_README.md` for QBO-specific setup.

### GPT Provider
See `chat_js/GPT_PROVIDER_README.md` for AI model configuration.

### Task Model
See `chat_js/TASK_MODEL_IMPLEMENTATION.md` for task execution details.

## Troubleshooting

### Chat Service Can't Reach Backend

Check the `INTERNAL_API_URL`:
```bash
gcloud run services describe coralbricks-chat --region=us-central1 \
  --format='value(spec.template.spec.containers[0].env)'
```

Update if needed:
```bash
gcloud run services update coralbricks-chat \
  --region=us-central1 \
  --set-env-vars=INTERNAL_API_URL=https://your-backend-url.run.app
```

### WebSocket Connection Fails

1. **CORS Issues**: Update CORS origins
   ```bash
   gcloud run services update coralbricks-chat \
     --region=us-central1 \
     --set-env-vars=CORS_ORIGIN=https://your-frontend-domain.com
   ```

2. **Frontend URL**: Ensure frontend uses `wss://` for production

3. **Service Health**: Check service status
   ```bash
   curl https://your-chat-url.run.app/api/status
   ```

### Logs
```bash
# View service logs
gcloud logs read --service=coralbricks-chat --limit=50

# Local logs
tail -f chat_js/logs/chat-server.log
```

## Dependencies

The chat service depends on:
1. **Backend Service**: Must be deployed first for `INTERNAL_API_URL`
2. **OpenAI API**: For AI functionality
3. **Database**: Shared with backend (via backend API calls)

For detailed implementation documentation, see the files in `chat_js/` directory.
