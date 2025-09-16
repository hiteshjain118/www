# Docker Setup Guide - Flexible Deployment Options

This guide explains how to run CoralBricks services using Docker with both individual and orchestrated deployment options.

## Overview

The application consists of two independent services:
- **Backend**: Authentication and API service (port 3001)
- **Chat-JS**: Real-time WebSocket chat service (port 3004)

## Deployment Options

1. **Individual Service Deployment**: Each service runs in separate containers
2. **Docker Compose Orchestration**: Both services managed together with networking

## Prerequisites

- Docker installed on your system
- Environment variables configured for each service (see Environment Setup section)

## Quick Start

### Option A: Docker Compose (Recommended for Development)

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd www
   ```

2. **Set up environment variables**
   ```bash
   # For docker-compose (optional - has defaults)
   cp .env.example .env  # Edit with your values
   
   # Or setup individual service .env files
   cp backend/config.env.example backend/.env
   cp chat_js/env.example chat_js/.env
   ```

3. **Build and run with Docker Compose**
   ```bash
   # Production mode
   npm run docker:compose:up
   
   # Development mode (with ts-node)
   npm run docker:compose:up:dev
   
   # Background mode
   npm run docker:compose:up:detached
   ```

### Option B: Individual Services

1. **Setup as above**

2. **Build services individually**
   ```bash
   npm run docker:build:backend
   npm run docker:build:chat
   ```

3. **Run services individually**
   ```bash
   # Terminal 1 - Backend
   npm run docker:run:backend
   
   # Terminal 2 - Chat service
   npm run docker:run:chat
   ```

### Access Services

- Backend API: http://localhost:3001
- Chat Service: http://localhost:3004
- Health checks: 
  - http://localhost:3001/health
  - http://localhost:3004/api/status

## Available Docker Commands

### Docker Compose Commands (Orchestrated)
```bash
# Build services
npm run docker:compose:build

# Run services (foreground)
npm run docker:compose:up

# Run in development mode (ts-node for chat-js)
npm run docker:compose:up:dev

# Run services (background)
npm run docker:compose:up:detached

# Stop services
npm run docker:compose:down

# View logs
npm run docker:compose:logs

# Restart services
npm run docker:compose:restart
```

### Individual Service Commands
```bash
# Build Commands
npm run docker:build:backend
npm run docker:build:chat
npm run docker:build:chat:dev

# Run Commands
npm run docker:run:backend
npm run docker:run:chat
npm run docker:run:chat:dev
```

### Individual Service Commands
```bash
# Backend service
cd backend
docker build -t coralbricks-backend .
docker run -p 3001:3001 --env-file .env coralbricks-backend

# Chat service (production)
cd chat_js
docker build -t coralbricks-chat .
docker run -p 3004:3004 --env-file .env coralbricks-chat

# Chat service (development)
cd chat_js
docker build -f Dockerfile.dev -t coralbricks-chat:dev .
docker run -p 3004:3004 --env-file .env coralbricks-chat:dev
```

### Management Commands
```bash
# View logs from running containers
docker logs <container_name>
docker logs -f <container_name>  # Follow logs

# Stop running containers
docker stop <container_name>

# Remove containers
docker rm <container_name>

# List running containers
docker ps

# Execute commands in running container
docker exec -it <container_name> sh
docker exec -it <container_name> npm test

