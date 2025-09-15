# Backend Service - Docker Setup

This guide explains how to run the CoralBricks backend service using Docker.

## Overview

The backend service provides:
- Authentication and authorization
- QuickBooks OAuth integration
- API endpoints for user management
- Thread and pipeline management

## Prerequisites

- Docker installed on your system
- Environment variables configured

## Quick Start

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Set up environment variables**
   ```bash
   cp config.env.example .env
   # Edit .env with your actual values
   ```

3. **Build the Docker image**
   ```bash
   docker build -t coralbricks-backend .
   ```

4. **Run the container**
   ```bash
   docker run -p 3001:3001 --env-file .env coralbricks-backend
   ```

5. **Access the service**
   - API: http://localhost:3001
   - Health check: http://localhost:3001/health
   - Status: http://localhost:3001/status

## Environment Variables

Create `.env` file with:
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
QBO_CLIENT_ID=your-quickbooks-client-id
QBO_CLIENT_SECRET=your-quickbooks-client-secret
QBO_AUTH_URL=https://appcenter.intuit.com/connect/oauth2
QBO_REDIRECT_URI=http://localhost:3001/auth/quickbooks/callback
CORS_ORIGIN=http://localhost:3001
LOG_LEVEL=debug
LOG_FILE=logs/auth-service.log
```

## Docker Commands

### Basic Operations
```bash
# Build image
docker build -t coralbricks-backend .

# Run container
docker run -p 3001:3001 --env-file .env coralbricks-backend

# Run in background
docker run -d -p 3001:3001 --env-file .env --name backend coralbricks-backend

# Stop container
docker stop backend

# Remove container
docker rm backend

# View logs
docker logs backend
docker logs -f backend  # Follow logs
```

### Development
```bash
# Run with volume mounting for logs
docker run -p 3001:3001 --env-file .env -v $(pwd)/logs:/app/logs coralbricks-backend

# Access container shell
docker run -it --entrypoint sh coralbricks-backend

# Run container with custom command
docker run -p 3001:3001 --env-file .env coralbricks-backend npm run dev
```

## Service Architecture

- **Base Image**: Node.js 18 Alpine
- **Port**: 3001
- **Health Check**: GET /health
- **Main Entry**: `dist/index.js` (compiled from TypeScript)
- **Build Process**: `npm run build` (TypeScript compilation)

## Available Endpoints

- `GET /health` - Health check
- `GET /status` - Service status and configuration
- `POST /login` - User authentication
- `POST /login/signup` - User registration
- `GET /profile/<cbid>` - User profile
- `GET /quickbooks/*` - QuickBooks OAuth and profile management
- `GET /threads` - Thread management
- `GET /pipelines` - Pipeline operations

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 3001
   lsof -i :3001
   
   # Use different port
   docker run -p 3002:3001 --env-file .env coralbricks-backend
   ```

2. **Environment variables not loaded**
   ```bash
   # Verify .env file exists and has correct format
   cat .env
   
   # Check environment inside container
   docker run --env-file .env coralbricks-backend env
   ```

3. **Health check failures**
   ```bash
   # Check container logs
   docker logs <container_name>
   
   # Test health endpoint manually
   curl http://localhost:3001/health
   ```

## Production Deployment

For production deployment, consider:

1. **Use specific image tags**
   ```bash
   docker build -t coralbricks-backend:v1.0.0 .
   ```

2. **Set production environment**
   ```bash
   docker run -e NODE_ENV=production -p 3001:3001 --env-file .env coralbricks-backend
   ```

3. **Add resource limits**
   ```bash
   docker run --memory=512m --cpus=0.5 -p 3001:3001 --env-file .env coralbricks-backend
   ```

4. **Use Docker secrets for sensitive data**
5. **Set up proper logging and monitoring**
6. **Configure backup strategies**

## Security Considerations

- Container runs as non-root user (nodejs:1001)
- Sensitive data managed through environment variables
- Health checks for container monitoring
- Proper file permissions in container 