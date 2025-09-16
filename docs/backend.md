# Backend Service Documentation

## Overview

The Coral Bricks backend service provides REST API endpoints and handles data processing, user authentication, and QuickBooks integration.

## Quick Deploy

```bash
# Individual deployment
cd backend && ./deploy.sh

# Or from www root
./deploy.sh  # Deploys all services
```

## Configuration

- **Service Name**: `coralbricks-backend`
- **Port**: 3010
- **Memory**: 1Gi
- **CPU**: 1 vCPU
- **Region**: us-central1

## Environment Variables

Key environment variables for backend deployment:

```bash
PORT=3010
NODE_ENV=production
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_key
QBO_CLIENT_ID=your_qbo_client_id
QBO_CLIENT_SECRET=your_qbo_client_secret
```

## API Endpoints

### Authentication
- `POST /login` - User authentication
- `POST /login/signup` - User registration

### QuickBooks Integration
- `GET /qbo/auth` - QBO OAuth initiation
- `POST /qbo/callback` - QBO OAuth callback
- `GET /qbo/data` - Retrieve QBO data

### Internal Tools API
- `GET /tools` - List available tools for user
- `POST /{tool_name}` - Execute specific tool

### Health Check
- `GET /health` - Service health status

## Database Schema

The backend uses Prisma ORM with the following key models:

- **User**: User accounts and authentication
- **QBOProfile**: QuickBooks integration profiles
- **Thread**: Chat conversation threads
- **Message**: Chat messages
- **ToolCall**: Tool execution logs

## Deployment Files

- `backend/cloudbuild.yaml` - Cloud Build configuration
- `backend/deploy.sh` - Deployment script
- `backend/Dockerfile` - Container configuration
- `backend/DEPLOY.md` - Quick deployment guide

## Development

### Local Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure environment variables
npm run dev
```

### Testing
```bash
npm test
npm run test:watch
```

### Building
```bash
npm run build
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Verify `DATABASE_URL` is correct
2. **QBO Integration**: Check `QBO_CLIENT_ID` and `QBO_CLIENT_SECRET`
3. **Supabase**: Ensure `SUPABASE_URL` and service key are valid

### Logs
```bash
# View service logs
gcloud logs read --service=coralbricks-backend --limit=50

# Local logs
tail -f backend/logs/error.log
```

### Health Check
```bash
curl https://your-backend-url.run.app/health
```

For more detailed internal tools documentation, see the files in `backend/` directory.