# View resource usage
docker stats
```

## Environment Setup

### Backend Environment Variables
Create `backend/.env` with:
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

### Chat-JS Environment Variables
Create `chat_js/.env` with:
```env
NODE_ENV=development
PORT=3004
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
LOG_LEVEL=debug
LOG_FILE=logs/chat-service.log
```

## Service Architecture

### Backend Service
- **Base Image**: Node.js 18 Alpine
- **Port**: 3001
- **Health Check**: GET /health
- **Build Context**: `./backend`
- **Dependencies**: Express, Supabase, QuickBooks SDK

### Chat-JS Service
- **Base Image**: Node.js 18 Alpine
- **Port**: 3004
- **Health Check**: GET /api/status
- **Build Context**: `./chat_js`
- **Dependencies**: WebSocket, Prisma, Supabase
- **Build Options**:
  - **Production** (`Dockerfile`): Multi-stage build with compiled TypeScript
  - **Development** (`Dockerfile.dev`): Single-stage build with ts-node

## Development Workflow

### Chat-JS Build Modes

**Production Mode (Default)**
- Uses multi-stage Docker build
- Compiles TypeScript to JavaScript (`npm run build`)
- Runs compiled `dist/server.js` with Node.js
- Smaller final image (production dependencies only)
- Faster startup time

**Development Mode**
- Single-stage Docker build  
- Uses `ts-node` for direct TypeScript execution
- Includes all dev dependencies (TypeScript compiler, etc.)
- Larger image but easier for development/debugging
- Use when you need to modify code frequently

### Local Development with Docker
```bash
# Start services in development mode
npm run docker:run:backend
npm run docker:run:chat:dev

# Make code changes
# For chat service: use development mode with volume mounting
cd chat_js
docker run -p 3004:3004 --env-file .env -v $(pwd):/app coralbricks-chat:dev

# Rebuild after changes
npm run docker:build:backend
npm run docker:build:chat
```

### Production Deployment
```bash
# Build production images with tags
cd backend
docker build -t coralbricks-backend:v1.0.0 .

cd ../chat_js
docker build -t coralbricks-chat:v1.0.0 .

# Run in production mode with proper settings
docker run -d --name backend-prod -p 3001:3001 --env-file .env coralbricks-backend:v1.0.0
docker run -d --name chat-prod -p 3004:3004 --env-file .env coralbricks-chat:v1.0.0

# Monitor logs
docker logs -f backend-prod
docker logs -f chat-prod
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :3001
   lsof -i :3004
   
   # Change ports in docker-compose.yml if needed
   ```

2. **Environment variables not loaded**
   ```bash
   # Verify .env files exist
   ls -la backend/.env chat_js/.env
   
   # Check container environment
   docker-compose exec backend env
   ```

3. **Build failures**
   ```bash
   # Clean build cache
   docker system prune -f
   
   # Remove images and rebuild
   docker rmi coralbricks-backend coralbricks-chat
   npm run docker:build:backend
   npm run docker:build:chat
   ```

4. **Health check failures**
   ```bash
   # Check container status
   docker ps
   
   # View specific service logs
   docker logs backend
   docker logs chat
   ```

### Debugging

1. **Access container shell**
   ```bash
   docker exec -it backend sh
   docker exec -it chat sh
   ```

2. **Check logs in real-time**
   ```bash
   docker logs -f --tail=100 backend
   ```

3. **Inspect container configuration**
   ```bash
   docker inspect backend
   docker inspect chat
   ```

## Network Configuration

Services run on individual containers:
- Backend service: localhost:3001
- Chat-JS service: localhost:3004
- Services can communicate via host networking or custom Docker networks if needed
- Each service can access external networks independently

## Volume Mounts

- **Logs**: `./backend/logs` → `/app/logs` (backend)
- **Logs**: `./chat_js/logs` → `/app/logs` (chat-js)
- **Environment**: `.env` files are mounted as read-only

## Security Considerations

1. **Non-root user**: Containers run as user `nodejs` (UID 1001)
2. **Environment variables**: Sensitive data should be in `.env` files
3. **Network isolation**: Services communicate through internal Docker network
4. **Health checks**: Automatic container health monitoring

## Performance Optimization

1. **Multi-stage builds**: Consider implementing for smaller production images
2. **Layer caching**: Dependencies are installed before copying source code
3. **Resource limits**: Add memory/CPU limits in docker-compose.yml if needed

```yaml
# Example resource limits
services:
  backend:
    # ... other config
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

## Next Steps

1. Set up CI/CD pipeline for automated builds
2. Configure log aggregation (ELK stack, etc.)
3. Add monitoring and alerting
4. Implement backup strategies for persistent data
5. Consider Kubernetes deployment for production scaling 